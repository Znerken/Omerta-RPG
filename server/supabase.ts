import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
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
 * Create a new Supabase user
 * @param email User email
 * @param password User password
 * @param metadata Additional user metadata
 * @returns User data or null if error
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
 * Get a Supabase user by ID
 * @param id Supabase user ID
 * @returns User data or null if error
 */
export async function getSupabaseUser(id: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      console.error('Error getting Supabase user:', error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Exception getting Supabase user:', error);
    return null;
  }
}

/**
 * Delete a Supabase user
 * @param id Supabase user ID
 * @returns True if successful, false if error
 */
export async function deleteSupabaseUser(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

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

/**
 * Update a Supabase user
 * @param id Supabase user ID
 * @param updates User updates
 * @returns Updated user data or null if error
 */
export async function updateSupabaseUser(id: string, updates: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);

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
 * Validate a JWT token from Authorization header
 * @param authHeader Authorization header
 * @returns User data or null if invalid
 */
export async function validateAuthHeader(authHeader: string) {
  try {
    // Check header format
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return null;
    }

    // Decode token without verification to extract user ID
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
      return null;
    }

    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Error validating token:', error?.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Exception validating token:', error);
    return null;
  }
}

/**
 * Check connection to Supabase
 * @returns True if connected, false if not
 */
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking Supabase connection:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception checking Supabase connection:', error);
    return false;
  }
}