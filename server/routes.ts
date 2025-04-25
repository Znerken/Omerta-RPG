import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerBankingRoutes } from "./banking-routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerAchievementRoutes } from "./achievement-routes";
import { registerDrugRoutes } from "./drug-routes";
import { registerCasinoRoutes } from "./casino-routes";
import { registerProfileRoutes } from "./profile-routes";
import { registerSocialRoutes, setNotifyUserFunction } from "./social-routes";
import { registerDevRoutes } from "./dev-routes";
import challengeRoutes from "./challenge-routes";
import gangRoutes from "./gang-routes";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { z } from "zod";
import { calculateRequiredXP } from "../shared/gameUtils";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { gangMembers } from "@shared/schema";
import { getUserStatus, updateUserStatus, createUserStatus } from './social-database';

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
  
  // Register profile routes
  registerProfileRoutes(app);
  
  // Register dev routes for testing
  registerDevRoutes(app);
  
  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track client connections by user ID
  const clients = new Map<number, Set<WebSocket>>();

  // Send a notification to a specific user
  function notifyUser(userId: number, type: string, data: any) {
    if (!clients.has(userId)) {
      console.log(`No active connections for user ${userId}`);
      return;
    }
    
    const userClients = clients.get(userId)!;
    const message = JSON.stringify({ type, data });
    
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Register social system routes and pass the notification function
  registerSocialRoutes(app);
  setNotifyUserFunction(notifyUser);
  
  // WebSocket handling
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Parse user ID from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0', 10);
    
    if (!userId) {
      console.log('No userId provided for WebSocket connection');
      return ws.close(1008, 'Invalid userId');
    }
    
    // Add this client to the map for this user
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)?.add(ws);
    
    console.log(`User ${userId} connected via WebSocket. Active connections: ${clients.get(userId)?.size}`);
    
    // Send initial notification of unread messages count
    storage.getUnreadMessages(userId).then(messages => {
      if (messages.length > 0) {
        ws.send(JSON.stringify({
          type: 'unreadMessages',
          data: { count: messages.length }
        }));
      }
    }).catch(err => {
      console.error('Error sending initial unread count:', err);
    });
    
    // Auto-update user status to online when they connect
    
    // Update the user's status to online
    getUserStatus(userId).then(async (status) => {
      if (status) {
        // Update existing status to online
        await updateUserStatus(userId, {
          status: "online",
          lastActive: new Date()
        });
      } else {
        // Create new status as online
        await createUserStatus({
          userId,
          status: "online",
          lastActive: new Date(),
          lastLocation: null
        });
      }
      
      // Notify friends about this user coming online
      // First get the complete user info to ensure we have accurate data
      storage.getUser(userId).then(userInfo => {
        if (!userInfo) {
          console.error('Could not find user info for status update, userId:', userId);
          return;
        }
        
        // Then get and notify all friends
        storage.getUserFriends(userId).then(friends => {
          friends.forEach(friend => {
            notifyUser(friend.id, "friend_status", {
              userId,
              username: userInfo.username,
              avatar: userInfo.avatar || null,
              status: "online"
            });
          });
        }).catch(err => {
          console.error('Error notifying friends of status change:', err);
        });
      }).catch(err => {
        console.error('Error getting user info for status update:', err);
      });
    }).catch(err => {
      console.error('Error updating user status to online:', err);
    });
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from user ${userId}:`, data);
        
        // Handle specific client actions
        if (data.type === 'markRead' && data.messageId) {
          storage.markMessageAsRead(data.messageId)
            .then(success => {
              if (success) {
                // Re-fetch unread count and notify client
                return storage.getUnreadMessages(userId);
              }
              return [];
            })
            .then(unreadMessages => {
              ws.send(JSON.stringify({
                type: 'unreadMessages',
                data: { count: unreadMessages.length }
              }));
            })
            .catch(err => {
              console.error('Error handling markRead:', err);
            });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket connection closed for user ${userId}`);
      clients.get(userId)?.delete(ws);
      
      // Clean up empty user entries
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
        
        // Update user status to offline if they have no more connections
        getUserStatus(userId).then(async (status) => {
          if (status) {
            await updateUserStatus(userId, {
              status: "offline",
              lastActive: new Date()
            });
            
            // Notify friends about status change
            // First get the user info to ensure accurate data
            storage.getUser(userId).then(userInfo => {
              if (!userInfo) {
                console.error('Could not find user info for offline status update, userId:', userId);
                return;
              }
              
              // Then notify friends
              storage.getUserFriends(userId).then(friends => {
                friends.forEach(friend => {
                  notifyUser(friend.id, "friend_status", {
                    userId,
                    username: userInfo.username,
                    avatar: userInfo.avatar || null,
                    status: "offline"
                  });
                });
              }).catch(err => {
                console.error('Error notifying friends of offline status:', err);
              });
            }).catch(err => {
              console.error('Error getting user info for offline status update:', err);
            });
          }
        }).catch(err => {
          console.error('Error updating user status to offline:', err);
        });
      }
    });
  });
  
  // Broadcast to all connected clients
  function broadcast(type: string, data: any) {
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
      // Temporarily use empty array for top players until the leaderboard methods are fully implemented
      const topPlayers = [];
      
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
        topPlayers: [] // Empty array for now until leaderboard functionality is fully implemented
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
      
      console.log("Sending user profile response with gang data:", JSON.stringify(response));
      res.json(response);
    } catch (error) {
      console.error("Error getting user profile:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack available");
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
        
        let levelUp = false;
        // Check for level up
        if (updatedUser) {
          const newLevel = Math.floor(1 + Math.sqrt(updatedUser.xp / 100));
          if (newLevel > updatedUser.level) {
            await storage.updateUser(userId, { level: newLevel });
            levelUp = true;
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
          levelUp
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
  
  // User stats route
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const stats = await storage.getStatsByUserId(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Auto-release jailed users if their time has expired
  // This should be moved to a dedicated scheduled task in production
  app.get("/api/jail/check-release", async (req, res) => {
    try {
      // Get all jailed users
      const jailedUsers = await storage.getJailedUsers();
      const now = new Date();
      
      let releasedCount = 0;
      
      // Check each user
      for (const user of jailedUsers) {
        if (user.jailTimeEnd && user.jailTimeEnd <= now) {
          console.log(`Auto-releasing user ${user.id} from jail`);
          const releasedUser = await storage.releaseFromJail(user.id);
          
          if (releasedUser) {
            releasedCount++;
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: `Released ${releasedCount} users from jail`,
        releasedCount
      });
    } catch (error) {
      console.error("Error checking jail releases:", error);
      res.status(500).json({ message: "Failed to check jail releases" });
    }
  });
  
  // Get user's jail status
  app.get("/api/jail/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isJailed) {
        return res.json({
          isJailed: false
        });
      }
      
      return res.json({
        isJailed: true,
        jailTimeEnd: user.jailTimeEnd
      });
    } catch (error) {
      console.error("Error getting jail status:", error);
      res.status(500).json({ message: "Failed to get jail status" });
    }
  });
  
  return httpServer;
}