import { Express, Request, Response } from "express";
import { db } from "./db";
import { eq, ilike, and } from "drizzle-orm";
import { items, equipments, Item } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./middleware/auth";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "items");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `item-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

export function registerItemManagementRoutes(app: Express) {
  // Get all items (with optional search)
  app.get("/api/admin/items", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      
      let query = db.select().from(items);
      
      if (search) {
        query = query.where(
          ilike(items.name, `%${search}%`)
        );
      }
      
      const allItems = await query;
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Get single item by ID
  app.get("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  // Create new item
  app.post(
    "/api/admin/items",
    isAuthenticated,
    isAdmin,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const itemData = {
          name: req.body.name,
          description: req.body.description,
          type: req.body.type,
          category: req.body.category || null,
          price: parseInt(req.body.price),
          level: req.body.level ? parseInt(req.body.level) : 1,
          rarity: req.body.rarity || "common",
          strengthBonus: parseInt(req.body.strengthBonus) || 0,
          stealthBonus: parseInt(req.body.stealthBonus) || 0,
          charismaBonus: parseInt(req.body.charismaBonus) || 0,
          intelligenceBonus: parseInt(req.body.intelligenceBonus) || 0,
          crimeSuccessBonus: parseInt(req.body.crimeSuccessBonus) || 0,
          jailTimeReduction: parseInt(req.body.jailTimeReduction) || 0,
          escapeChanceBonus: parseInt(req.body.escapeChanceBonus) || 0,
        };

        // Add image URL if a file was uploaded
        if (req.file) {
          const relativePath = `/uploads/items/${req.file.filename}`;
          (itemData as any).imageUrl = relativePath;
        }

        const [createdItem] = await db.insert(items).values(itemData).returning();

        res.status(201).json(createdItem);
      } catch (error) {
        console.error("Error creating item:", error);
        
        // If there was an uploaded file, try to delete it on error
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error("Failed to delete uploaded file:", unlinkError);
          }
        }
        
        res.status(500).json({ message: "Failed to create item" });
      }
    }
  );

  // Update an item
  app.put(
    "/api/admin/items/:id",
    isAuthenticated,
    isAdmin,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const itemId = parseInt(req.params.id);
        
        // First, get the current item to check if it exists and to get the old image path
        const [existingItem] = await db
          .select()
          .from(items)
          .where(eq(items.id, itemId));
          
        if (!existingItem) {
          return res.status(404).json({ message: "Item not found" });
        }
        
        const updateData: Partial<Item> = {
          name: req.body.name,
          description: req.body.description,
          type: req.body.type,
          category: req.body.category || null,
          price: parseInt(req.body.price),
          level: req.body.level ? parseInt(req.body.level) : 1,
          rarity: req.body.rarity || "common",
          strengthBonus: parseInt(req.body.strengthBonus) || 0,
          stealthBonus: parseInt(req.body.stealthBonus) || 0,
          charismaBonus: parseInt(req.body.charismaBonus) || 0,
          intelligenceBonus: parseInt(req.body.intelligenceBonus) || 0,
          crimeSuccessBonus: parseInt(req.body.crimeSuccessBonus) || 0,
          jailTimeReduction: parseInt(req.body.jailTimeReduction) || 0,
          escapeChanceBonus: parseInt(req.body.escapeChanceBonus) || 0,
        };
        
        // Process new image if uploaded
        if (req.file) {
          const relativePath = `/uploads/items/${req.file.filename}`;
          updateData.imageUrl = relativePath;
          
          // Delete old image if it exists
          if (existingItem.imageUrl) {
            const oldImagePath = path.join(process.cwd(), "public", existingItem.imageUrl);
            
            try {
              if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
              }
            } catch (unlinkError) {
              console.error("Failed to delete old image:", unlinkError);
            }
          }
        }
        
        // Update the item
        const [updatedItem] = await db
          .update(items)
          .set(updateData)
          .where(eq(items.id, itemId))
          .returning();
          
        res.json(updatedItem);
      } catch (error) {
        console.error("Error updating item:", error);
        
        // If there was an uploaded file, try to delete it on error
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error("Failed to delete uploaded file:", unlinkError);
          }
        }
        
        res.status(500).json({ message: "Failed to update item" });
      }
    }
  );

  // Delete an item
  app.delete("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Get item to find image path
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId));
        
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Begin transaction
      await db.transaction(async (tx) => {
        // First, check if the item is linked to equipment or inventory entries
        const equipmentCount = await tx.execute(
          db.select({ count: db.fn.count() }).from(equipments).where(eq(equipments.itemId, itemId))
        );
        
        if (equipmentCount.length > 0 && equipmentCount[0].count > 0) {
          throw new Error("Cannot delete item that is equipped by users");
        }
        
        // Delete the item
        await tx.delete(items).where(eq(items.id, itemId));
      });
      
      // Delete image file if it exists
      if (item.imageUrl) {
        const imagePath = path.join(process.cwd(), "public", item.imageUrl);
        
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (unlinkError) {
          console.error("Failed to delete image file:", unlinkError);
        }
      }
      
      res.json({ success: true, item });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Public endpoints for all users
  
  // Get all items for shopping/inventory
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const type = req.query.type as string | undefined; 
      
      let query = db.select().from(items);
      
      // Apply filters
      if (search) {
        query = query.where(ilike(items.name, `%${search}%`));
      }
      
      if (type) {
        query = query.where(eq(items.type, type));
      }
      
      const allItems = await query;
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Get a single item
  app.get("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId));
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });
}