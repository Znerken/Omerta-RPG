import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.'
  );
}

/**
 * Supabase client with admin privileges for server-side operations
 * This client uses the service role key which has bypass RLS permissions
 * IMPORTANT: This should only be used server-side and never exposed to the client
 */
export const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper function to validate a Supabase JWT token
 * @param token JWT token from client
 * @returns User object if token is valid, null otherwise
 */
export async function validateSupabaseToken(token: string) {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.error('Invalid Supabase token:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error validating Supabase token:', error);
    return null;
  }
}

/**
 * Create a Supabase client with a user's JWT token
 * This client will have the same permissions as the user
 * @param token User's JWT token
 * @returns Supabase client with user's permissions
 */
export function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}