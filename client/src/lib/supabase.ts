import { createClient } from '@supabase/supabase-js';

// Supabase environment variables should be set in .env file
// Remember to prefix with VITE_ to make them available in the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * User profile interface
 * This represents how user data is stored in our database
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  level: number;
  experience: number;
  cash: number;
  respect: number;
  isAdmin?: boolean;
  supabaseId: string;
  profileImage?: string | null;
  profileTheme?: string;
  profileFrame?: string | null;
  nameEffect?: string | null;
  lastSeen?: Date | null;
  status?: string;
  createdAt?: Date | null;
  isBanned?: boolean;
  banReason?: string | null;
  isJailed?: boolean;
  jailDuration?: number | null;
  jailReason?: string | null;
  jailReleaseTime?: Date | null;
}

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  return { user: data.user };
}

/**
 * Sign up with email and password
 * @param email User's email
 * @param password User's password
 * @param username User's username
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<{ user: any }> {
  // First, check if the username or email already exists in our game database
  try {
    const checkResponse = await fetch('/api/check-username-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email }),
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      throw new Error(errorData.message || 'Username or email already exists');
    }
  } catch (error: any) {
    console.error('Error checking username/email:', error);
    throw error;
  }

  // Register with Supabase Auth
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
    console.error('Error signing up:', error);
    throw error;
  }

  return { user: data.user };
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
 * Reset password
 * @param email User's email
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param id User ID
 * @param profileData Profile data to update
 */
export async function updateUserProfile(id: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
  const response = await fetch(`/api/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return await response.json();
}

/**
 * Check connection to Supabase
 * @returns True if connected, false otherwise
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    
    return !error;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

/**
 * Upload a profile image
 * @param userId User ID
 * @param file File to upload
 * @returns URL of the uploaded image
 */
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `profiles/${fileName}`;

  const { error } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }

  const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath);

  return data.publicUrl;
}