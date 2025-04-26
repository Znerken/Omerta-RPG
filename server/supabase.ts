import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables if needed
dotenv.config();

// Check for required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Create Supabase client with anonymous key (for client-side operations)
export const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create Supabase admin client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get authenticated user from request
export async function getAuthenticatedUser(accessToken: string) {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (error) {
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}