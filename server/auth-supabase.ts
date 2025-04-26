import { Express, Request, Response, NextFunction } from 'express';
import { verifyToken } from './supabase';
import { db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      supabaseUser?: any;
    }
  }
}

/**
 * Setup auth routes for Supabase auth
 * @param app Express app
 */
export function setupAuthRoutes(app: Express) {
  // Extract JWT from Authorization header and verify it
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }
    
    // Verify token with Supabase
    const supabaseUser = await verifyToken(authHeader);
    if (!supabaseUser) {
      return next();
    }
    
    // Save Supabase user in request
    req.supabaseUser = supabaseUser;
    
    // Get game user from database using Supabase ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseUser.id))
      .limit(1);
    
    if (user) {
      req.user = user;
      
      // Update last seen timestamp
      await db
        .update(users)
        .set({ lastSeen: new Date() })
        .where(eq(users.id, user.id));
    }
    
    next();
  });
  
  // Return current authenticated user
  app.use('/api/user', authProtected, (req: Request, res: Response) => {
    res.json(req.user);
  });
  
  // Register a new user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      // Get Supabase ID from request body
      const { supabaseId, username, email, password, confirmPassword } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      // Check if username already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Create user in our database
      const [user] = await db
        .insert(users)
        .values({
          username,
          email,
          password: 'supabase', // Password is handled by Supabase
          supabaseId,
          level: 1,
          experience: 0,
          cash: 1000,
          respect: 0,
          profileTheme: 'dark',
          createdAt: new Date(),
        })
        .returning();
      
      // Return the created user
      res.status(201).json(user);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });
}

/**
 * Middleware to ensure user is authenticated
 */
export function authProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
}

/**
 * Middleware to ensure user is an admin
 */
export function adminProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Admin required' });
  }
  
  next();
}