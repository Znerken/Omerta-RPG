import { Request, Response, NextFunction, Express } from 'express';
import { supabaseClient, supabaseAdmin } from './supabase';
import { User as SelectUser } from "@shared/schema";
import { storage } from './storage';

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      supabaseUser?: any;
    }
  }
}

// Middleware to check if user is authenticated via Supabase
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  next();
}

// Extract auth token from various places in the request
function getAccessToken(req: Request): string | null {
  // Check authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // Check cookies
  if (req.cookies && req.cookies.sb_access_token) {
    return req.cookies.sb_access_token;
  }
  
  // Check query params (less secure, but useful for WebSocket connections)
  if (req.query && req.query.access_token) {
    return req.query.access_token as string;
  }
  
  return null;
}

// Supabase auth middleware
export function setupSupabaseAuth(app: Express) {
  // Auth middleware to process Supabase authentication
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = getAccessToken(req);
    
    if (!accessToken) {
      return next();
    }
    
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
      
      if (error || !user) {
        return next();
      }
      
      // Find or create user in our database
      const dbUser = await storage.getUserByEmail(user.email as string);
      
      if (dbUser) {
        // Existing user - attach to request
        req.user = dbUser;
      } else {
        // New user - create in our database
        const newUser = await storage.createUser({
          email: user.email as string,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          password: '', // No password needed with Supabase auth
          isAdmin: false,
          level: 1,
          cash: 1000, // Starting cash
          respect: 0,
          xp: 0,
          // Include other required fields
        });
        
        req.user = newUser;
      }
      
      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      next();
    }
  });
  
  // API Routes for Supabase Auth
  
  // Register endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }
    
    try {
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Register with Supabase
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
      });
      
      if (error) {
        throw error;
      }
      
      // Create user in our database
      const newUser = await storage.createUser({
        email,
        username,
        password: '', // No password needed with Supabase auth
        isAdmin: false,
        level: 1,
        cash: 1000, // Starting cash
        respect: 0,
        xp: 0,
        // Include other required fields
      });
      
      // Create a session for the user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
        user_id: data.user.id
      });
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Set cookies
      res.cookie('sb_access_token', sessionData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
      });
      
      res.cookie('sb_refresh_token', sessionData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 * 1000 // 30 days
      });
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Registration failed' });
    }
  });
  
  // Login endpoint
  app.post('/api/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // Get user from our database
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // This shouldn't happen, but just in case
        return res.status(404).json({ error: 'User not found in database' });
      }
      
      // Set cookies
      res.cookie('sb_access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
      });
      
      res.cookie('sb_refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 * 1000 // 30 days
      });
      
      res.status(200).json(user);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  });
  
  // Logout endpoint
  app.post('/api/logout', async (req: Request, res: Response) => {
    const accessToken = getAccessToken(req);
    
    if (accessToken) {
      try {
        // Sign out from Supabase
        await supabaseClient.auth.signOut();
        
        // Clear cookies
        res.clearCookie('sb_access_token');
        res.clearCookie('sb_refresh_token');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    res.sendStatus(200);
  });
  
  // Get current user endpoint
  app.get('/api/user', async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json(req.user);
  });
}