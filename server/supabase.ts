import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase admin client for server-side operations
 * Uses the service role key which has full access to all tables
 * Only use this on the server, never expose this client to the client-side
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Verify a JWT token from Supabase Auth
 * @param token JWT token from Authorization header
 * @returns User data if token is valid, null otherwise
 */
export async function verifyToken(token: string) {
  try {
    // Remove Bearer prefix if present
    const jwt = token.replace(/^Bearer\s/, '');
    
    const { data, error } = await supabaseAdmin.auth.getUser(jwt);
    
    if (error) {
      console.error('Token verification error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Get user by ID from Supabase Auth
 * @param userId Supabase user ID
 * @returns User data if found, null otherwise
 */
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
}

/**
 * Create a new user in Supabase Auth
 * @param email User email
 * @param password User password
 * @param userData Additional user data
 * @returns User data if created, null otherwise
 */
export async function createUser(email: string, password: string, userData: any = {}) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userData,
    });
    
    if (error) {
      console.error('Create user error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

/**
 * Delete a user from Supabase Auth
 * @param userId Supabase user ID
 * @returns True if deleted, false otherwise
 */
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Delete user error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete user error:', error);
    return false;
  }
}

/**
 * Update a user in Supabase Auth
 * @param userId Supabase user ID
 * @param userData User data to update
 * @returns Updated user data if successful, null otherwise
 */
export async function updateUser(userId: string, userData: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, userData);
    
    if (error) {
      console.error('Update user error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Update user error:', error);
    return null;
  }
}