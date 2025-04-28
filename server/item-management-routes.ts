import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import { db } from "./db";
import { items } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const itemsDir = path.join(process.cwd(), "public", "images", "items");
    // Make sure the directory exists
    if (!fs.existsSync(itemsDir)) {
      fs.mkdirSync(itemsDir, { recursive: true });
    }
    cb(null, itemsDir);
  },
  filename: (req, file, cb) => {
    // Create a sanitized filename based on the original name
    const fileName = file.originalname.toLowerCase().replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${fileName}`);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Define the item schema for validation
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  level: z.number().int().min(1, "Level must be at least 1").optional(),
  rarity: z.string().optional(),
  strengthBonus: z.number().default(0),
  stealthBonus: z.number().default(0),
  charismaBonus: z.number().default(0),
  intelligenceBonus: z.number().default(0),
  crimeSuccessBonus: z.number().default(0),
  jailTimeReduction: z.number().default(0),
  escapeChanceBonus: z.number().default(0),
});

export function registerItemManagementRoutes(app: Express) {
  // Get all items
  app.get("/api/admin/items", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const allItems = await db.select().from(items);
      res.json(allItems);
    } catch (error) {
      console.error("Failed to get items:", error);
      res.status(500).json({ error: "Failed to get items" });
    }
  });

  // Get a single item by ID
  app.get("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const [item] = await db.select().from(items).where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Failed to get item:", error);
      res.status(500).json({ error: "Failed to get item" });
    }
  });

  // Create a new item with image upload
  app.post(
    "/api/admin/items", 
    isAuthenticated, 
    isAdmin, 
    upload.single("image"), 
    async (req: Request, res: Response) => {
      try {
        // Parse and validate the item data
        const itemData = {
          ...req.body,
          price: Number(req.body.price),
          level: req.body.level ? Number(req.body.level) : 1,
          strengthBonus: req.body.strengthBonus ? Number(req.body.strengthBonus) : 0,
          stealthBonus: req.body.stealthBonus ? Number(req.body.stealthBonus) : 0,
          charismaBonus: req.body.charismaBonus ? Number(req.body.charismaBonus) : 0,
          intelligenceBonus: req.body.intelligenceBonus ? Number(req.body.intelligenceBonus) : 0,
          crimeSuccessBonus: req.body.crimeSuccessBonus ? Number(req.body.crimeSuccessBonus) : 0,
          jailTimeReduction: req.body.jailTimeReduction ? Number(req.body.jailTimeReduction) : 0,
          escapeChanceBonus: req.body.escapeChanceBonus ? Number(req.body.escapeChanceBonus) : 0,
        };
        
        const validatedData = itemSchema.parse(itemData);
        
        // Add the image URL if an image was uploaded
        const imageUrl = req.file ? `/images/items/${req.file.filename}` : null;
        
        // Insert the new item into the database
        const [newItem] = await db.insert(items).values({
          ...validatedData,
          imageUrl
        }).returning();
        
        res.status(201).json(newItem);
      } catch (error) {
        console.error("Failed to create item:", error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        
        res.status(500).json({ error: "Failed to create item" });
      }
    }
  );

  // Update an existing item
  app.put(
    "/api/admin/items/:id", 
    isAuthenticated, 
    isAdmin, 
    upload.single("image"), 
    async (req: Request, res: Response) => {
      try {
        const itemId = parseInt(req.params.id);
        
        // Fetch the existing item to make sure it exists
        const [existingItem] = await db.select().from(items).where(eq(items.id, itemId));
        
        if (!existingItem) {
          return res.status(404).json({ error: "Item not found" });
        }
        
        // Parse and validate the item data
        const itemData = {
          ...req.body,
          price: Number(req.body.price),
          level: req.body.level ? Number(req.body.level) : 1,
          strengthBonus: req.body.strengthBonus ? Number(req.body.strengthBonus) : 0,
          stealthBonus: req.body.stealthBonus ? Number(req.body.stealthBonus) : 0,
          charismaBonus: req.body.charismaBonus ? Number(req.body.charismaBonus) : 0,
          intelligenceBonus: req.body.intelligenceBonus ? Number(req.body.intelligenceBonus) : 0,
          crimeSuccessBonus: req.body.crimeSuccessBonus ? Number(req.body.crimeSuccessBonus) : 0,
          jailTimeReduction: req.body.jailTimeReduction ? Number(req.body.jailTimeReduction) : 0,
          escapeChanceBonus: req.body.escapeChanceBonus ? Number(req.body.escapeChanceBonus) : 0,
        };
        
        const validatedData = itemSchema.parse(itemData);
        
        // Handle the image update
        let imageUrl = existingItem.imageUrl;
        
        if (req.file) {
          // If there's a new image, update the image URL
          imageUrl = `/images/items/${req.file.filename}`;
          
          // Delete the old image file if it exists
          if (existingItem.imageUrl) {
            const oldImagePath = path.join(process.cwd(), "public", existingItem.imageUrl);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }
        
        // Update the item in the database
        const [updatedItem] = await db
          .update(items)
          .set({
            ...validatedData,
            imageUrl
          })
          .where(eq(items.id, itemId))
          .returning();
        
        res.json(updatedItem);
      } catch (error) {
        console.error("Failed to update item:", error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        
        res.status(500).json({ error: "Failed to update item" });
      }
    }
  );

  // Delete an item
  app.delete("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Get the item first so we can delete its image if needed
      const [item] = await db.select().from(items).where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Delete the image file if it exists
      if (item.imageUrl) {
        const imagePath = path.join(process.cwd(), "public", item.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete the item from the database
      await db.delete(items).where(eq(items.id, itemId));
      
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Failed to delete item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });
}