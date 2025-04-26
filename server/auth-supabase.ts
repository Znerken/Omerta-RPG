import { Express, Request, Response, NextFunction } from "express";
import { supabaseClient } from "./supabase";
import { db } from "./db-supabase";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Middleware to check Supabase auth
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Find the corresponding user in our database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, user.id));
      
    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    
    // Check if user is banned
    if (dbUser.banExpiry && new Date(dbUser.banExpiry) > new Date()) {
      return res.status(403).json({
        error: 'Forbidden: Your account has been banned',
        reason: dbUser.banReason,
        expiry: dbUser.banExpiry,
      });
    }
    
    // Attach user to request object
    req.user = dbUser;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  next();
};

// Middleware to check if user is jailed
export const isNotJailed = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.isJailed) {
    // Check if jail time has expired
    if (req.user.jailTimeEnd && new Date(req.user.jailTimeEnd) <= new Date()) {
      // Release from jail
      db.update(users)
        .set({ isJailed: false, jailTimeEnd: null, jailReason: null })
        .where(eq(users.id, req.user.id))
        .then(() => {
          req.user.isJailed = false;
          req.user.jailTimeEnd = null;
          req.user.jailReason = null;
          next();
        })
        .catch(error => {
          console.error('Error releasing user from jail:', error);
          next();
        });
    } else {
      // Still in jail
      return res.status(403).json({
        error: 'Forbidden: You are in jail',
        jailTimeEnd: req.user.jailTimeEnd,
        reason: req.user.jailReason,
      });
    }
  } else {
    next();
  }
};

// Set up authentication routes
export function setupAuthRoutes(app: Express) {
  // Register new user
  app.post('/api/register', async (req, res) => {
    try {
      const { supabaseId, username, email, password, ...userData } = req.body;
      
      // Check if username is already taken
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
        
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      
      // Check if valid Supabase ID is provided
      if (!supabaseId) {
        return res.status(400).json({ error: 'Invalid Supabase ID' });
      }
      
      // Create user in our database
      const [user] = await db
        .insert(users)
        .values({
          username,
          password: "supabase-auth", // Not used with Supabase auth
          email,
          supabaseId,
          level: userData.level || 1,
          xp: userData.xp || 0,
          cash: userData.cash || 1000,
          respect: userData.respect || 0,
          isAdmin: userData.isAdmin || false,
          isJailed: userData.isJailed || false,
        })
        .returning();
        
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });
  
  // Get current user
  app.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.user);
  });
  
  // Update user profile
  app.patch('/api/user', isAuthenticated, async (req, res) => {
    try {
      const { username, email, ...updatableFields } = req.body;
      
      // Don't allow updating username or email through this endpoint
      // Those should go through Supabase Auth
      
      const [user] = await db
        .update(users)
        .set(updatableFields)
        .where(eq(users.id, req.user.id))
        .returning();
        
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });
}