import { createClient } from '@supabase/supabase-js';

// Check environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Create a Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * Get the current session
 * @returns Current session or null if not logged in
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
}

/**
 * Get current user
 * @returns Current user or null if not logged in
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Exception getting user:', error);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param metadata Additional user metadata
 * @returns Session data if successful, error message if failed
 */
export async function signUp(email: string, password: string, metadata: any = {}) {
  try {
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