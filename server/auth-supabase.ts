import { Express, Request, Response, NextFunction } from 'express';
import { validateSupabaseToken } from './supabase';
import { db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
  // Authentication middleware
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip auth for specific routes
      if (req.path === '/api/register' && req.method === 'POST') {
        return next();
      }

      // Check for auth header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow unauthenticated requests to continue but without user data
        return next();
      }

      // Extract token
      const token = authHeader.split(' ')[1];

      // Validate token with Supabase
      const supabaseUser = await validateSupabaseToken(token);
      if (!supabaseUser) {
        // Token is invalid, but don't block the request
        return next();
      }

      // Store Supabase user in request
      req.supabaseUser = supabaseUser;

      // Get user from database using supabase ID
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.supabaseId, supabaseUser.id));

      if (user) {
        // Store user in request
        req.user = user;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next();
    }
  });

  // Add auth-protected middleware
  app.use('/api/user', authProtected, (req: Request, res: Response) => {
    // User is already attached to req by the authProtected middleware
    res.json(req.user);
  });

  // Register API
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, supabaseId } = req.body;

      // Validate input
      if (!username || !email || !password || !supabaseId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if username already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Insert new user
      const [user] = await db
        .insert(users)
        .values({
          username,
          email,
          password: 'SUPABASE_AUTH', // We don't store passwords anymore
          supabaseId,
          level: 1,
          cash: 1000,
          bank: 0,
          respect: 0,
          experience: 0,
          health: 100,
          max_health: 100,
          energy: 100,
          max_energy: 100,
          is_admin: false,
          banned: false,
          jailed: false,
        })
        .returning();

      // Create initial profile, stats, etc here as needed
      // This could be moved to separate functions

      // Return new user
      res.status(201).json(user);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  });
}

/**
 * Middleware to ensure user is authenticated
 */
export function authProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to ensure user is an admin
 */
export function adminProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}