import { createClient, User } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate Supabase config
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables are not set. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.'
  );
}

/**
 * Supabase client instance
 * Use this for most Supabase operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Get the current authenticated user
 * @returns User object or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get the current authentication token
 * @returns JWT token or null
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns User object or throws an error
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('No user returned from sign-in');
  }

  return data.user;
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param metadata Optional user metadata
 * @returns User object or throws an error
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { [key: string]: any }
): Promise<User> {
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

  if (!data.user) {
    throw new Error('No user returned from sign-up');
  }

  return data.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Reset password for a user
 * @param email User email
 * @returns 
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update user password
 * @param password New password
 */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
}

/**
 * Get user by ID (admin only)
 * This should only be used on the server side
 * @param userId Supabase user ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
  
  return user;
}

/**
 * Listen for auth state changes
 * @param callback Function to call when auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

/**
 * Set up realtime subscription
 * @param channel Channel name
 * @param eventHandler Function to handle events
 */
export function subscribeToChannel(
  channel: string,
  eventHandler: (payload: any) => void
): () => void {
  const subscription = supabase
    .channel(channel)
    .on('broadcast', { event: 'message' }, eventHandler)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Upload file to Supabase storage
 * @param bucket Bucket name
 * @param path File path
 * @param file File object
 */
export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}