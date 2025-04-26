import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with public keys
 * These keys should be exposed in the browser, but access is controlled through
 * Row-Level Security (RLS) policies
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.'
  );
}

/**
 * Supabase client for browser-side usage
 * Use this client for authentication and data access that should be available to the user
 */
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Helper function to handle Supabase errors consistently
 * @param error Error from Supabase operation
 * @param defaultMessage Default message to show if error doesn't have a message
 * @returns Formatted error message
 */
export function handleSupabaseError(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'error_description' in error && typeof error.error_description === 'string') {
    return error.error_description;
  }
  
  return defaultMessage;
}

/**
 * Create WebSocket connection to server for real-time communication
 * @returns WebSocket instance
 */
export function createWebSocketConnection(): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  return new WebSocket(wsUrl);
}

/**
 * Connect to WebSocket and authenticate with Supabase token
 * @param socket WebSocket instance
 * @returns Promise that resolves when authentication is complete
 */
export async function authenticateWebSocket(socket: WebSocket): Promise<boolean> {
  return new Promise((resolve) => {
    // Wait for connection to open
    if (socket.readyState === WebSocket.OPEN) {
      sendAuthMessage();
    } else {
      socket.addEventListener('open', sendAuthMessage);
    }

    // Listen for authentication response
    socket.addEventListener('message', handleAuthResponse);

    // Send authentication message with token
    async function sendAuthMessage() {
      const { data: { session }} = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found for WebSocket authentication');
        resolve(false);
        return;
      }

      socket.send(JSON.stringify({
        type: 'auth',
        token: session.access_token
      }));
    }

    // Handle authentication response
    function handleAuthResponse(event: MessageEvent) {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'auth_response') {
          socket.removeEventListener('message', handleAuthResponse);
          
          if (data.success) {
            console.log('WebSocket authenticated successfully');
            resolve(true);
          } else {
            console.error('WebSocket authentication failed:', data.error);
            resolve(false);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });
}