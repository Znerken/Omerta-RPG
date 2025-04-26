import { Express, Request, Response, NextFunction } from 'express';
import { verifyToken } from './supabase';
import { storage } from './storage-supabase';

// Extend the Express.Request interface to include user properties
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
  // Authentication middleware that checks for a valid JWT token
  // and attaches the user to the request object
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return next();
      }

      // Verify token with Supabase
      const supabaseUser = await verifyToken(authHeader);
      if (!supabaseUser) {
        return next();
      }

      // Set Supabase user on request
      req.supabaseUser = supabaseUser;

      // Get user from our database
      const user = await storage.getUserBySupabaseId(supabaseUser.id);
      if (user) {
        req.user = user;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next();
    }
  });

  // User route to get the current user's data
  app.use('/api/user', authProtected, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // Register route to create a new user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword, supabaseId } = req.body;

      // Validate required fields
      if (!username || !email || (!password && !supabaseId)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if password matches confirm password
      if (password && confirmPassword && password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Create user in our database
      const user = await storage.createUser({
        username,
        email,
        password: 'supabase-managed', // Password is managed by Supabase
        supabaseId,
        level: 1,
        experience: 0,
        cash: 1000,
        respect: 0,
        profileTheme: 'dark',
        createdAt: new Date(),
        lastSeen: new Date(),
        status: 'offline',
      });

      // Return user data
      res.status(201).json(user);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Registration failed' });
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
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  next();
}