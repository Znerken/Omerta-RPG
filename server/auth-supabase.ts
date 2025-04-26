import { Request, Response, NextFunction, Express } from 'express';
import { verifyToken, getUserById } from './supabase';
import { storage } from './storage';

/**
 * Custom express request with user property
 */
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
  // Auth middleware - verify JWT token and attach user to request
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // No auth header, continue without user
    }
    
    try {
      // Verify JWT token
      const supabaseUser = await verifyToken(authHeader);
      
      if (!supabaseUser) {
        return next(); // Invalid token, continue without user
      }
      
      // Look up user in our database by Supabase ID
      const user = await storage.getUserBySupabaseId(supabaseUser.id);
      
      if (user) {
        // Set both users on the request
        req.user = user;
        req.supabaseUser = supabaseUser;
      } else {
        console.warn(`Supabase user ${supabaseUser.id} not found in database`);
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next();
    }
  });
  
  // User endpoint - returns current user data
  app.use('/api/user', authProtected, (req: Request, res: Response) => {
    res.json(req.user);
  });
  
  // Register endpoint - create a new user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword, supabaseId } = req.body;
      
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Create user in our database
      const user = await storage.createUser({
        username,
        email,
        password: 'SUPABASE_AUTH', // We don't store password, Supabase does
        supabaseId, // Link to Supabase user if ID provided
        isAdmin: false,
        cash: 1000, // Starting cash
        respect: 0,
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        strength: 10,
        defense: 10,
        dexterity: 10,
        intelligence: 10,
        charisma: 10,
        avatar: null,
        profileTheme: 'classic',
        rank: 'Street Thug',
        jailStatus: false,
        jailReleaseTime: null,
        lastAction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        supabaseId: user.supabaseId,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
}

/**
 * Middleware to ensure user is authenticated
 */
export function authProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

/**
 * Middleware to ensure user is an admin
 */
export function adminProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
}