import { Request, Response, Express } from "express";
import { z } from "zod";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import path from "path";
import fs from "fs";
import multer from "multer";
import { promises as fsPromises } from "fs";
import { db } from "./db";
import { items, equipments } from "@shared/schema";
import { eq } from "drizzle-orm";

// Define upload directory and storage
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "items");

// Ensure the upload directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory at ${UPLOAD_DIR}`);
  }
} catch (error) {
  console.error("Error creating upload directory:", error);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Create unique filename using timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for image uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Create the multer upload instance
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Register item management routes
export function registerItemManagementRoutes(app: Express) {
  // Get all items
  app.get("/api/admin/items", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const allItems = await db.select().from(items);
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items", error: error.message });
    }
  });

  // Get a specific item
  app.get("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const [item] = await db.select().from(items).where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item", error: error.message });
    }
  });

  // Create a new item
  app.post(
    "/api/admin/items", 
    isAuthenticated, 
    isAdmin, 
    upload.single('image'),
    async (req: Request, res: Response) => {
      try {
        const itemSchema = z.object({
          name: z.string().min(1, "Name is required"),
          description: z.string().min(1, "Description is required"),
          type: z.string().min(1, "Type is required"),
          category: z.string().optional(),
          price: z.coerce.number().min(0, "Price must be a positive number"),
          level: z.coerce.number().int().min(1, "Level must be at least 1").optional(),
          rarity: z.string().optional(),
          strengthBonus: z.coerce.number().default(0),
          stealthBonus: z.coerce.number().default(0),
          charismaBonus: z.coerce.number().default(0),
          intelligenceBonus: z.coerce.number().default(0),
          crimeSuccessBonus: z.coerce.number().default(0),
          jailTimeReduction: z.coerce.number().default(0),
          escapeChanceBonus: z.coerce.number().default(0),
        });
        
        // Parse and validate the request body
        const validatedData = itemSchema.parse(req.body);
        
        // Prepare the item data
        const itemData = {
          ...validatedData,
          imageUrl: req.file ? `/images/items/${req.file.filename}` : null,
        };

        // Insert the item into the database
        const [newItem] = await db.insert(items).values(itemData).returning();
        
        res.status(201).json(newItem);
      } catch (error) {
        console.error("Error creating item:", error);
        
        // If it's a Zod validation error, return the validation issues
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ 
          message: "Failed to create item", 
          error: error.message 
        });
      }
    }
  );

  // Update an existing item
  app.put(
    "/api/admin/items/:id", 
    isAuthenticated, 
    isAdmin, 
    upload.single('image'),
    async (req: Request, res: Response) => {
      try {
        const itemId = parseInt(req.params.id);
        
        // Check if the item exists
        const [existingItem] = await db.select().from(items).where(eq(items.id, itemId));
        
        if (!existingItem) {
          return res.status(404).json({ message: "Item not found" });
        }
        
        const itemSchema = z.object({
          name: z.string().min(1, "Name is required"),
          description: z.string().min(1, "Description is required"),
          type: z.string().min(1, "Type is required"),
          category: z.string().optional(),
          price: z.coerce.number().min(0, "Price must be a positive number"),
          level: z.coerce.number().int().min(1, "Level must be at least 1").optional(),
          rarity: z.string().optional(),
          strengthBonus: z.coerce.number().default(0),
          stealthBonus: z.coerce.number().default(0),
          charismaBonus: z.coerce.number().default(0),
          intelligenceBonus: z.coerce.number().default(0),
          crimeSuccessBonus: z.coerce.number().default(0),
          jailTimeReduction: z.coerce.number().default(0),
          escapeChanceBonus: z.coerce.number().default(0),
        });
        
        // Parse and validate the request body
        const validatedData = itemSchema.parse(req.body);
        
        // Prepare update data
        const updateData: any = {
          ...validatedData,
        };
        
        // If a new image was uploaded, update the imageUrl
        if (req.file) {
          // If the item already has an image, delete the old one
          if (existingItem.imageUrl) {
            try {
              const oldImagePath = path.join(process.cwd(), "public", existingItem.imageUrl);
              // Check if file exists before attempting to delete
              if (fs.existsSync(oldImagePath)) {
                await fsPromises.unlink(oldImagePath);
                console.log(`Deleted old image: ${oldImagePath}`);
              }
            } catch (err) {
              console.error("Error deleting old image:", err);
              // Continue with the update even if the delete fails
            }
          }
          
          // Set the new image URL
          updateData.imageUrl = `/images/items/${req.file.filename}`;
        }
        
        // Update the item in the database
        const [updatedItem] = await db
          .update(items)
          .set(updateData)
          .where(eq(items.id, itemId))
          .returning();
        
        res.json(updatedItem);
      } catch (error) {
        console.error("Error updating item:", error);
        
        // If it's a Zod validation error, return the validation issues
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ 
          message: "Failed to update item", 
          error: error.message 
        });
      }
    }
  );

  // Delete an item
  app.delete("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Check if the item exists
      const [existingItem] = await db.select().from(items).where(eq(items.id, itemId));
      
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Check if the item is equipped by any user
      const equipmentCount = await db
        .select({ count: db.fn.count() })
        .from(equipments)
        .where(eq(equipments.itemId, itemId));
      
      if (equipmentCount[0].count > 0) {
        return res.status(400).json({ 
          message: "Cannot delete an item that is currently equipped by users"
        });
      }
      
      // Delete the item's image if it exists
      if (existingItem.imageUrl) {
        try {
          const imagePath = path.join(process.cwd(), "public", existingItem.imageUrl);
          if (fs.existsSync(imagePath)) {
            await fsPromises.unlink(imagePath);
            console.log(`Deleted image: ${imagePath}`);
          }
        } catch (err) {
          console.error("Error deleting image:", err);
          // Continue with the delete even if the image delete fails
        }
      }
      
      // Delete the item from the database
      const [deletedItem] = await db
        .delete(items)
        .where(eq(items.id, itemId))
        .returning();
      
      res.json({ message: "Item deleted successfully", item: deletedItem });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ 
        message: "Failed to delete item", 
        error: error.message 
      });
    }
  });

  // Get all items (public endpoint)
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const allItems = await db.select().from(items);
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items", error: error.message });
    }
  });

  // Get a specific item (public endpoint)
  app.get("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const [item] = await db.select().from(items).where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item", error: error.message });
    }
  });
}