import { createClient } from '@supabase/supabase-js';
import { decode, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase secrets from environment
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables');
  console.error('Make sure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY are set in .env file');
  process.exit(1);
}

// Create Supabase admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Validates a Supabase JWT token
 * @param token JWT token from client
 * @returns User data if token is valid, null if invalid
 */
export async function validateSupabaseToken(token: string) {
  if (!token) return null;

  try {
    // Extract JWT parts
    const jwt = decodeJWT(token);
    if (!jwt) return null;

    // In a production environment, we'd verify the signature here
    // For now, we'll validate with Supabase API
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      console.warn('Invalid token:', error?.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Decode a JWT token
 * @param token JWT token
 * @returns Decoded JWT payload or null
 */
function decodeJWT(token: string): JwtPayload | null {
  try {
    // Note: This doesn't verify the signature, just decodes the payload
    const decoded = decode(token);
    return decoded as JwtPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param exp Expiration timestamp
 * @returns True if token is expired, false otherwise
 */
function isTokenExpired(exp: number | undefined): boolean {
  if (!exp) return true;
  
  // Add a small buffer to account for clock skew
  const bufferSeconds = 30;
  const currentTime = Math.floor(Date.now() / 1000);
  
  return currentTime >= exp - bufferSeconds;
}

/**
 * Get Supabase user by ID using admin client
 * @param userId Supabase user ID
 * @returns User data if found, null otherwise
 */
export async function getSupabaseUserById(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !data.user) {
      console.warn('User not found:', error?.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}