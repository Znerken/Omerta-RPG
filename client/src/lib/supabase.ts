import { useSupabase } from '@/providers/supabase-provider';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get access to the global Supabase client
declare global {
  interface Window {
    __SUPABASE_CLIENT?: SupabaseClient;
  }
}

/**
 * Gets the Supabase client from the context
 * @returns Supabase client or throws an error if not available
 */
export function getSupabaseClient() {
  try {
    // First try to get from provider
    const { supabase, isLoading, error } = useSupabase();
    
    if (isLoading) {
      console.warn('[getSupabaseClient] Supabase client is still loading');
      throw new Error('Supabase client is still loading');
    }
    
    if (error) {
      console.error('[getSupabaseClient] Supabase client error:', error);
      throw new Error(`Supabase client error: ${error}`);
    }
    
    if (!supabase) {
      console.error('[getSupabaseClient] Supabase client is not available');
      throw new Error('Supabase client is not available');
    }
    
    console.log('[getSupabaseClient] Supabase client obtained successfully');
    return supabase;
  } catch (err) {
    // Fallback to window global as a last resort
    if (window.__SUPABASE_CLIENT) {
      console.log('[getSupabaseClient] Using global Supabase client fallback');
      return window.__SUPABASE_CLIENT;
    }
    console.error('[getSupabaseClient] Failed to get Supabase client:', err);
    throw err;
  }
}

// For compatibility with existing code using the direct export
// This returns a proxy that will forward all calls to the global client when it's available
export const supabase = new Proxy({} as SupabaseClient, {
  get: function(target, prop) {
    try {
      if (window.__SUPABASE_CLIENT) {
        return window.__SUPABASE_CLIENT[prop as keyof SupabaseClient];
      }
      throw new Error('Supabase client not initialized yet');
    } catch (e) {
      console.error('Error accessing Supabase client:', e);
      return undefined;
    }
  }
});

/**
 * Get the current session
 * @returns Current session or null if not logged in
 */
export async function getSession() {
  try {
    console.log('[getSession] Attempting to get session');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[getSession] Error getting session:', error.message);
      return null;
    }
    
    if (!data.session) {
      console.log('[getSession] No active session found');
      return null;
    }
    
    console.log('[getSession] Session found, expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
    return data.session;
  } catch (error) {
    console.error('[getSession] Exception getting session:', error);
    return null;
  }
}

/**
 * Get current user
 * @returns Current user or null if not logged in
 */
export async function getCurrentUser() {
  try {
    console.log('[getCurrentUser] Attempting to get user');
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[getCurrentUser] Error getting user:', error.message);
      return null;
    }
    
    if (!user) {
      console.log('[getCurrentUser] No authenticated user found');
      return null;
    }
    
    console.log('[getCurrentUser] User found:', user.id, 'Email:', user.email);
    return user;
  } catch (error) {
    console.error('[getCurrentUser] Exception getting user:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns Session data if successful, error message if failed
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    console.log('Attempting to sign in with email:', email);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase sign in error:', error);
      return { error: error.message };
    }
    
    console.log('Sign in successful', data ? 'with data' : 'but no data returned');
    return { data };
  } catch (error: any) {
    console.error('Exception during sign in:', error);
    return { error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param metadata Additional user metadata
 * @returns Session data if successful, error message if failed
 */
export async function signUp(email: string, password: string, metadata: any = {}) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { data };
  } catch (error: any) {
    return { error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Sign out
 * @returns True if successful, false if failed
 */
export async function signOut() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception signing out:', error);
    return false;
  }
}

/**
 * Reset password
 * @param email User email
 * @returns True if successful, error message if failed
 */
export async function resetPassword(email: string) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Update password
 * @param newPassword New password
 * @returns True if successful, error message if failed
 */
export async function updatePassword(newPassword: string) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Get auth token for API requests
 * @returns Auth token or null if not logged in
 */
export async function getAuthToken() {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Add auth token to fetch options
 * @param options Fetch options
 * @returns Fetch options with auth token
 */
export async function withAuth(options: RequestInit = {}): Promise<RequestInit> {
  const token = await getAuthToken();
  
  if (!token) {
    return options;
  }
  
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  
  return {
    ...options,
    headers,
  };
}

/**
 * Fetch with auth token
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authOptions = await withAuth(options);
  return fetch(url, authOptions);
}