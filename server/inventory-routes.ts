import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/auth";
import { isAdmin } from "./middleware/admin";
import { z } from "zod";
import { db } from "./db";
import { userInventory, items, users } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// Schema for equipping/unequipping items
const equipItemSchema = z.object({
  itemId: z.number().int().positive(),
  equipped: z.boolean().optional(),
});

// Schema for transferring items
const transferItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  receiverId: z.number().int().positive(),
});

// Schema for buying items
const buyItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// Schema for selling items
const sellItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// Register inventory routes
export function registerInventoryRoutes(app: Express) {
  // Get user's inventory
  app.get("/api/inventory", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching user inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Get all available items in the store
  app.get("/api/items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const allItems = await storage.getAllItems();
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching store items:", error);
      res.status(500).json({ error: "Failed to fetch store items" });
    }
  });

  // Get a specific item
  app.get("/api/items/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Buy an item from the store
  app.post("/api/inventory/buy", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = buyItemSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid request data", details: validatedData.error });
      }
      
      const { itemId, quantity } = validatedData.data;
      
      // Get the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Calculate total cost
      const totalCost = item.price * quantity;
      
      // Check if user has enough money
      if (user.cash < totalCost) {
        return res.status(400).json({ error: "Not enough cash to buy this item" });
      }
      
      // Begin transaction
      // 1. Deduct cash from user
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash - totalCost,
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user cash" });
      }
      
      // 2. Add the item to the user's inventory
      // Check if the user already has this item
      const userItems = await storage.getUserInventory(userId);
      const existingItem = userItems.find(i => i.id === itemId);
      
      if (existingItem) {
        // Update existing item quantity
        await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          ));
      } else {
        // Add new item to inventory
        await storage.addItemToInventory({
          userId,
          itemId,
          quantity,
        });
      }
      
      // Get updated inventory
      const updatedInventory = await storage.getUserInventory(userId);
      
      res.json({
        success: true,
        message: `Successfully purchased ${quantity} ${item.name}(s)`,
        inventory: updatedInventory,
        cash: updatedUser.cash
      });
    } catch (error) {
      console.error("Error buying item:", error);
      res.status(500).json({ error: "Failed to buy item" });
    }
  });

  // Sell an item from inventory
  app.post("/api/inventory/sell", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = sellItemSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid request data", details: validatedData.error });
      }
      
      const { itemId, quantity } = validatedData.data;
      
      // Get the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user's inventory
      const userItems = await storage.getUserInventory(userId);
      const existingItem = userItems.find(i => i.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found in your inventory" });
      }
      
      if (existingItem.quantity < quantity) {
        return res.status(400).json({ error: "You don't have enough of this item to sell" });
      }
      
      // Calculate sale price (50% of original price)
      const salePrice = Math.floor(item.price * 0.5) * quantity;
      
      // Begin transaction
      // 1. Add cash to user
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash + salePrice,
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user cash" });
      }
      
      // 2. Remove or update the item in inventory
      if (existingItem.quantity === quantity) {
        // Remove the item completely
        await storage.removeItemFromInventory(userId, itemId);
      } else {
        // Update the quantity
        await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity - quantity })
          .where(and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          ));
      }
      
      // Get updated inventory
      const updatedInventory = await storage.getUserInventory(userId);
      
      res.json({
        success: true,
        message: `Successfully sold ${quantity} ${item.name}(s) for $${salePrice}`,
        inventory: updatedInventory,
        cash: updatedUser.cash
      });
    } catch (error) {
      console.error("Error selling item:", error);
      res.status(500).json({ error: "Failed to sell item" });
    }
  });

  // Equip/Unequip item
  app.post("/api/inventory/equip", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = equipItemSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid request data", details: validatedData.error });
      }
      
      const { itemId, equipped = true } = validatedData.data;
      
      // Get user's inventory
      const userItems = await storage.getUserInventory(userId);
      const existingItem = userItems.find(i => i.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found in your inventory" });
      }
      
      // If equipping, first unequip all items of the same type
      if (equipped) {
        // Get the item to know its type
        const item = await storage.getItem(itemId);
        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }
        
        // Unequip all items of the same type
        const itemsOfSameType = userItems.filter(i => 
          i.type === item.type && i.equipped && i.id !== itemId
        );
        
        for (const i of itemsOfSameType) {
          await db
            .update(userInventory)
            .set({ equipped: false })
            .where(and(
              eq(userInventory.userId, userId),
              eq(userInventory.itemId, i.id)
            ));
        }
      }
      
      // Update the equipped status of the selected item
      await db
        .update(userInventory)
        .set({ equipped })
        .where(and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        ));
      
      // Get updated inventory
      const updatedInventory = await storage.getUserInventory(userId);
      
      res.json({
        success: true,
        message: equipped ? `${existingItem.name} equipped` : `${existingItem.name} unequipped`,
        inventory: updatedInventory
      });
    } catch (error) {
      console.error("Error equipping item:", error);
      res.status(500).json({ error: "Failed to equip item" });
    }
  });

  // Transfer an item to another user
  app.post("/api/inventory/transfer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = transferItemSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid request data", details: validatedData.error });
      }
      
      const { itemId, quantity, receiverId } = validatedData.data;
      
      // Check if receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: "Recipient user not found" });
      }
      
      // Check if sender has the item
      const userItems = await storage.getUserInventory(userId);
      const existingItem = userItems.find(i => i.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found in your inventory" });
      }
      
      if (existingItem.quantity < quantity) {
        return res.status(400).json({ error: "You don't have enough of this item to transfer" });
      }
      
      // Check if item is equipped
      if (existingItem.equipped) {
        return res.status(400).json({ error: "You can't transfer an equipped item" });
      }
      
      // Check if receiver already has this item
      const receiverItems = await storage.getUserInventory(receiverId);
      const receiverHasItem = receiverItems.find(i => i.id === itemId);
      
      // Begin transaction
      // 1. Remove or update the item from sender's inventory
      if (existingItem.quantity === quantity) {
        // Remove the item completely
        await storage.removeItemFromInventory(userId, itemId);
      } else {
        // Update the quantity
        await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity - quantity })
          .where(and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          ));
      }
      
      // 2. Add or update the item in receiver's inventory
      if (receiverHasItem) {
        // Update existing item quantity
        await db
          .update(userInventory)
          .set({ quantity: receiverHasItem.quantity + quantity })
          .where(and(
            eq(userInventory.userId, receiverId),
            eq(userInventory.itemId, itemId)
          ));
      } else {
        // Add new item to inventory
        await storage.addItemToInventory({
          userId: receiverId,
          itemId,
          quantity,
        });
      }
      
      // Get the item name for the message
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Get updated inventory
      const updatedInventory = await storage.getUserInventory(userId);
      
      res.json({
        success: true,
        message: `Successfully transferred ${quantity} ${item.name}(s) to ${receiver.username}`,
        inventory: updatedInventory
      });
    } catch (error) {
      console.error("Error transferring item:", error);
      res.status(500).json({ error: "Failed to transfer item" });
    }
  });

  // Admin Routes
  // Create a new item
  app.post("/api/admin/items", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const newItem = await storage.createItem(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Update an item
  app.patch("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Get the item
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Update the item
      const updatedItem = await db
        .update(items)
        .set(req.body)
        .where(eq(items.id, itemId))
        .returning();
      
      res.json(updatedItem[0]);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete an item
  app.delete("/api/admin/items/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Get the item
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Delete the item from all user inventories
      await db
        .delete(userInventory)
        .where(eq(userInventory.itemId, itemId));
      
      // Delete the item
      await db
        .delete(items)
        .where(eq(items.id, itemId));
      
      res.json({ success: true, message: "Item deleted" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Add item to user's inventory (admin)
  app.post("/api/admin/users/:id/give-item", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { itemId, quantity = 1 } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if item exists
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Check if user already has this item
      const userItems = await storage.getUserInventory(userId);
      const existingItem = userItems.find(i => i.id === itemId);
      
      if (existingItem) {
        // Update existing item quantity
        await db
          .update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          ));
      } else {
        // Add new item to inventory
        await storage.addItemToInventory({
          userId,
          itemId,
          quantity,
        });
      }
      
      // Get updated inventory
      const updatedInventory = await storage.getUserInventory(userId);
      
      res.json({
        success: true,
        message: `Added ${quantity} ${item.name}(s) to ${user.username}'s inventory`,
        inventory: updatedInventory
      });
    } catch (error) {
      console.error("Error adding item to user:", error);
      res.status(500).json({ error: "Failed to add item to user" });
    }
  });
}