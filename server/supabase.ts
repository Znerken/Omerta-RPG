import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Supabase credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

// Initialize Supabase Admin client with service role key
// This client has admin privileges and should only be used on the server
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
 * @param token JWT token to verify
 * @returns The user if token is valid, null otherwise
 */
export async function verifyToken(token: string) {
  try {
    // Extract the actual token if it's in the Authorization header format
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Get user data from token
    const { data, error } = await supabaseAdmin.auth.getUser(actualToken);
    
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
 * Get a user by ID from Supabase Auth
 * @param id User ID
 * @returns The user data if found, null otherwise
 */
export async function getUserById(id: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Update a user's metadata in Supabase Auth
 * @param id User ID
 * @param metadata Metadata to update
 * @returns Whether the update was successful
 */
export async function updateUserMetadata(id: string, metadata: Record<string, any>) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: metadata,
    });
    
    if (error) {
      console.error('Update user metadata error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Update user metadata error:', error);
    return false;
  }
}

/**
 * Create a user in Supabase Auth
 * @param email User email
 * @param password User password
 * @param metadata User metadata
 * @returns The created user data if successful, null otherwise
 */
export async function createUser(email: string, password: string, metadata: Record<string, any> = {}) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
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
 * @param id User ID
 * @returns Whether the deletion was successful
 */
export async function deleteUser(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
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
 * List all users in Supabase Auth
 * @returns Array of users if successful, empty array otherwise
 */
export async function listUsers() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('List users error:', error);
      return [];
    }
    
    return data.users;
  } catch (error) {
    console.error('List users error:', error);
    return [];
  }
}