import { Express, Request, Response, NextFunction } from 'express';
import { validateToken, extractAndValidateToken } from './supabase';
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
  // Add a special endpoint that returns a special login page with a forced logout
  app.get('/auth', async (req: Request, res: Response, next: NextFunction) => {
    // If there's a logout parameter, clear any potential lingering session data
    if (req.query.logout) {
      console.log('Login page accessed with logout parameter, clearing any server-side session data');
      req.user = undefined;
      req.supabaseUser = undefined;
    }
    
    // Continue to the normal route handling for the auth page
    next();
  });
  
  // Add a special logout route that clears all server-side session data
  app.post('/api/logout', async (req: Request, res: Response) => {
    console.log('Server-side logout requested');
    
    // Clear any server-side session data
    req.user = undefined;
    req.supabaseUser = undefined;
    
    // Send no-cache headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
  
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
      // Extract token from Authorization header
      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        return next();
      }
      
      // Validate JWT token with Supabase
      const supabaseUser = await extractAndValidateToken(req);
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
  app.use('/api/user', async (req: Request, res: Response) => {
    try {
      console.log('[/api/user] Getting current user data');
      
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log('[/api/user] No authorization header found');
        return res.status(401).json({ 
          message: 'No authorization header',
          needsAuth: true 
        });
      }
      
      // Validate JWT token with Supabase
      const supabaseUser = await extractAndValidateToken(req);
      if (!supabaseUser) {
        console.log('[/api/user] Invalid token or token validation failed');
        return res.status(401).json({ 
          message: 'Invalid token',
          needsAuth: true 
        });
      }
      
      console.log(`[/api/user] Valid Supabase user: ${supabaseUser.id} (${supabaseUser.email})`);
      
      // First, try to get user from database using Supabase ID
      let user = await storage.getUserBySupabaseId(supabaseUser.id);
      
      // If not found by Supabase ID, try to find by email
      if (!user && supabaseUser.email) {
        console.log(`[/api/user] User not found by Supabase ID, trying email: ${supabaseUser.email}`);
        user = await storage.getUserByEmail(supabaseUser.email);
        
        // If found by email but supabaseId is not set, automatically update it
        if (user && (!user.supabaseId || user.supabaseId !== supabaseUser.id)) {
          console.log(`[/api/user] User found by email, updating supabaseId from ${user.supabaseId} to ${supabaseUser.id}`);
          user = await storage.updateUser(user.id, { supabaseId: supabaseUser.id });
          console.log(`[/api/user] User updated with new supabaseId`);
        }
      }
      
      // If user exists in game database, return it
      if (user) {
        console.log(`[/api/user] Found game user: ${user.username} (ID: ${user.id})`);
        return res.json(user);
      }
      
      console.log(`[/api/user] No game user found for Supabase user ${supabaseUser.id}, needs account linking`);
      
      // If user is authenticated with Supabase but doesn't have a game account,
      // return a special response indicating they need to link their account
      return res.status(200).json({
        message: 'Supabase account not linked to game account',
        needsLinking: true,
        supabaseId: supabaseUser.id,
        email: supabaseUser.email
      });
    } catch (error) {
      console.error('Error in /api/user endpoint:', error);
      return res.status(500).json({ message: 'Server error' });
    }
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