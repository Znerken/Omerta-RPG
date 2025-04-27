import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/auth";
import { isAdmin } from "./middleware/admin";
import { 
  insertItemSchema,
  insertUserInventorySchema,
  items,
  userInventory
} from "@shared/schema";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";

/**
 * Initialize inventory tables
 */
async function initializeInventoryTables() {
  try {
    // Check if items table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'items'
      );
    `);
    
    const tableExists = tableCheck.rows[0]?.exists === true;
    
    if (!tableExists) {
      console.log("Creating items table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL,
          price INTEGER NOT NULL,
          strength_bonus INTEGER NOT NULL DEFAULT 0,
          stealth_bonus INTEGER NOT NULL DEFAULT 0,
          charisma_bonus INTEGER NOT NULL DEFAULT 0,
          intelligence_bonus INTEGER NOT NULL DEFAULT 0,
          crime_success_bonus INTEGER NOT NULL DEFAULT 0,
          jail_time_reduction INTEGER NOT NULL DEFAULT 0,
          escape_chance_bonus INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      // Add some sample items
      await db.execute(sql`
        INSERT INTO items (name, description, type, price, strength_bonus, stealth_bonus)
        VALUES 
          ('Brass Knuckles', 'Increases damage in hand-to-hand combat', 'weapon', 1000, 10, 0),
          ('Switchblade', 'A concealable blade for quick attacks', 'weapon', 1500, 5, 5),
          ('Leather Jacket', 'Basic protection that looks stylish', 'protection', 2000, 3, 0),
          ('Ski Mask', 'Conceals your identity during crimes', 'tool', 800, 0, 8),
          ('Fake ID', 'Helps you talk your way out of situations', 'tool', 1200, 0, 0)
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    // Check if user_inventory table exists
    const inventoryTableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_inventory'
      );
    `);
    
    const inventoryTableExists = inventoryTableCheck.rows[0]?.exists === true;
    
    if (!inventoryTableExists) {
      console.log("Creating user_inventory table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_inventory (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          equipped BOOLEAN NOT NULL DEFAULT FALSE
        )
      `);
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing inventory tables:", error);
    return false;
  }
}

/**
 * Register inventory routes
 */
export function registerInventoryRoutes(app: Express) {
  // Initialize tables
  initializeInventoryTables().then(success => {
    if (success) {
      console.log("Inventory tables initialized successfully");
    } else {
      console.error("Failed to initialize inventory tables");
    }
  });
  
  // Get all items
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const allItems = await db.query.items.findMany();
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get a specific item by ID
  app.get("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      const item = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Get user's inventory
  app.get("/api/inventory", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get all items in the user's inventory with item details
      const userItems = await db.select({
        id: userInventory.id,
        userId: userInventory.userId,
        itemId: userInventory.itemId,
        quantity: userInventory.quantity,
        equipped: userInventory.equipped,
        item: items
      })
      .from(userInventory)
      .leftJoin(items, eq(userInventory.itemId, items.id))
      .where(eq(userInventory.userId, userId));
      
      res.json(userItems);
    } catch (error) {
      console.error("Error fetching user inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Add item to user's inventory
  app.post("/api/inventory/add", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { itemId, quantity = 1 } = req.body;
      
      if (!itemId || isNaN(itemId)) {
        return res.status(400).json({ error: "Valid itemId is required" });
      }
      
      // Check if item exists
      const item = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Check if user already has this item
      const existingItem = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      if (existingItem) {
        // Update existing item quantity
        const [updatedItem] = await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(userInventory.id, existingItem.id))
          .returning();
        
        return res.json(updatedItem);
      } else {
        // Add new item to inventory
        const [newInventoryItem] = await db
          .insert(userInventory)
          .values({
            userId,
            itemId,
            quantity,
            equipped: false
          })
          .returning();
        
        return res.status(201).json(newInventoryItem);
      }
    } catch (error) {
      console.error("Error adding item to inventory:", error);
      res.status(500).json({ error: "Failed to add item to inventory" });
    }
  });

  // Remove item from user's inventory
  app.post("/api/inventory/remove", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { itemId, quantity = 1 } = req.body;
      
      if (!itemId || isNaN(itemId)) {
        return res.status(400).json({ error: "Valid itemId is required" });
      }
      
      // Check if user has this item
      const existingItem = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found in inventory" });
      }
      
      // Calculate new quantity
      const newQuantity = existingItem.quantity - quantity;
      
      if (newQuantity <= 0) {
        // Remove item completely
        await db
          .delete(userInventory)
          .where(eq(userInventory.id, existingItem.id));
        
        return res.json({ message: "Item removed from inventory" });
      } else {
        // Update quantity
        const [updatedItem] = await db
          .update(userInventory)
          .set({ quantity: newQuantity })
          .where(eq(userInventory.id, existingItem.id))
          .returning();
        
        return res.json(updatedItem);
      }
    } catch (error) {
      console.error("Error removing item from inventory:", error);
      res.status(500).json({ error: "Failed to remove item from inventory" });
    }
  });

  // Toggle equip status for an item
  app.post("/api/inventory/:id/toggle-equip", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const inventoryItemId = parseInt(req.params.id);
      
      if (isNaN(inventoryItemId)) {
        return res.status(400).json({ error: "Invalid inventory item ID" });
      }
      
      // Check if inventory item exists and belongs to the user
      const inventoryItem = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.id, inventoryItemId),
          eq(userInventory.userId, userId)
        )
      });
      
      if (!inventoryItem) {
        return res.status(404).json({ error: "Inventory item not found or does not belong to user" });
      }
      
      // Get the item details to check type
      const item = await db.query.items.findFirst({
        where: eq(items.id, inventoryItem.itemId)
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // If the item is being equipped, unequip any other items of the same type
      if (!inventoryItem.equipped) {
        // Find other equipped items of the same type
        const equippedItems = await db.select()
          .from(userInventory)
          .innerJoin(items, eq(userInventory.itemId, items.id))
          .where(and(
            eq(userInventory.userId, userId),
            eq(items.type, item.type),
            eq(userInventory.equipped, true)
          ));
        
        // Unequip other items of the same type
        for (const equipped of equippedItems) {
          await db
            .update(userInventory)
            .set({ equipped: false })
            .where(eq(userInventory.id, equipped.user_inventory.id));
        }
      }
      
      // Toggle equipped status
      const [updatedItem] = await db
        .update(userInventory)
        .set({ equipped: !inventoryItem.equipped })
        .where(eq(userInventory.id, inventoryItemId))
        .returning();
      
      return res.json(updatedItem);
    } catch (error) {
      console.error("Error toggling equip status:", error);
      res.status(500).json({ error: "Failed to toggle equip status" });
    }
  });

  // Admin endpoints for item management
  
  // Create new item (admin only)
  app.post("/api/admin/items", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      
      const [newItem] = await db
        .insert(items)
        .values(itemData)
        .returning();
      
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400).json({ error: errorMessage });
      } else {
        console.error("Error creating item:", error);
        res.status(500).json({ error: "Failed to create item" });
      }
    }
  });

  // Update item (admin only)
  app.patch("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      // Check if item exists
      const existingItem = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Update the item
      const [updatedItem] = await db
        .update(items)
        .set(req.body)
        .where(eq(items.id, itemId))
        .returning();
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete item (admin only)
  app.delete("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      // Check if item exists
      const existingItem = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Delete all instances of this item from user inventories first
      await db
        .delete(userInventory)
        .where(eq(userInventory.itemId, itemId));
      
      // Then delete the item
      await db
        .delete(items)
        .where(eq(items.id, itemId));
      
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Give item to user (admin only)
  app.post("/api/admin/users/:userId/give-item", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { itemId, quantity = 1 } = req.body;
      
      if (isNaN(userId) || !itemId || isNaN(itemId)) {
        return res.status(400).json({ error: "Valid userId and itemId are required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if item exists
      const item = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Check if user already has this item
      const existingItem = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      if (existingItem) {
        // Update existing item quantity
        const [updatedItem] = await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(userInventory.id, existingItem.id))
          .returning();
        
        return res.json(updatedItem);
      } else {
        // Add new item to inventory
        const [newInventoryItem] = await db
          .insert(userInventory)
          .values({
            userId,
            itemId,
            quantity,
            equipped: false
          })
          .returning();
        
        return res.status(201).json(newInventoryItem);
      }
    } catch (error) {
      console.error("Error giving item to user:", error);
      res.status(500).json({ error: "Failed to give item to user" });
    }
  });

  // Get equipped items for a user (for stat calculation)
  app.get("/api/inventory/equipped", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const equippedItems = await db.select({
        inventoryId: userInventory.id,
        item: items
      })
      .from(userInventory)
      .innerJoin(items, eq(userInventory.itemId, items.id))
      .where(and(
        eq(userInventory.userId, userId),
        eq(userInventory.equipped, true)
      ));
      
      // Calculate total stat bonuses
      const statBonuses = {
        strengthBonus: 0,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 0,
        crimeSuccessBonus: 0,
        jailTimeReduction: 0,
        escapeChanceBonus: 0
      };
      
      equippedItems.forEach(equipped => {
        statBonuses.strengthBonus += equipped.item.strengthBonus;
        statBonuses.stealthBonus += equipped.item.stealthBonus;
        statBonuses.charismaBonus += equipped.item.charismaBonus;
        statBonuses.intelligenceBonus += equipped.item.intelligenceBonus;
        statBonuses.crimeSuccessBonus += equipped.item.crimeSuccessBonus;
        statBonuses.jailTimeReduction += equipped.item.jailTimeReduction;
        statBonuses.escapeChanceBonus += equipped.item.escapeChanceBonus;
      });
      
      res.json({
        equippedItems,
        statBonuses
      });
    } catch (error) {
      console.error("Error fetching equipped items:", error);
      res.status(500).json({ error: "Failed to fetch equipped items" });
    }
  });

  // Purchase item and add to inventory
  app.post("/api/items/:id/purchase", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const itemId = parseInt(req.params.id);
      const { quantity = 1 } = req.body;
      
      if (isNaN(itemId) || quantity <= 0) {
        return res.status(400).json({ error: "Invalid item ID or quantity" });
      }
      
      // Get user to check cash
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get item to check price
      const item = await db.query.items.findFirst({
        where: eq(items.id, itemId)
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Calculate total cost
      const totalCost = item.price * quantity;
      
      // Check if user has enough cash
      if (user.cash < totalCost) {
        return res.status(400).json({ 
          error: "Not enough cash", 
          required: totalCost, 
          available: user.cash 
        });
      }
      
      // Deduct cash from user
      const updatedUser = await storage.updateUserCash(userId, user.cash - totalCost);
      
      // Add item to inventory
      // Check if user already has this item
      const existingItem = await db.query.userInventory.findFirst({
        where: and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      });
      
      let inventoryItem;
      
      if (existingItem) {
        // Update existing item quantity
        [inventoryItem] = await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(userInventory.id, existingItem.id))
          .returning();
      } else {
        // Add new item to inventory
        [inventoryItem] = await db
          .insert(userInventory)
          .values({
            userId,
            itemId,
            quantity,
            equipped: false
          })
          .returning();
      }
      
      res.json({
        success: true,
        message: `Successfully purchased ${quantity} ${item.name}`,
        item: inventoryItem,
        newCashBalance: updatedUser.cash
      });
    } catch (error) {
      console.error("Error purchasing item:", error);
      res.status(500).json({ error: "Failed to purchase item" });
    }
  });
}