import { createClient } from '@supabase/supabase-js';

// Define user profile interface
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  level: number;
  experience: number;
  cash: number;
  respect: number;
  avatar?: string | null;
  profileTheme: string;
  avatarFrame?: string | null;
  nameEffect?: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string | null;
  createdAt: string | null;
  gangId?: number | null;
  isAdmin?: boolean;
  isBanned?: boolean;
  supabaseId: string;
}

// Check if Supabase credentials are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns User information
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @param username Username
 * @returns User information
 */
export async function signUpWithEmail(email: string, password: string, username: string) {
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
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Get the current session
 * @returns Current session or null if not authenticated
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Reset password
 * @param email User email
 * @returns Success status
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Update password
 * @param password New password
 * @returns Success status
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Update user metadata
 * @param metadata User metadata to update
 * @returns Updated user
 */
export async function updateUserMetadata(metadata: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Create WebSocket connection URL with authentication token
 * @returns WebSocket URL with auth token
 */
export function getWebSocketUrl() {
  const session = supabase.auth.session();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = session.access_token;
  
  return `${protocol}//${window.location.host}/ws?token=${token}`;
}

/**
 * Connect to WebSocket server
 * @returns WebSocket connection
 */
export function connectWebSocket() {
  try {
    const wsUrl = getWebSocketUrl();
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Keep connection alive
    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);
    
    return socket;
  } catch (error) {
    console.error('Error connecting to WebSocket:', error);
    throw error;
  }
}