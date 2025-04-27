import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Supabase credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

// Create a regular Supabase client with anonymous key
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validate Supabase service role key for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Some admin operations may not work.');
}

// Create an admin Supabase client with service role key
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Verify a Supabase JWT token and return the user if valid
 * @param token JWT token from the client
 * @returns User object if token is valid, null otherwise
 */
export async function verifySupabaseToken(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Error verifying token:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception verifying token:', error);
    return null;
  }
}

/**
 * Check connection to Supabase
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is expected if the table doesn't exist
      console.error('Supabase connection error:', error);
      return false;
    }
    
    // Test auth service
    const { data, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError) {
      console.error('Supabase auth service error:', authError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

/**
 * Fetch user from Supabase Auth by email
 * @param email User's email
 * @returns Supabase Auth user if found, null otherwise
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return null;
    }
    
    return data.users.find(user => user.email === email) || null;
  } catch (error) {
    console.error('Exception fetching user by email:', error);
    return null;
  }
}

/**
 * Create a new user in Supabase Auth
 * @param email User's email
 * @param password User's password
 * @param metadata Additional metadata
 * @returns Created user if successful, null otherwise
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
      console.error('Error creating user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception creating user:', error);
    return null;
  }
}

/**
 * Delete a user from Supabase Auth
 * @param userId User's Supabase Auth ID
 * @returns True if successful, false otherwise
 */
export async function deleteSupabaseUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting user:', error);
    return false;
  }
}

/**
 * Update a user in Supabase Auth
 * @param userId User's Supabase Auth ID
 * @param userData User data to update
 * @returns Updated user if successful, null otherwise
 */
export async function updateSupabaseUser(userId: string, userData: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      userData
    );
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Exception updating user:', error);
    return null;
  }
}