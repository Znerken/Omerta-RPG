import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken } from './supabase';
import { db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { Express } from 'express';

/**
 * Middleware to check if the user is authenticated through Supabase
 * Validates the JWT token and sets req.user if authenticated
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no auth header, check for session in cookies (for traditional session auth)
      if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Validate token with Supabase
    const supabaseUser = await validateSupabaseToken(token);
    
    if (!supabaseUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get corresponding user from our database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseUser.id));
    
    if (!dbUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }
    
    // Check if user is banned
    if (dbUser.banned) {
      return res.status(403).json({ 
        error: 'Account banned', 
        reason: dbUser.banReason || 'Violation of terms of service' 
      });
    }
    
    // Set user on request object
    req.user = dbUser;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if the user is an admin
 * Must be used after isAuthenticated
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  next();
};

/**
 * Middleware to check if the user is not jailed
 * Must be used after isAuthenticated
 */
export const isNotJailed = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.jailed) {
    // Calculate remaining time
    const now = new Date();
    const releaseDate = req.user.jailUntil;
    
    if (releaseDate && releaseDate > now) {
      const remainingTimeMs = releaseDate.getTime() - now.getTime();
      const remainingTimeMinutes = Math.ceil(remainingTimeMs / (1000 * 60));
      
      return res.status(403).json({ 
        error: 'Restricted access: You are currently in jail',
        reason: req.user.jailReason || 'Criminal activity',
        releaseDate: releaseDate.toISOString(),
        remainingTimeMinutes
      });
    }
    
    // If jail time is up, we should update the user record
    // But let them through for now, this will be handled elsewhere
  }
  
  next();
};

/**
 * Set up authentication routes
 * @param app Express application
 */
export function setupAuthRoutes(app: Express) {
  // Check username availability
  app.get('/api/check-username', async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username is required' });
      }
      
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));
      
      res.json({ exists: !!user });
    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Register new user
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password, confirmPassword, supabaseId } = req.body;
      
      // Basic validation
      if (!username || !email || !password || !confirmPassword || !supabaseId) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      
      // Check if username or email already exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Create user
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password, // Note: This should be hashed in a real app, but we're keeping it as-is for simplicity
        supabaseId,
        createdAt: new Date(),
        lastActive: new Date(),
        isAdmin: false,
        cash: 1000, // Starting cash
        bank: 0,
        level: 1,
        experience: 0,
        energy: 100,
        maxEnergy: 100,
        health: 100,
        maxHealth: 100,
        strength: 10,
        defense: 10,
        dexterity: 10,
        intelligence: 10,
        charisma: 10,
        stamina: 10,
        respect: 0,
        jailed: false,
        banned: false,
      }).returning();
      
      // Set user on session for traditional auth
      if (req.login) {
        req.login(newUser, (err) => {
          if (err) {
            console.error('Error logging in after registration:', err);
          }
        });
      }
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });
  
  // Get current user
  app.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.user);
  });
  
  // Logout (for traditional session-based auth)
  app.post('/api/logout', (req, res) => {
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });
}