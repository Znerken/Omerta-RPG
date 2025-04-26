import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client instance
 * Configured with the public Supabase URL and anonymous key
 * This client can be used for public operations like sign-up, sign-in, etc.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

/**
 * Type for user profile
 */
export type UserProfile = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  level: number;
  experience: number;
  cash: number;
  respect: number;
  isAdmin: boolean;
  profileTheme: string;
};

/**
 * Get the current session from Supabase Auth
 * @returns The current session or null if not authenticated
 */
export async function getSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
}

/**
 * Get the current user from Supabase Auth
 * @returns The current user or null if not authenticated
 */
export async function getSupabaseUser() {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return data.user;
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param username User's in-game username
 */
export async function signUpWithEmail(email: string, password: string, username: string) {
  // First register with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

/**
 * Reset password for a user
 * @param email User email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

/**
 * Update user password
 * @param password New password
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

/**
 * Get authentication token
 * @returns The current session token or null if not authenticated
 */
export async function getAuthToken() {
  const session = await getSupabaseSession();
  return session?.access_token || null;
}

/**
 * Check if the user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSupabaseSession();
  return !!session;
}