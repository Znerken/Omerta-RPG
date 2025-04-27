import { Request, Response, NextFunction } from "express";
import { extractAndValidateToken } from "../supabase";
import { storage } from "../storage-supabase";

// Middleware to check if user is authenticated
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('auth middleware checking authentication');
  
  try {
    console.log('AUTH MIDDLEWARE STARTED - PATH:', req.path);
    console.log('AUTH HEADERS:', JSON.stringify(req.headers, null, 2));
    
    // Check if we already have a user (set by main auth middleware)
    if (req.user) {
      console.log('User already authenticated via main middleware');
      return next();
    }
    
    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No auth header present');
      return res.status(401).json({ message: "Unauthorized - No auth header" });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.log('No token in auth header');
      return res.status(401).json({ message: "Unauthorized - No token" });
    }
    
    console.log('Got token from header (first 15 chars):', token.substring(0, 15) + '...');
    
    // Validate JWT token with Supabase
    console.log('Validating token');
    const supabaseUser = await extractAndValidateToken(req);
    if (!supabaseUser) {
      console.log('Invalid token');
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    console.log('Token validated, fetching user with Supabase ID:', supabaseUser.id);
    console.log('Token email is:', supabaseUser.email);
    
    // Get user from database using Supabase ID
    console.log('Looking up user with Supabase ID:', supabaseUser.id);
    let user = await storage.getUserBySupabaseId(supabaseUser.id);
    
    if (!user) {
      console.log('No user found with Supabase ID. Trying to find by email...');
      // As a fallback, try to find the user by email
      if (supabaseUser.email) {
        console.log('Trying to find user by email:', supabaseUser.email);
        user = await storage.getUserByEmail(supabaseUser.email);
        
        if (user) {
          console.log('Found user by email, updating their Supabase ID...');
          // Update the user's Supabase ID for future logins
          user = await storage.updateUser(user.id, { supabaseId: supabaseUser.id });
          console.log('User updated with Supabase ID:', supabaseUser.id);
        } else {
          console.log('No user found with email:', supabaseUser.email);
        }
      }
    }
    
    if (!user) {
      console.log('No user found with Supabase ID or email:', supabaseUser.id);
      return res.status(401).json({ 
        message: "Unauthorized - User not found",
        needsLinking: true,
        supabaseId: supabaseUser.id,
        email: supabaseUser.email
      });
    }
    
    // Attach user to request
    console.log('User authenticated:', user.username);
    req.user = user;
    req.supabaseUser = supabaseUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: "Internal server error during authentication" });
  }
}

// Middleware to check if user is an admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Ensure the user is authenticated first
    await isAuthenticated(req, res, () => {
      // Now check if they're an admin
      if (req.user && req.user.isAdmin) {
        return next();
      }
      res.status(403).json({ message: "Forbidden - Admin access required" });
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: "Internal server error during authentication" });
  }
}