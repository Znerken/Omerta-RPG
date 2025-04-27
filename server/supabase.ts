import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase clients
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Extract and validate the Supabase JWT token from the request
 * @param req Express request
 * @returns The decoded JWT payload or null if invalid
 */
export async function extractAndValidateToken(req: Request): Promise<any> {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return null;
    }
    
    // Verify the token
    const decoded = jwt.decode(token);
    
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return null;
  }
}

/**
 * Get user from Supabase by JWT token
 * @param token JWT token
 * @returns Supabase user or null if invalid
 */
export async function getUserFromToken(token: string): Promise<any> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * Middleware to validate Supabase JWT token
 */
export function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  extractAndValidateToken(req)
    .then(decoded => {
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Set the decoded token as a request property
      (req as any).supabaseUser = decoded;
      next();
    })
    .catch(error => {
      console.error('Error validating token:', error);
      res.status(401).json({ error: 'Invalid token' });
    });
}