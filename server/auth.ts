import { Express, Request, Response, NextFunction } from 'express';
import { validateAuthHeader } from './supabase';
import { storage } from './storage-supabase';

// Extend Request type to include user
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
  // Authentication middleware for all API routes
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for public routes
    if (
      req.path.startsWith('/auth') ||
      req.path === '/api/check-username-email' ||
      req.path === '/api/register'
    ) {
      return next();
    }

    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    try {
      // Validate JWT token with Supabase
      const supabaseUser = await validateAuthHeader(authHeader);
      if (!supabaseUser) {
        return next();
      }

      // Get user from database using Supabase ID
      const user = await storage.getUserBySupabaseId(supabaseUser.id);
      if (!user) {
        return next();
      }

      // Attach user to request
      req.user = user;
      req.supabaseUser = supabaseUser;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next();
    }
  });

  // Get current user endpoint
  app.use('/api/user', authProtected, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // Check if username or email is already taken
  app.post('/api/check-username-email', async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
      }

      const isAvailable = await checkUsernameEmail(username, email);

      if (!isAvailable) {
        return res.status(409).json({ message: 'Username or email is already taken' });
      }

      res.status(200).json({ available: true });
    } catch (error) {
      console.error('Error checking username/email:', error);
      res.status(500).json({ message: 'Error checking username/email availability' });
    }
  });

  // Register new user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      // Check if user already exists
      const isAvailable = await checkUsernameEmail(username, email);
      if (!isAvailable) {
        return res.status(409).json({ message: 'Username or email is already taken' });
      }

      // Register user in our game database
      // The Supabase user is created on the client side
      const newUser = await storage.createUser({
        username,
        email,
        password, // This would usually be hashed, but we're relying on Supabase for auth
        level: 1,
        xp: 0,
        cash: 1000,
        respect: 0,
        isAdmin: false,
        isJailed: false,
      });

      // Create user stats
      await storage.createUserStats(newUser.id);

      res.status(201).json(newUser);
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
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }

  next();
}

/**
 * Middleware to redirect jailed users
 */
export function jailProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.isJailed) {
    return res.status(403).json({ 
      message: 'You are in jail', 
      jailed: true,
      jailTimeEnd: req.user.jailTimeEnd 
    });
  }

  next();
}

/**
 * Check if a username or email is available
 */
export async function checkUsernameEmail(username: string, email: string): Promise<boolean> {
  try {
    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return false;
    }

    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking username/email:', error);
    return false;
  }
}