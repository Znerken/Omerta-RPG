import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerBankingRoutes } from "./banking-routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerAchievementRoutes } from "./achievement-routes";
import { registerDrugRoutes } from "./drug-routes";
import { registerCasinoRoutes } from "./casino-routes";
import challengeRoutes from "./challenge-routes";
import gangRoutes from "./gang-routes";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { calculateRequiredXP } from "../shared/gameUtils";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { gangMembers } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Register banking and economy routes
  registerBankingRoutes(app);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Register achievement routes
  registerAchievementRoutes(app);
  
  // Register drug system routes
  registerDrugRoutes(app);
  
  // Register challenge routes
  app.use("/api", challengeRoutes);
  
  // Register gang routes with nested features
  app.use("/api/gangs", gangRoutes);
  
  // Register casino routes
  registerCasinoRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket handling
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      // Handle WebSocket messages
      console.log('Received: %s', message);
    });
  });
  
  // Broadcast to all connected clients
  function broadcast(type: string, data: any) {
    const WebSocket = require('ws');
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  // Player API Routes
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userId = req.user.id;
      const userWithStats = await storage.getUserWithStats(userId);
      const userWithGang = await storage.getUserWithGang(userId);
      const recentCrimes = await storage.getCrimeHistoryByUserId(userId, 5);
      const topPlayers = await storage.getTopUsersByLevel(3);
      
      // Get next level XP requirement
      const currentLevel = userWithStats!.level;
      const requiredXP = calculateRequiredXP(currentLevel);
      
      // Format response
      const dashboardData = {
        user: {
          ...userWithStats,
          nextLevelXP: requiredXP,
          gang: userWithGang?.gang,
          gangRank: userWithGang?.gangRank
        },
        recentActivity: recentCrimes,
        topPlayers: topPlayers.map(p => {
          const { password, ...player } = p;
          return player;
        })
      };
      
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // User profile endpoint with gang membership
  app.get("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userId = req.user.id;
      
      // Get gang member info directly
      const gangMember = await storage.getGangMember(userId);
      console.log("Gang Member:", gangMember);
      
      // Get user with gang info
      const userWithGang = await storage.getUserWithGang(userId);
      
      // Add frontend-specific fields - these are not in the schema 
      // but the frontend expects them
      const response = {
        ...(userWithGang || req.user),
        inGang: !!gangMember,  // Boolean flag for easy checks
        gangMember: gangMember || null,  // Complete member record with gang details
        gangId: gangMember?.gangId || null  // Direct gangId reference
      };
      
      console.log("Sending user profile response with gang data");
      res.json(response);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Crime API Routes
  app.get("/api/crimes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const crimes = await storage.getCrimesWithHistory(req.user.id);
      res.json(crimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crimes" });
    }
  });
  
  app.post("/api/crimes/:id/execute", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const crimeId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get crime and user
      const crime = await storage.getCrime(crimeId);
      if (!crime) {
        return res.status(404).json({ message: "Crime not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isJailed) {
        return res.status(400).json({ message: "You are in jail and cannot commit crimes" });
      }
      
      // Check cooldown
      const userHistory = await storage.getCrimeHistoryByUserId(userId);
      const lastAttempt = userHistory.find(h => h.crimeId === crimeId);
      
      const now = new Date();
      if (lastAttempt && lastAttempt.nextAvailableAt && lastAttempt.nextAvailableAt > now) {
        return res.status(400).json({ 
          message: "Crime on cooldown",
          nextAvailableAt: lastAttempt.nextAvailableAt
        });
      }
      
      // Get user stats
      const userStats = await storage.getStatsByUserId(userId);
      if (!userStats) {
        return res.status(500).json({ message: "User stats not found" });
      }
      
      // Calculate success chance
      const strengthFactor = (userStats.strength / 100) * crime.strengthWeight;
      const stealthFactor = (userStats.stealth / 100) * crime.stealthWeight;
      const charismaFactor = (userStats.charisma / 100) * crime.charismaWeight;
      const intelligenceFactor = (userStats.intelligence / 100) * crime.intelligenceWeight;
      
      const successChance = Math.min(
        95, // Cap at 95%
        Math.round((strengthFactor + stealthFactor + charismaFactor + intelligenceFactor) * 100)
      );
      
      // Random result based on success chance
      const isSuccess = Math.random() * 100 < successChance;
      
      // Calculate cooldown time
      const cooldownEnd = new Date(now.getTime() + crime.cooldown * 1000);
      
      if (isSuccess) {
        // Calculate rewards
        const cashReward = Math.floor(
          Math.random() * (crime.maxCashReward - crime.minCashReward + 1) + crime.minCashReward
        );
        const xpReward = Math.floor(
          Math.random() * (crime.maxXpReward - crime.minXpReward + 1) + crime.minXpReward
        );
        
        // Update user
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash + cashReward,
          xp: user.xp + xpReward
        });
        
        // Check for level up
        if (updatedUser) {
          const newLevel = Math.floor(1 + Math.sqrt(updatedUser.xp / 100));
          if (newLevel > updatedUser.level) {
            await storage.updateUser(userId, { level: newLevel });
          }
        }
        
        // Create crime history record
        const crimeRecord = await storage.createCrimeHistory({
          userId,
          crimeId,
          success: true,
          cashReward,
          xpReward,
          jailed: false,
          nextAvailableAt: cooldownEnd
        });
        
        return res.json({
          success: true,
          cashReward,
          xpReward,
          cooldownEnd,
          message: "Crime successful!",
          levelUp: newLevel > updatedUser?.level
        });
      } else {
        // Check if user got caught
        const caught = Math.random() * 100 < crime.jailRisk;
        
        if (caught) {
          // Calculate jail time
          const jailEnd = new Date(now.getTime() + crime.jailTime * 1000);
          
          // Update user as jailed
          await storage.updateUser(userId, {
            isJailed: true,
            jailTimeEnd: jailEnd
          });
          
          // Create crime history record
          await storage.createCrimeHistory({
            userId,
            crimeId,
            success: false,
            jailed: true,
            nextAvailableAt: cooldownEnd
          });
          
          return res.json({
            success: false,
            caught: true,
            jailEnd,
            cooldownEnd,
            message: "Crime failed! You were caught and sent to jail."
          });
        } else {
          // Create crime history record
          await storage.createCrimeHistory({
            userId,
            crimeId,
            success: false,
            jailed: false,
            nextAvailableAt: cooldownEnd
          });
          
          return res.json({
            success: false,
            caught: false,
            cooldownEnd,
            message: "Crime failed but you escaped arrest!"
          });
        }
      }
    } catch (error) {
      console.error("Crime execution error:", error);
      res.status(500).json({ message: "Failed to execute crime" });
    }
  });
  
  // Stats API Routes
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const stats = await storage.getStatsByUserId(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  app.post("/api/stats/train/:stat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const validStats = ["strength", "stealth", "charisma", "intelligence"];
    const stat = req.params.stat.toLowerCase();
    
    if (!validStats.includes(stat)) {
      return res.status(400).json({ message: "Invalid stat" });
    }
    
    try {
      const userId = req.user.id;
      const userStats = await storage.getStatsByUserId(userId);
      
      if (!userStats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      const cooldownField = `${stat}TrainingCooldown` as keyof typeof userStats;
      const statField = stat as keyof typeof userStats;
      
      const now = new Date();
      const cooldownTime = userStats[cooldownField] as Date;
      
      if (cooldownTime && cooldownTime > now) {
        return res.status(400).json({ 
          message: "Training on cooldown",
          nextAvailableAt: cooldownTime
        });
      }
      
      // Calculate cooldown (30 minutes)
      const cooldownEnd = new Date(now.getTime() + 30 * 60 * 1000);
      
      // Increase stat
      const currentValue = userStats[statField] as number;
      const updateData: Partial<typeof userStats> = {
        [statField]: Math.min(100, currentValue + 1), // Cap at 100
        [cooldownField]: cooldownEnd
      };
      
      const updatedStats = await storage.updateStats(userId, updateData);
      
      res.json({
        success: true,
        newValue: updatedStats?.[statField],
        cooldownEnd,
        message: `${stat.charAt(0).toUpperCase() + stat.slice(1)} increased by 1 point!`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to train stat" });
    }
  });
  
  // Jail API Routes
  app.get("/api/jail/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        isJailed: user.isJailed,
        jailTimeEnd: user.jailTimeEnd
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get jail status" });
    }
  });
  
  app.post("/api/jail/escape", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isJailed) {
        return res.status(400).json({ message: "You are not in jail" });
      }
      
      // 50% chance of escape
      const escaped = Math.random() >= 0.5;
      
      if (escaped) {
        // Release from jail
        await storage.releaseFromJail(user.id);
        
        res.json({
          success: true,
          message: "You successfully escaped from jail!"
        });
      } else {
        // Failed escape attempt - extend jail time by 5 minutes
        const currentJailEnd = user.jailTimeEnd || new Date();
        const newJailEnd = new Date(currentJailEnd.getTime() + 5 * 60 * 1000);
        
        await storage.updateUser(user.id, {
          jailTimeEnd: newJailEnd
        });
        
        res.json({
          success: false,
          jailTimeEnd: newJailEnd,
          message: "Escape attempt failed! Your jail time has been extended."
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to attempt jail escape" });
    }
  });
  
  // Gang API Routes
  app.get("/api/gangs", async (req, res) => {
    try {
      const gangs = await storage.getAllGangs();
      res.json(gangs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gangs" });
    }
  });
  
  app.get("/api/gangs/:id", async (req, res) => {
    try {
      const gangId = parseInt(req.params.id);
      const gang = await storage.getGangWithMembers(gangId);
      
      if (!gang) {
        return res.status(404).json({ message: "Gang not found" });
      }
      
      res.json(gang);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gang details" });
    }
  });
  
  app.post("/api/gangs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { name, tag, description } = req.body;
      
      // Validate input
      if (!name || !tag) {
        return res.status(400).json({ message: "Gang name and tag are required" });
      }
      
      // Check if user is already in a gang
      const existingMembership = await storage.getGangMember(req.user.id);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already in a gang" });
      }
      
      // Check if gang name or tag already exists
      const existingGangByName = await storage.getGangByName(name);
      if (existingGangByName) {
        return res.status(400).json({ message: "Gang name already exists" });
      }
      
      const existingGangByTag = await storage.getGangByTag(tag);
      if (existingGangByTag) {
        return res.status(400).json({ message: "Gang tag already exists" });
      }
      
      // Create gang
      const gang = await storage.createGang({
        name,
        tag,
        description,
        ownerId: req.user.id,
        logo: req.body.logo,
      });
      
      res.status(201).json(gang);
    } catch (error) {
      res.status(500).json({ message: "Failed to create gang" });
    }
  });
  
  app.post("/api/gangs/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const gangId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if gang exists
      const gang = await storage.getGang(gangId);
      if (!gang) {
        return res.status(404).json({ message: "Gang not found" });
      }
      
      // Check if user is already in a gang
      const existingMembership = await storage.getGangMember(userId);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already in a gang" });
      }
      
      // Add user to gang
      const member = await storage.addGangMember({
        gangId,
        userId,
        rank: "Member"
      });
      
      res.json({
        success: true,
        message: `You have joined ${gang.name}`,
        gangMember: member
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to join gang" });
    }
  });
  
  app.post("/api/gangs/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const gangId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if user is in this gang
      const membership = await storage.getGangMember(userId);
      if (!membership || membership.gang.id !== gangId) {
        return res.status(400).json({ message: "You are not a member of this gang" });
      }
      
      // Check if user is the owner
      if (membership.gang.ownerId === userId) {
        return res.status(400).json({ message: "Gang owner cannot leave. Transfer ownership first or disband the gang." });
      }
      
      // Remove user from gang
      await storage.removeGangMember(userId, gangId);
      
      res.json({
        success: true,
        message: "You have left the gang"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave gang" });
    }
  });
  
  app.post("/api/gangs/:id/bank", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const gangId = parseInt(req.params.id);
      const userId = req.user.id;
      const { action, amount } = req.body;
      
      if (!action || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid action and amount are required" });
      }
      
      // Check if user is in this gang
      const membership = await storage.getGangMember(userId);
      if (!membership || membership.gang.id !== gangId) {
        return res.status(400).json({ message: "You are not a member of this gang" });
      }
      
      // Get user and gang
      const user = await storage.getUser(userId);
      const gang = await storage.getGang(gangId);
      
      if (!user || !gang) {
        return res.status(404).json({ message: "User or gang not found" });
      }
      
      if (action === "deposit") {
        // Check if user has enough money
        if (user.cash < amount) {
          return res.status(400).json({ message: "You don't have enough cash" });
        }
        
        // Update user and gang
        await storage.updateUser(userId, { cash: user.cash - amount });
        await storage.updateGang(gangId, { bankBalance: gang.bankBalance + amount });
        
        res.json({
          success: true,
          message: `Deposited $${amount} to gang bank`,
          newBalance: gang.bankBalance + amount
        });
      } else if (action === "withdraw") {
        // Check if gang has enough money
        if (gang.bankBalance < amount) {
          return res.status(400).json({ message: "Gang bank doesn't have enough cash" });
        }
        
        // Only leader or officers can withdraw
        if (membership.rank !== "Leader" && membership.rank !== "Officer") {
          return res.status(403).json({ message: "Only Leaders and Officers can withdraw from the gang bank" });
        }
        
        // Update user and gang
        await storage.updateUser(userId, { cash: user.cash + amount });
        await storage.updateGang(gangId, { bankBalance: gang.bankBalance - amount });
        
        res.json({
          success: true,
          message: `Withdrew $${amount} from gang bank`,
          newBalance: gang.bankBalance - amount
        });
      } else {
        return res.status(400).json({ message: "Invalid action. Use 'deposit' or 'withdraw'" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process gang bank transaction" });
    }
  });
  
  // Inventory API Routes
  app.get("/api/inventory", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const inventory = await storage.getUserInventory(req.user.id);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });
  
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  
  app.post("/api/items/:id/buy", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get item and user
      const item = await storage.getItem(itemId);
      const user = await storage.getUser(userId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough money
      if (user.cash < item.price) {
        return res.status(400).json({ message: "Not enough cash to buy this item" });
      }
      
      // Update user cash
      await storage.updateUser(userId, { cash: user.cash - item.price });
      
      // Add item to inventory
      await storage.addItemToInventory({
        userId,
        itemId,
        quantity: 1
      });
      
      res.json({
        success: true,
        message: `You bought ${item.name}`,
        remainingCash: user.cash - item.price
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to buy item" });
    }
  });
  
  app.post("/api/inventory/:id/equip", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get user inventory
      const inventory = await storage.getUserInventory(userId);
      const inventoryItem = inventory.find(i => i.id === itemId);
      
      if (!inventoryItem) {
        return res.status(404).json({ message: "Item not found in your inventory" });
      }
      
      // Find the inventory record
      const userInventoryItem = Array.from((storage as any).userInventory.values())
        .find((inv: any) => inv.userId === userId && inv.itemId === itemId);
      
      if (!userInventoryItem) {
        return res.status(404).json({ message: "Inventory record not found" });
      }
      
      // Toggle equipped status
      const newEquipStatus = !userInventoryItem.equipped;
      
      // If equipping, unequip other items of the same type
      if (newEquipStatus && inventoryItem.type !== 'consumable') {
        const sameTypeItems = inventory.filter(i => 
          i.type === inventoryItem.type && i.id !== itemId
        );
        
        for (const item of sameTypeItems) {
          const inventoryRecord = Array.from((storage as any).userInventory.values())
            .find((inv: any) => inv.userId === userId && inv.itemId === item.id);
          
          if (inventoryRecord && inventoryRecord.equipped) {
            await storage.updateInventoryItem(inventoryRecord.id, { equipped: false });
          }
        }
      }
      
      // Update item equipped status
      await storage.updateInventoryItem(userInventoryItem.id, { equipped: newEquipStatus });
      
      res.json({
        success: true,
        message: newEquipStatus ? `Equipped ${inventoryItem.name}` : `Unequipped ${inventoryItem.name}`,
        equipped: newEquipStatus
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to equip/unequip item" });
    }
  });
  
  // Message API Routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const type = req.query.type as string;
      const userId = req.user.id;
      
      let messages: any[] = [];
      
      switch (type) {
        case "personal":
          messages = await storage.getUserMessages(userId);
          break;
        case "gang":
          const membership = await storage.getGangMember(userId);
          if (membership) {
            messages = await storage.getGangMessages(membership.gang.id);
          }
          break;
        case "jail":
          messages = await storage.getJailMessages();
          break;
        case "global":
          messages = await storage.getGlobalMessages();
          break;
        default:
          messages = await storage.getUserMessages(userId);
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { type, content, receiverId, gangId } = req.body;
      const senderId = req.user.id;
      
      if (!type || !content) {
        return res.status(400).json({ message: "Message type and content are required" });
      }
      
      // Validate message type
      const validTypes = ["personal", "gang", "jail", "global"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid message type" });
      }
      
      // Validate specifics based on type
      if (type === "personal" && !receiverId) {
        return res.status(400).json({ message: "Receiver ID is required for personal messages" });
      }
      
      if (type === "gang") {
        // Check if user is in a gang
        const membership = await storage.getGangMember(senderId);
        if (!membership) {
          return res.status(400).json({ message: "You are not in a gang" });
        }
        
        // Use the user's gang ID if not specified
        const finalGangId = gangId || membership.gang.id;
        
        // Create message
        const message = await storage.createMessage({
          senderId,
          type,
          content,
          gangId: finalGangId
        });
        
        return res.status(201).json(message);
      }
      
      if (type === "jail") {
        // Check if user is in jail
        const user = await storage.getUser(senderId);
        if (!user?.isJailed) {
          return res.status(400).json({ message: "You must be in jail to send jail messages" });
        }
      }
      
      // Create message
      const message = await storage.createMessage({
        senderId,
        receiverId: type === "personal" ? receiverId : undefined,
        type,
        content
      });
      
      // If it's a personal message, notify the receiver
      if (type === "personal") {
        broadcast("newMessage", {
          messageId: message.id,
          senderId,
          receiverId
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Leaderboard API Routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const type = req.query.type as string || "level";
      const limit = parseInt(req.query.limit as string || "10");
      
      let leaderboard: any[] = [];
      
      switch (type) {
        case "cash":
          leaderboard = await storage.getTopUsersByCash(limit);
          break;
        case "respect":
          leaderboard = await storage.getTopUsersByRespect(limit);
          break;
        case "gangs":
          leaderboard = await storage.getTopGangs(limit);
          break;
        case "level":
        default:
          leaderboard = await storage.getTopUsersByLevel(limit);
      }
      
      // Remove sensitive information from user records
      if (type !== "gangs") {
        leaderboard = leaderboard.map(entry => {
          const { password, ...safeEntry } = entry;
          return safeEntry;
        });
      }
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
  
  // Admin API Routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const users = Array.from((storage as any).users.values());
      
      // Remove sensitive information
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Add admin specific routes here

  return httpServer;
}
