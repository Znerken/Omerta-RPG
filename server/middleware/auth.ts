import { Request, Response, NextFunction } from "express";
import { extractAndValidateToken } from "../supabase";
import { storage } from "../storage-supabase";

// Middleware to check if user is authenticated
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('auth middleware checking authentication');
  
  try {
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
    
    // Validate JWT token with Supabase
    console.log('Validating token');
    const supabaseUser = await extractAndValidateToken(req);
    if (!supabaseUser) {
      console.log('Invalid token');
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    console.log('Token validated, fetching user with Supabase ID:', supabaseUser.sub);
    
    // Get user from database using Supabase ID
    const user = await storage.getUserBySupabaseId(supabaseUser.sub);
    if (!user) {
      console.log('No user found with Supabase ID:', supabaseUser.sub);
      return res.status(401).json({ message: "Unauthorized - User not found" });
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