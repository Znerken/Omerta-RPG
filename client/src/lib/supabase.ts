import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storageKey: 'omerta-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Get current user session
 * @returns User session if logged in, null otherwise
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
}

/**
 * Get current user
 * @returns User if logged in, null otherwise
 */
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns User data if successful, throws error otherwise
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data.user;
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param metadata Additional user metadata
 * @returns User data if successful, throws error otherwise
 */
export async function signUpWithEmail(email: string, password: string, metadata?: { [key: string]: any }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) {
    throw error;
  }
  
  return data.user;
}

/**
 * Sign out current user
 * @returns true if successful, false otherwise
 */
export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  return true;
}

/**
 * Reset password
 * @param email User email
 * @returns true if email sent, false otherwise
 */
export async function resetPassword(email: string): Promise<boolean> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  if (error) {
    console.error('Error resetting password:', error);
    return false;
  }
  
  return true;
}

/**
 * Update user password
 * @param newPassword New password
 * @returns true if successful, false otherwise
 */
export async function updatePassword(newPassword: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    console.error('Error updating password:', error);
    return false;
  }
  
  return true;
}

/**
 * Update user profile
 * @param data Profile data to update
 * @returns Updated user if successful, null otherwise
 */
export async function updateProfile(data: { [key: string]: any }) {
  const { data: userData, error } = await supabase.auth.updateUser({
    data,
  });
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return userData.user;
}

/**
 * Get auth token for use with API requests
 * @returns JWT token if logged in, null otherwise
 */
export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

// Interfaces for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          username: string;
          email: string;
          created_at: string;
          updated_at: string;
          supabase_id: string;
          is_admin: boolean;
          banned: boolean;
          ban_reason: string | null;
          jailed: boolean;
          jail_reason: string | null;
          jail_until: string | null;
        };
        Insert: {
          username: string;
          email: string;
          supabase_id: string;
          is_admin?: boolean;
          banned?: boolean;
          ban_reason?: string | null;
          jailed?: boolean;
          jail_reason?: string | null;
          jail_until?: string | null;
        };
        Update: {
          username?: string;
          email?: string;
          supabase_id?: string;
          is_admin?: boolean;
          banned?: boolean;
          ban_reason?: string | null;
          jailed?: boolean;
          jail_reason?: string | null;
          jail_until?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: number;
          user_id: number;
          avatar: string | null;
          banner: string | null;
          bio: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: number;
          avatar?: string | null;
          banner?: string | null;
          bio?: string | null;
          location?: string | null;
        };
        Update: {
          user_id?: number;
          avatar?: string | null;
          banner?: string | null;
          bio?: string | null;
          location?: string | null;
        };
      };
    };
  };
}