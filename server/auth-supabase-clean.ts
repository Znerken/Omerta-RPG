import { Express, Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin, db } from './db-supabase';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { extractAndValidateToken } from './supabase';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      supabaseUser?: any;
    }
  }
}

/**
 * Sets up authentication routes for Supabase
 */
export function setupAuthRoutes(app: Express) {
  // Authentication middleware for all API routes
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip auth for non-API routes and auth-related routes
      if (!req.path.startsWith('/api') || 
          req.path === '/api/register' || 
          req.path === '/api/check-username-email') {
        return next();
      }

      const supabaseUser = await extractAndValidateToken(req);
      if (!supabaseUser) {
        return res.status(401).json({ message: 'Unauthorized - invalid or missing token' });
      }

      // Store Supabase user in request for later use
      req.supabaseUser = supabaseUser;

      // Find the corresponding game user
      const gameUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, supabaseUser.id)
      });

      if (!gameUser) {
        return res.status(401).json({ 
          message: 'Unauthorized - no game account linked to this Supabase account',
          supabaseAccount: true
        });
      }

      // Store game user in request
      req.user = gameUser;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Server error during authentication' });
    }
  });

  // Get current user data
  app.use('/api/user', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Remove sensitive fields
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Check if username or email exists
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
        return res.status(409).json({ message: 'Username or email is already taken' });
      }
    } catch (error) {
      console.error('Error checking username/email:', error);
      res.status(500).json({ message: 'Failed to check username/email availability' });
    }
  });

  // Register a new user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ message: 'Email, password, and username are required' });
      }
      
      // Check if username or email already exists
      const isAvailable = await checkUsernameEmail(username, email);
      if (!isAvailable) {
        return res.status(409).json({ message: 'Username or email is already taken' });
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
      });
      
      if (authError) {
        console.error('Error creating Supabase auth user:', authError);
        return res.status(500).json({ message: `Failed to create auth user: ${authError.message}` });
      }
      
      const supabaseUser = authData.user;
      
      if (!supabaseUser) {
        return res.status(500).json({ message: 'Failed to create auth user: No user returned' });
      }
      
      // Create user in game database
      const [gameUser] = await db.insert(users)
        .values({
          username,
          email,
          password: 'SUPABASE_AUTH', // Placeholder as auth is handled by Supabase
          supabaseId: supabaseUser.id,
          level: 1,
          xp: 0,
          cash: 1000,
          respect: 0,
          isAdmin: false,
          isJailed: false,
          createdAt: new Date()
        })
        .returning();
      
      if (!gameUser) {
        // Roll back Supabase auth user creation
        await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
        return res.status(500).json({ message: 'Failed to create game user' });
      }
      
      // Create initial stats for the user
      await db.execute(`
        INSERT INTO user_stats (user_id, strength, stealth, charisma, intelligence)
        VALUES (${gameUser.id}, 10, 10, 10, 10)
      `);
      
      // Sign in the user
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (sessionError) {
        console.error('Error signing in new user:', sessionError);
        return res.status(500).json({ message: `Failed to sign in: ${sessionError.message}` });
      }
      
      // Return user and session data
      const { password: pw, ...userWithoutPassword } = gameUser;
      res.status(201).json({
        user: userWithoutPassword,
        session: sessionData.session
      });
    } catch (error) {
      console.error('Error registering user:', error);
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

/**
 * Middleware to redirect jailed users
 */
export function jailProtected(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.isJailed) {
    // Check if jail time has expired
    const jailEndTime = req.user.jailTimeEnd ? new Date(req.user.jailTimeEnd) : null;
    const now = new Date();
    
    if (jailEndTime && jailEndTime > now) {
      return res.status(403).json({
        message: 'You are in jail',
        jailTimeEnd: jailEndTime,
        jailReason: req.user.jailReason,
        timeRemaining: Math.ceil((jailEndTime.getTime() - now.getTime()) / 1000)
      });
    } else {
      // Jail time has expired, release the user
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
    }
  } else {
    next();
  }
}

/**
 * Check if a username or email is available
 */
export async function checkUsernameEmail(username: string, email: string): Promise<boolean> {
  try {
    // Check game database
    const existingUser = await db.query.users.findFirst({
      where: (user) => eq(user.username, username) || eq(user.email, email)
    });
    
    if (existingUser) {
      return false;
    }
    
    // Check Supabase Auth
    const { data: supabaseUsers, error } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email
      }
    });
    
    if (error) {
      console.error('Error checking Supabase users:', error);
      throw error;
    }
    
    return supabaseUsers.users.length === 0;
  } catch (error) {
    console.error('Error checking username/email:', error);
    throw error;
  }
}