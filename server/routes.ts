import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { setupAuthRoutes, authProtected, adminProtected, jailProtected, checkUsernameEmail } from './auth-supabase';
import { storage } from './storage-supabase';
import { registerWebSocketServer } from './websocket-supabase';
import { registerProfileRoutes } from './profile-routes';
import { registerCasinoRoutes } from './casino-routes';
import { registerDrugRoutes } from './drug-routes';
import { registerBankingRoutes } from './banking-routes';
import { registerGangRoutes } from './gang-routes';
import { registerAchievementRoutes } from './achievement-routes';
import { registerAdminRoutes } from './admin-routes';
import { registerSocialRoutes } from './social-routes';
import { eq, and, desc, sql } from 'drizzle-orm';
import { users, userStats, crimes, locations } from '@shared/schema';
import { db } from './db-supabase';
import { extractAndValidateToken } from './supabase';

/**
 * Register all routes for the API
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Authenticate all requests with Supabase
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

  app.post('/api/check-username-email', async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
      }
      
      const isAvailable = await checkUsernameEmail(username, email);
      
      if (isAvailable) {
        return res.json({ available: true });
      } else {
        return res.status(400).json({ message: 'Username or email is already taken' });
      }
    } catch (error) {
      console.error('Error checking username/email:', error);
      res.status(500).json({ message: 'Failed to check username/email availability' });
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
        experience: req.user.experience + 10
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
      const crimesList = await db.select().from(crimes).orderBy(crimes.difficulty);
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
      
      // Calculate success probability based on user stats and crime difficulty
      let successProbability = 0.5; // Base probability
      
      // Adjust based on stats
      const statWeight = 0.1; // Weight for each stat's contribution
      successProbability += statWeight * (userStats.strength / 100);
      successProbability += statWeight * (userStats.stealth / 100);
      successProbability += statWeight * (userStats.charisma / 100);
      successProbability += statWeight * (userStats.intelligence / 100);
      
      // Adjust based on crime difficulty
      successProbability -= (crimeData.difficulty * 0.1);
      
      // Ensure probability is between 0.1 and 0.9
      successProbability = Math.min(0.9, Math.max(0.1, successProbability));
      
      // Determine if crime was successful
      const success = Math.random() < successProbability;
      
      if (success) {
        // Crime was successful
        // Reward the player with cash and XP
        const cashReward = crimeData.reward * (1 + Math.random() * 0.2); // Random bonus up to 20%
        const xpReward = crimeData.xp * (1 + Math.random() * 0.2);
        
        await storage.updateUser(req.user.id, {
          cash: req.user.cash + Math.round(cashReward),
          experience: req.user.experience + Math.round(xpReward)
        });
        
        return res.json({
          success: true,
          caught: false,
          cashReward: Math.round(cashReward),
          xpReward: Math.round(xpReward),
          message: `You successfully completed the ${crimeData.name} and earned $${Math.round(cashReward)} and ${Math.round(xpReward)} XP.`
        });
      } else {
        // Crime failed - determine if player was caught
        const catchProbability = 0.7; // 70% chance of being caught if failed
        const caught = Math.random() < catchProbability;
        
        if (caught) {
          // Player was caught and goes to jail
          const now = new Date();
          const jailTime = new Date(now);
          jailTime.setMinutes(jailTime.getMinutes() + crimeData.difficulty * 5); // 5 minutes per difficulty level
          
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
      
      // Return information about the request's auth state
      res.json({
        hasAuthHeader,
        authHeaderValue: hasAuthHeader ? `${authHeader?.substring(0, 10)}...` : null,
        isAuthenticated: req.isAuthenticated(),
        user: req.isAuthenticated() ? {
          id: req.user?.id,
          username: req.user?.username,
          supabaseId: req.user?.supabaseId,
          hasSupabaseId: !!req.user?.supabaseId
        } : null
      });
    } catch (error) {
      console.error('Error in auth check route:', error);
      res.status(500).json({ message: 'Error checking auth state' });
    }
  });
  
  // Route to force link the current authenticated Supabase user with a game user
  app.post('/api/link-supabase-user', async (req: Request, res: Response) => {
    try {
      // Extract the token and validate it
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No auth header present' });
      }
      
      // Get the Supabase user from the token
      const supabaseUser = await extractAndValidateToken(req);
      if (!supabaseUser) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get the game username from the request body
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find the game user by username
      const gameUser = await storage.getUserByUsername(username);
      if (!gameUser) {
        return res.status(404).json({ message: 'Game user not found' });
      }
      
      // Check if the password is correct (basic check for now)
      if (gameUser.password !== password) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      // Update the user with the Supabase ID
      const updatedUser = await storage.updateUser(gameUser.id, {
        supabaseId: supabaseUser.sub,
        email: supabaseUser.email || gameUser.email // Use Supabase email if available
      });
      
      res.json({
        success: true,
        message: 'Successfully linked Supabase user to game account',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          supabaseId: updatedUser.supabaseId
        }
      });
    } catch (error) {
      console.error('Error linking Supabase user:', error);
      res.status(500).json({ message: 'Server error linking Supabase user' });
    }
  });

  // Debug route to check Supabase auth and game database link
  app.get('/api/debug/auth-link', async (req: Request, res: Response) => {
    try {
      // Extract the token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No auth header present' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token in auth header' });
      }
      
      // Get the Supabase user from the token
      const supabaseUser = await extractAndValidateToken(req);
      if (!supabaseUser) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      console.log('Debug route - token validated for Supabase user:', supabaseUser.sub);
      
      // Try to find the user in the game database by Supabase ID
      let gameUser = await storage.getUserBySupabaseId(supabaseUser.sub);
      let source = 'supabaseId';
      
      // If not found, try email
      if (!gameUser && supabaseUser.email) {
        gameUser = await storage.getUserByEmail(supabaseUser.email);
        source = 'email';
        
        // If found by email, update their Supabase ID for future logins
        if (gameUser) {
          await storage.updateUser(gameUser.id, { supabaseId: supabaseUser.sub });
          console.log('Updated Supabase ID for user found by email');
        }
      }
      
      if (!gameUser) {
        return res.status(404).json({
          message: 'No game user found for the authenticated Supabase user',
          supabaseUserId: supabaseUser.sub,
          email: supabaseUser.email || 'unknown'
        });
      }
      
      // Return debug information
      res.json({
        success: true,
        foundBy: source,
        supabaseUser: {
          id: supabaseUser.sub,
          email: supabaseUser.email
        },
        gameUser: {
          id: gameUser.id,
          username: gameUser.username,
          email: gameUser.email,
          supabaseId: gameUser.supabaseId
        }
      });
    } catch (error) {
      console.error('Error in auth link debug route:', error);
      res.status(500).json({ message: 'Server error in auth link debug' });
    }
  });
  
  // Route to check if a supabase ID is already linked to a game account
  app.get('/api/debug/check-supabase-id/:supabaseId', async (req: Request, res: Response) => {
    try {
      const { supabaseId } = req.params;
      
      if (!supabaseId) {
        return res.status(400).json({ message: 'Supabase ID is required' });
      }
      
      // Check if this Supabase ID is already linked to a game account
      const user = await storage.getUserBySupabaseId(supabaseId);
      
      if (user) {
        return res.json({
          linked: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      } else {
        return res.json({ linked: false });
      }
    } catch (error) {
      console.error('Error checking Supabase ID:', error);
      res.status(500).json({ message: 'Server error checking Supabase ID' });
    }
  });

  // Route to force update a user's Supabase ID based on email
  app.post('/api/debug/update-supabase-id', async (req: Request, res: Response) => {
    try {
      const { email, supabaseId } = req.body;
      
      if (!email || !supabaseId) {
        return res.status(400).json({ message: 'Email and Supabase ID are required' });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found with the provided email' });
      }
      
      // Update the user's Supabase ID
      const updatedUser = await storage.updateUser(user.id, { supabaseId });
      
      res.json({
        success: true,
        message: 'User Supabase ID updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          supabaseId: updatedUser.supabaseId
        }
      });
    } catch (error) {
      console.error('Error updating Supabase ID:', error);
      res.status(500).json({ message: 'Server error updating Supabase ID' });
    }
  });
  
  // Register feature-specific routes
  registerProfileRoutes(app);
  registerCasinoRoutes(app);
  registerDrugRoutes(app);
  registerBankingRoutes(app);
  registerGangRoutes(app);
  registerAchievementRoutes(app);
  registerAdminRoutes(app);
  registerSocialRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register WebSocket server
  registerWebSocketServer(httpServer);

  return httpServer;
}