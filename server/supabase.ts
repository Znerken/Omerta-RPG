import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for Supabase credentials in environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Create a Supabase client with anonymous key for public operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create a Supabase admin client with service role key for admin operations
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
 * Verify a JWT token from Supabase Auth
 * @param token JWT token
 * @returns User data if token is valid, null otherwise
 */
export async function verifyToken(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Token verification exception:', error);
    return null;
  }
}

/**
 * Validate an authentication token from request headers
 * @param authHeader Authorization header
 * @returns User data if token is valid, null otherwise
 */
export async function validateAuthHeader(authHeader: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

/**
 * Get all users from Supabase Auth
 * @returns List of users or null if error
 */
export async function getAllSupabaseUsers() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching Supabase users:', error.message);
      return null;
    }
    
    return data.users;
  } catch (error) {
    console.error('Exception fetching Supabase users:', error);
    return null;
  }
}

/**
 * Get a user from Supabase Auth by ID
 * @param userId Supabase user ID
 * @returns User data if found, null otherwise
 */
export async function getSupabaseUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Error fetching Supabase user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception fetching Supabase user:', error);
    return null;
  }
}

/**
 * Create a new user in Supabase Auth
 * @param email User email
 * @param password User password
 * @param metadata Additional user metadata
 * @returns User data if created, null otherwise
 */
export async function createSupabaseUser(email: string, password: string, metadata: any = {}) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    
    if (error) {
      console.error('Error creating Supabase user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception creating Supabase user:', error);
    return null;
  }
}

/**
 * Update a user in Supabase Auth
 * @param userId Supabase user ID
 * @param userData User data to update
 * @returns Updated user data if successful, null otherwise
 */
export async function updateSupabaseUser(userId: string, userData: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      userData
    );
    
    if (error) {
      console.error('Error updating Supabase user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception updating Supabase user:', error);
    return null;
  }
}

/**
 * Delete a user from Supabase Auth
 * @param userId Supabase user ID
 * @returns True if successful, false otherwise
 */
export async function deleteSupabaseUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Error deleting Supabase user:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting Supabase user:', error);
    return false;
  }
}