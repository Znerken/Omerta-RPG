import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the current session
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
}

// Helper function to get the current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  return true;
}

// Helper function to get an authorization header with the current session token
export async function getAuthHeader() {
  const session = await getCurrentSession();
  if (!session) {
    return {};
  }
  return {
    Authorization: `Bearer ${session.access_token}`
  };
}

// Helper function to wrap fetch with authorization
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authHeader = await getAuthHeader();
  const headers = {
    ...options.headers,
    ...authHeader
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

// WebSocket connection setup with authentication
export async function createAuthenticatedWebSocket(path: string = '/ws') {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('No active session found. Please authenticate first.');
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = session.access_token;
  const wsUrl = `${protocol}//${window.location.host}${path}?token=${token}`;
  
  return new WebSocket(wsUrl);
}