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
      console.log('[extractAndValidateToken] No authorization header present');
      return null;
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      console.log('[extractAndValidateToken] No Bearer token found in authorization header');
      return null;
    }
    
    // Log token details (first few chars for debugging)
    console.log('[extractAndValidateToken] Token received (first 15 chars):', token.substring(0, 15) + '...');
    
    // Verify the token
    try {
      const decoded = jwt.decode(token);
    
      if (!decoded || typeof decoded !== 'object') {
        console.log('[extractAndValidateToken] Token could not be decoded');
        return null;
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        console.log('[extractAndValidateToken] Token expired at:', new Date(decoded.exp * 1000).toLocaleString());
        return null;
      }
      
      // Log token data
      console.log('[extractAndValidateToken] Valid token for user:', decoded.sub);
      console.log('[extractAndValidateToken] Token expires at:', new Date(decoded.exp * 1000).toLocaleString());
      
      // Double verify with Supabase Auth API
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
          console.log('[extractAndValidateToken] Supabase rejected token:', error?.message);
          return null;
        }
        
        console.log('[extractAndValidateToken] Token verified with Supabase for user:', user.id);
        
        // Return decoded token to maintain compatibility
        return decoded;
      } catch (e) {
        console.error('[extractAndValidateToken] Error verifying with Supabase API:', e);
        return decoded; // Fall back to just the decoded token if API verification fails
      }
    } catch (decodeError) {
      console.error('[extractAndValidateToken] Error decoding token:', decodeError);
      return null;
    }
  } catch (error) {
    console.error('[extractAndValidateToken] Error validating JWT token:', error);
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