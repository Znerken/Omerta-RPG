import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getUser, 
  getAuthToken 
} from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Context type definition
interface SupabaseAuthContextProps {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: { email: string; password: string }) => Promise<User>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<User>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// Create auth context
const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

// Provider component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Init Auth - Check for existing session and set up auth state listener
  useEffect(() => {
    // Get initial session
    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        
        if (session?.user) {
          setUser(session.user);
          
          // When authenticated, update API headers to include token
          const token = session.access_token;
          if (token) {
            // Fetch user data from our own API
            try {
              const response = await apiRequest('GET', '/api/user', null, {
                Authorization: `Bearer ${token}`
              });
              
              if (response.ok) {
                // Invalidate any cached user data to force refetch
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
              }
            } catch (error) {
              console.error('Failed to fetch user data after authentication:', error);
            }
          }
        } else {
          setUser(null);
          // Clear all query cache on logout
          queryClient.clear();
        }
        
        setIsLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check for current user
  const checkUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error checking user:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in handler
  const signIn = async (credentials: { email: string; password: string }): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await signInWithEmail(credentials.email, credentials.password);
      return user;
    } catch (err) {
      console.error('Error signing in:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up handler
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await signUpWithEmail(email, password, metadata);
      
      // Register user in our own database
      if (user) {
        try {
          const token = await getAuthToken();
          if (token) {
            await apiRequest('POST', '/api/register', {
              ...metadata,
              email,
              password,
              confirmPassword: password,
              supabaseId: user.id
            }, {
              Authorization: `Bearer ${token}`
            });
          }
        } catch (error) {
          console.error('Failed to register user with API:', error);
          // We need to throw this error to the caller
          throw error instanceof Error ? error : new Error(String(error));
        }
      }
      
      return user;
    } catch (err) {
      console.error('Error signing up:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      // Clear all queries from cache
      queryClient.clear();
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Get auth token for API requests
  const getToken = async (): Promise<string | null> => {
    return await getAuthToken();
  };

  // Context value
  const value: SupabaseAuthContextProps = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    logout,
    getToken
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Hook for using auth context
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}