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
import newGangRoutes from "./new-gang-routes";
import gangTestRoutes from "./gang-routes-test";
import locationRoutes from "./location-routes";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { z } from "zod";
import { calculateRequiredXP } from "../shared/gameUtils";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { gangMembers } from "@shared/schema";
import { getUserStatus, updateUserStatus, createUserStatus } from './social-database';

// Add isAlive property to WebSocket type
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // EMERGENCY TEST ENDPOINT - needs to be registered before any other middleware
  app.get("/api/debug/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`[EMERGENCY] Direct DB query for user ID ${userId}`);
      
      // Direct SQL query to bypass all issues
      const result = await db.execute(sql`
        SELECT * FROM users WHERE id = ${userId}
      `);
      
      console.log("[EMERGENCY] Query result:", JSON.stringify(result.rows, null, 2));
      
      // Explicitly set content type to JSON
      res.setHeader('Content-Type', 'application/json');
      
      // Return the raw result
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: "User not found",
          userId
        });
      }
      
      return res.json({
        success: true,
        user: result.rows[0],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[EMERGENCY] Error:", error);
      return res.status(500).json({ 
        success: false,
        error: String(error)
      });
    }
  });
  
  // TEMPORARY ENDPOINT - create a test gang without authentication
  app.get("/api/debug/create-gang", async (req, res) => {
    try {
      console.log("[DEBUG] Creating a test gang directly into the gangs table");
      
      // Explicitly set content type to JSON
      res.setHeader('Content-Type', 'application/json');
      
      // Direct SQL query to create a gang
      const gangInsertQuery = `
        INSERT INTO gangs (name, tag, description, logo, owner_id, level, experience, respect, strength, defense) 
        VALUES ('Black Hand Society', 'BHS', 'A powerful criminal enterprise', '', 1, 1, 0, 0, 10, 10)
        RETURNING *
      `;
      
      try {
        const result = await db.execute(sql.raw(gangInsertQuery));
        console.log("[DEBUG] Gang insert result:", JSON.stringify(result.rows, null, 2));
        
        return res.json({
          success: true,
          gang: result.rows[0],
          timestamp: new Date().toISOString()
        });
      } catch (sqlError) {
        console.error("[DEBUG] SQL Error:", sqlError);
        return res.status(500).json({ 
          success: false,
          error: String(sqlError)
        });
      }
    } catch (error) {
      console.error("[DEBUG] Gang creation error:", error);
      return res.status(500).json({ 
        success: false,
        error: String(error)
      });
    }
  });
  
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
  
  // Register location-based challenges
  app.use("/api", locationRoutes);
  
  // Register gang routes with nested features
  app.use("/api/gangs-old", gangRoutes);
  
  // Register the new improved gang system
  app.use("/api/gangs", newGangRoutes);
  
  // Register test gang routes for debugging
  app.use("/api/gangs-test", gangTestRoutes);
  
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
    
    // Set ping pong tracking
    const pingTimeout = 30000; // 30 seconds
    ws.isAlive = true;
    
    // Ping handler
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Parse user ID from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0', 10);
    
    if (!userId) {
      console.log('No userId provided for WebSocket connection');
      return ws.close(1008, 'Invalid userId');
    }
    
    // Check if we already have an active connection from this user
    // Add this client to the map for this user
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    
    // First cleanup any potentially stale connections
    const existingConnections = clients.get(userId);
    existingConnections?.forEach(conn => {
      // If we find any connection that's not OPEN, remove it
      if (conn.readyState !== WebSocket.OPEN) {
        existingConnections.delete(conn);
        try {
          conn.terminate();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    });
    
    // Add the new connection
    clients.get(userId)?.add(ws);
    
    console.log(`User ${userId} connected via WebSocket. Active connections: ${clients.get(userId)?.size}`);
    
    // Periodic ping to keep connection alive and detect stale connections
    const pingInterval = setInterval(() => {
      if (ws.isAlive === false) {
        clearInterval(pingInterval);
        console.log(`Terminating inactive WebSocket for user ${userId}`);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (e) {
        clearInterval(pingInterval);
        console.error(`Error pinging WebSocket for user ${userId}:`, e);
        ws.terminate();
      }
    }, pingTimeout);
    
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
    
    // First check if user exists before attempting to update status
    storage.getUser(userId).then(async (userInfo) => {
      if (!userInfo) {
        console.error('Could not find user info for status update, userId:', userId);
        // We will NOT try to create a user status for a non-existent user
        // as that would violate foreign key constraints
        return; // Skip the rest if user doesn't exist
      }
      
      try {
        // Try-catch the getUserStatus call
        let status = null;
        try {
          status = await getUserStatus(userId);
        } catch (statusErr) {
          console.error('Error getting user status, will create new one:', statusErr);
        }
        
        if (status) {
          // Update existing status to online
          try {
            await updateUserStatus(userId, {
              status: "online",
              lastActive: new Date()
            });
          } catch (updateErr) {
            console.error('Error updating user status:', updateErr);
          }
        } else {
          // Create new status as online
          try {
            await createUserStatus({
              userId,
              status: "online",
              lastActive: new Date(),
              lastLocation: null
            });
          } catch (createErr) {
            console.error('Error creating user status:', createErr);
          }
        }
        
        // Notify friends about this user coming online
        try {
          const friends = await storage.getUserFriends(userId);
          friends.forEach(friend => {
            notifyUser(friend.id, "friend_status", {
              userId,
              username: userInfo.username,
              avatar: userInfo.avatar || null,
              status: "online"
            });
          });
        } catch (friendsErr) {
          console.error('Error notifying friends of status change:', friendsErr);
        }
      } catch (err) {
        console.error('Error in status update workflow:', err);
      }
    }).catch(err => {
      console.error('Error getting user for status update:', err);
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
        
        // Handle heartbeat messages - send response back
        if (data.type === 'heartbeat') {
          ws.send(JSON.stringify({
            type: 'heartbeat_response',
            data: { 
              userId,
              timestamp: new Date().toISOString() 
            }
          }));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket connection closed for user ${userId}`);
      
      // Clear the ping interval to prevent memory leaks
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      // Remove this connection from the clients map
      clients.get(userId)?.delete(ws);
      
      // Clean up empty user entries
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
        
        // Update user status to offline if they have no more connections
        // First check if user exists before proceeding
        storage.getUser(userId).then(async (userInfo) => {
          if (!userInfo) {
            console.error('Could not find user info for offline status update, userId:', userId);
            return; // Skip if user doesn't exist
          }
          
          try {
            // Delay the offline status update briefly in case this is just a reconnect
            setTimeout(async () => {
              // Check again if the user has connections before setting offline
              if (clients.has(userId) && clients.get(userId)?.size > 0) {
                console.log(`User ${userId} reconnected, not setting offline status`);
                return;
              }
              
              // Try-catch the getUserStatus call
              let status = null;
              try {
                status = await getUserStatus(userId);
              } catch (statusErr) {
                console.error('Error getting user status for offline update:', statusErr);
              }
              
              if (status) {
                try {
                  await updateUserStatus(userId, {
                    status: "offline",
                    lastActive: new Date()
                  });
                } catch (updateErr) {
                  console.error('Error updating user offline status:', updateErr);
                }
                
                // Get friends and notify them about status change
                try {
                  const friends = await storage.getUserFriends(userId);
                  friends.forEach(friend => {
                    notifyUser(friend.id, "friend_status", {
                      userId,
                      username: userInfo.username,
                      avatar: userInfo.avatar || null,
                      status: "offline"
                    });
                  });
                } catch (friendsErr) {
                  console.error('Error notifying friends of offline status change:', friendsErr);
                }
              }
            }, 5000); // 5-second delay to account for page refreshes and quick reconnects
          } catch (err) {
            console.error('Error in offline status update workflow:', err);
          }
        }).catch(err => {
          console.error('Error getting user info for offline status update:', err);
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
  
  // Leaderboard API Routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const type = req.query.type as string || 'level';
      const timeFrame = req.query.timeFrame as string || 'all';
      
      // Get all users for the leaderboard
      const users = await storage.getAllUsers();
      
      if (!users || users.length === 0) {
        return res.json([]);
      }
      
      // Sort users based on leaderboard type
      let leaderboard = [];
      
      switch (type) {
        case 'level':
          // Sort by level, then by XP for tiebreaker
          leaderboard = users
            .sort((a, b) => {
              if (b.level === a.level) {
                return b.xp - a.xp;
              }
              return b.level - a.level;
            })
            .map(user => ({
              id: user.id,
              username: user.username,
              level: user.level,
              xp: user.xp,
              gangId: user.gangId,
              avatar: user.avatar,
              strength: user.stats?.strength,
              stealth: user.stats?.stealth,
              charisma: user.stats?.charisma,
              intelligence: user.stats?.intelligence,
              cash: user.cash,
              respect: user.respect
            }));
          break;
          
        case 'cash':
          // Sort by cash
          leaderboard = users
            .sort((a, b) => b.cash - a.cash)
            .map(user => ({
              id: user.id,
              username: user.username,
              level: user.level,
              cash: user.cash,
              gangId: user.gangId,
              avatar: user.avatar,
              strength: user.stats?.strength,
              stealth: user.stats?.stealth,
              charisma: user.stats?.charisma,
              intelligence: user.stats?.intelligence,
              xp: user.xp,
              respect: user.respect
            }));
          break;
          
        case 'respect':
          // Sort by respect
          leaderboard = users
            .sort((a, b) => b.respect - a.respect)
            .map(user => ({
              id: user.id,
              username: user.username,
              level: user.level,
              respect: user.respect,
              gangId: user.gangId,
              avatar: user.avatar,
              strength: user.stats?.strength,
              stealth: user.stats?.stealth,
              charisma: user.stats?.charisma,
              intelligence: user.stats?.intelligence,
              xp: user.xp,
              cash: user.cash
            }));
          break;
          
        case 'gangs':
          // Get all gangs for gang leaderboard
          try {
            const gangs = await storage.getAllGangs();
            if (gangs && gangs.length > 0) {
              // Sort gangs by bank balance for now (can add more complex ranking later)
              leaderboard = gangs
                .sort((a, b) => (b.bankBalance || 0) - (a.bankBalance || 0))
                .map(gang => ({
                  id: gang.id,
                  name: gang.name,
                  tag: gang.tag || gang.name.substring(0, 3).toUpperCase(),
                  bankBalance: gang.bankBalance || 0,
                  memberCount: gang.memberCount || 0
                }));
            }
          } catch (error) {
            console.error("Error getting gang leaderboard:", error);
            leaderboard = []; // Return empty array if there's an error
          }
          break;
          
        default:
          // Default to level leaderboard
          leaderboard = users
            .sort((a, b) => b.level - a.level)
            .map(user => ({
              id: user.id,
              username: user.username,
              level: user.level,
              xp: user.xp,
              gangId: user.gangId,
              avatar: user.avatar,
              strength: user.stats?.strength,
              stealth: user.stats?.stealth,
              charisma: user.stats?.charisma,
              intelligence: user.stats?.intelligence,
              cash: user.cash,
              respect: user.respect
            }));
      }
      
      // For now, we're not implementing time-based filtering since we don't track historical data
      // In a future update, we could store daily/weekly snapshots for true historical leaderboards
      
      // Limit to top 100 to avoid sending too much data
      const limitedLeaderboard = leaderboard.slice(0, 100);
      
      res.json(limitedLeaderboard);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard data" });
    }
  });
  
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
        
        // Check for achievements
        let unlockedAchievements = [];
        try {
          // 1. Check for "crime_committed" achievement (any crime)
          const crimeAchievements = await storage.checkAndUpdateAchievementProgress(userId, "crime_committed");
          
          // 2. Check for specific crime achievements using the crime name as target
          const specificCrimeAchievements = await storage.checkAndUpdateAchievementProgress(
            userId,
            "crime_specific",
            crime.name
          );
          
          // 3. Check for cash earned from crimes achievement
          const cashAchievements = await storage.checkAndUpdateAchievementProgress(
            userId,
            "crime_cash_earned", 
            undefined,
            cashReward
          );
          
          // Combine all unlocked achievements
          unlockedAchievements = [
            ...crimeAchievements,
            ...specificCrimeAchievements,
            ...cashAchievements
          ];
        } catch (err) {
          console.error("Error checking achievements:", err);
          // Continue execution, don't let achievement errors affect the main flow
        }
          
          // Include achievement notification in response if any were unlocked
          return res.json({
            success: true,
            cashReward,
            xpReward,
            unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined,
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