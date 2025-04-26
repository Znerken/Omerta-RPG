import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Supabase credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Create a Supabase client with the service role key for admin access
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Verify a JWT token from Supabase
 * @param token JWT token from Authorization header
 * @returns User data if token is valid, null otherwise
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    // Extract the token from Authorization header if needed
    const jwt = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Call Supabase API to get user by JWT token
    const { data, error } = await supabaseAdmin.auth.getUser(jwt);
    
    if (error) {
      console.error('Error verifying token:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get all users from Supabase Auth
 * @returns Array of users
 */
export async function listUsers(): Promise<any[]> {
  try {
    // Get all users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return [];
    }
    
    return data.users;
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}

/**
 * Create a user in Supabase Auth
 * @param email User email
 * @param password User password
 * @param metadata User metadata
 * @returns Created user data
 */
export async function createUser(email: string, password: string, metadata: any): Promise<any> {
  try {
    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update a user in Supabase Auth
 * @param id User ID
 * @param userData User data to update
 * @returns Updated user data
 */
export async function updateUser(id: string, userData: any): Promise<any> {
  try {
    // Update user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, userData);
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user from Supabase Auth
 * @param id User ID
 * @returns True if successful, throws error otherwise
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    // Delete user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Get a user by ID from Supabase Auth
 * @param id User ID
 * @returns User data if found, null otherwise
 */
export async function getUserById(id: string): Promise<any> {
  try {
    // Get user from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}