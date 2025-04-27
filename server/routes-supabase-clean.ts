import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { setupAuthRoutes, authProtected, adminProtected, jailProtected } from './auth-supabase-clean';
import { storage } from './storage-supabase-clean';
import { eq, and, desc, sql } from 'drizzle-orm';
import { users, stats, crimes, locationChallenges as locations, userStatus } from '@shared/schema';
import { db } from './db-supabase';
import { extractAndValidateToken } from './supabase';
import { registerWebSocketServer } from './websocket-supabase-clean';

/**
 * Register all routes for the API
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register WebSocket server
  registerWebSocketServer(httpServer);
  
  // Set up Supabase authentication routes
  setupAuthRoutes(app);

  // User-related routes
  app.get('/api/user/stats', authProtected, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      if (!stats) {
        return res.status(404).json({ message: 'Stats not found' });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user stats' });
    }
  });

  // Training routes
  app.post('/api/stats/train/:stat', authProtected, jailProtected, async (req: Request, res: Response) => {
    try {
      const { stat } = req.params;
      const userId = req.user.id;
      
      // Get user stats
      const userStat = await storage.getUserStats(userId);
      if (!userStat) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Check which stat to train and if cooldown has expired
      const now = new Date();
      let cooldownField;
      let statField;
      
      switch (stat) {
        case 'strength':
          cooldownField = 'strengthTrainingCooldown';
          statField = 'strength';
          break;
        case 'stealth':
          cooldownField = 'stealthTrainingCooldown';
          statField = 'stealth';
          break;
        case 'charisma':
          cooldownField = 'charismaTrainingCooldown';
          statField = 'charisma';
          break;
        case 'intelligence':
          cooldownField = 'intelligenceTrainingCooldown';
          statField = 'intelligence';
          break;
        default:
          return res.status(400).json({ message: 'Invalid stat' });
      }
      
      // Check if cooldown has expired
      if (userStat[cooldownField] && new Date(userStat[cooldownField]) > now) {
        return res.status(400).json({
          message: 'Cooldown not expired',
          cooldownRemaining: Math.ceil((new Date(userStat[cooldownField]).getTime() - now.getTime()) / 1000)
        });
      }
      
      // Calculate new cooldown (5 minutes)
      const cooldown = new Date();
      cooldown.setMinutes(cooldown.getMinutes() + 5);
      
      // Update the stat and cooldown
      const updateData = {
        [statField]: userStat[statField] + 1,
        [cooldownField]: cooldown
      };
      
      const updatedStats = await storage.updateUserStats(userId, updateData);
      
      // Also add some XP to the user
      await storage.updateUser(userId, {
        xp: req.user.xp + 10
      });
      
      res.json(updatedStats);
    } catch (error) {
      console.error('Error training stat:', error);
      res.status(500).json({ message: 'Failed to train stat' });
    }
  });

  // Crime routes
  app.get('/api/crimes', async (req: Request, res: Response) => {
    try {
      const crimesList = await db.select().from(crimes);
      res.json(crimesList);
    } catch (error) {
      console.error('Error fetching crimes:', error);
      res.status(500).json({ message: 'Failed to fetch crimes' });
    }
  });

  app.post('/api/crimes/:id/execute', authProtected, jailProtected, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const crime = await db.select().from(crimes).where(eq(crimes.id, parseInt(id))).limit(1);
      
      if (!crime.length) {
        return res.status(404).json({ message: 'Crime not found' });
      }
      
      const crimeData = crime[0];
      const userStats = await storage.getUserStats(req.user.id);
      
      if (!userStats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Calculate success probability based on user stats and crime weight
      let successProbability = 0.5; // Base probability
      
      // Adjust based on stats
      const statWeight = 0.1; // Weight for each stat's contribution
      successProbability += statWeight * (userStats.strength / 100);
      successProbability += statWeight * (userStats.stealth / 100);
      successProbability += statWeight * (userStats.charisma / 100);
      successProbability += statWeight * (userStats.intelligence / 100);
      
      // Adjust based on crime difficulty (using average of all weights as indicator)
      const difficultyFactor = (crimeData.strengthWeight + crimeData.stealthWeight + 
                               crimeData.charismaWeight + crimeData.intelligenceWeight) / 4 * 0.01;
      successProbability -= difficultyFactor;
      
      // Ensure probability is between 0.1 and 0.9
      successProbability = Math.min(0.9, Math.max(0.1, successProbability));
      
      // Determine if crime was successful
      const success = Math.random() < successProbability;
      
      if (success) {
        // Crime was successful
        // Reward the player with cash and XP from crime min/max ranges
        const cashReward = Math.floor(
          crimeData.minCashReward + 
          Math.random() * (crimeData.maxCashReward - crimeData.minCashReward)
        );
        const xpReward = Math.floor(
          crimeData.minXpReward + 
          Math.random() * (crimeData.maxXpReward - crimeData.minXpReward)
        );
        
        await storage.updateUser(req.user.id, {
          cash: req.user.cash + cashReward,
          xp: req.user.xp + xpReward
        });
        
        return res.json({
          success: true,
          caught: false,
          cashReward: cashReward,
          xpReward: xpReward,
          message: `You successfully completed the ${crimeData.name} and earned $${cashReward} and ${xpReward} XP.`
        });
      } else {
        // Crime failed - determine if player was caught
        const catchProbability = crimeData.jailRisk / 100; // Use configured jail risk
        const caught = Math.random() < catchProbability;
        
        if (caught) {
          // Player was caught and goes to jail
          const now = new Date();
          const jailTime = new Date(now);
          jailTime.setMinutes(jailTime.getMinutes() + crimeData.jailTime); // Use configured jail time
          
          await storage.updateUser(req.user.id, {
            isJailed: true,
            jailTimeEnd: jailTime,
            jailReason: `Caught during ${crimeData.name}`
          });
          
          return res.json({
            success: false,
            caught: true,
            jailed: true,
            jailTime: jailTime,
            message: `You were caught during the ${crimeData.name} and have been sent to jail until ${jailTime.toLocaleString()}.`
          });
        } else {
          // Player failed but wasn't caught
          return res.json({
            success: false,
            caught: false,
            message: `You failed to complete the ${crimeData.name} but managed to escape without being caught.`
          });
        }
      }
    } catch (error) {
      console.error('Error executing crime:', error);
      res.status(500).json({ message: 'Failed to execute crime' });
    }
  });

  // Location routes
  app.get('/api/locations', async (req: Request, res: Response) => {
    try {
      const locationsList = await db.select().from(locations);
      res.json(locationsList);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  });

  app.get('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [location] = await db.select().from(locations).where(eq(locations.id, parseInt(id)));
      
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      
      res.json(location);
    } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({ message: 'Failed to fetch location' });
    }
  });

  // Dashboard route
  app.get('/api/dashboard', authProtected, async (req: Request, res: Response) => {
    try {
      // Get user with gang info
      const user = req.user;
      
      // Get user's gang if they have one
      const gang = await storage.getUserGang(user.id);
      
      // Enrich user with gang info
      const userWithGang = {
        ...user,
        gang: gang || null,
      };
      
      // Get high-level summary data
      const latestUsers = await db
        .select({
          id: users.id,
          username: users.username,
          level: users.level,
          createdAt: users.createdAt
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(5);
      
      // Count total users
      const [userCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(users);
      
      // Response with dashboard data
      res.json({
        user: userWithGang,
        stats: {
          totalUsers: userCount.count,
          // Add more stats as needed
        },
        latestUsers
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // A simple route to check auth state
  app.get('/api/debug/auth-check', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const hasAuthHeader = !!authHeader;
      
      // Get Supabase user from token
      const supabaseUser = hasAuthHeader ? await extractAndValidateToken(req) : null;
      
      // Return information about the request's auth state
      res.json({
        hasAuthHeader,
        authHeaderValue: hasAuthHeader ? `${authHeader?.substring(0, 10)}...` : null,
        isAuthenticated: !!req.user,
        supabaseUser: supabaseUser ? {
          id: supabaseUser.id,
          email: supabaseUser.email
        } : null,
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          supabaseId: req.user.supabaseId,
          hasSupabaseId: !!req.user.supabaseId
        } : null
      });
    } catch (error) {
      console.error('Error in auth check route:', error);
      res.status(500).json({ message: 'Error checking auth state' });
    }
  });

  // Friends system
  app.get('/api/friends', authProtected, async (req: Request, res: Response) => {
    try {
      const friends = await storage.getFriends(req.user.id);
      res.json(friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ message: 'Failed to fetch friends' });
    }
  });

  app.post('/api/friends/add/:id', authProtected, async (req: Request, res: Response) => {
    try {
      const friendId = parseInt(req.params.id);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: 'Invalid friend ID' });
      }
      
      // Check if friend exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Add friend
      const success = await storage.addFriend(req.user.id, friendId);
      
      if (success) {
        res.json({ message: `${friend.username} added to your friends list` });
      } else {
        res.status(400).json({ message: 'User is already in your friends list' });
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({ message: 'Failed to add friend' });
    }
  });

  app.delete('/api/friends/remove/:id', authProtected, async (req: Request, res: Response) => {
    try {
      const friendId = parseInt(req.params.id);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: 'Invalid friend ID' });
      }
      
      // Remove friend
      await storage.removeFriend(req.user.id, friendId);
      
      res.json({ message: 'Friend removed' });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ message: 'Failed to remove friend' });
    }
  });

  // Messages system
  app.get('/api/messages', authProtected, async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const messages = await storage.getUserMessages(req.user.id, {
        type,
        limit,
        offset
      });
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages/send', authProtected, async (req: Request, res: Response) => {
    try {
      const { receiverId, gangId, content, type = 'direct' } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      const message = await storage.sendMessage(req.user.id, content, {
        receiverId,
        gangId,
        type
      });
      
      res.json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  return httpServer;
}