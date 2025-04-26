import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { InsertUser, User } from '@shared/schema';

type AuthState = {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type SupabaseAuthContextType = AuthState & {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (email: string, password: string, userData?: Partial<InsertUser>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // If session exists, get user data from our API
        let user = null;
        if (session) {
          try {
            const response = await apiRequest('GET', '/api/user');
            user = await response.json();
          } catch (apiError) {
            console.error('Error fetching user data:', apiError);
          }
        }

        // Set initial state
        setState({
          user,
          supabaseUser: session?.user || null,
          session,
          isLoading: false,
          error: null,
        });

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Supabase auth state changed:', event);
            
            // Handle auth state changes
            let user = null;
            if (session) {
              try {
                const response = await apiRequest('GET', '/api/user');
                user = await response.json();
              } catch (apiError) {
                console.error('Error fetching user data on auth state change:', apiError);
              }
            }

            setState({
              user,
              supabaseUser: session?.user || null,
              session,
              isLoading: false,
              error: null,
            });
          }
        );

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState({
          user: null,
          supabaseUser: null,
          session: null,
          isLoading: false,
          error: error as Error,
        });
      }
    }

    initializeAuth();
  }, []);

  // Sign in with email/password
  const signIn = async (credentials: LoginCredentials) => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      const { error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        throw error;
      }
      
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      setState({ ...state, isLoading: false, error: error as Error });
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, userData?: Partial<InsertUser>) => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      // Register with Supabase Auth
      const { data: { user: supabaseUser }, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error || !supabaseUser) {
        throw error || new Error('Failed to create user');
      }
      
      // Create user in our database
      const response = await apiRequest('POST', '/api/register', {
        ...userData,
        email,
        supabaseId: supabaseUser.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user in application database');
      }
      
      const user = await response.json();
      
      setState({
        ...state,
        user,
        supabaseUser,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });
    } catch (error) {
      setState({ ...state, isLoading: false, error: error as Error });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Auth state will be updated by the onAuthStateChange listener
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      setState({ ...state, isLoading: false, error: error as Error });
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!state.session) return;
      
      const response = await apiRequest('GET', '/api/user');
      const user = await response.json();
      
      setState({
        ...state,
        user,
        error: null,
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Don't update error state for refresh failures
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}