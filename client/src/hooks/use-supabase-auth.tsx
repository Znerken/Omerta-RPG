import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useLocation } from 'wouter';

// Define the context type
interface SupabaseAuthContextType {
  session: Session | null;
  user: User | null;
  gameUser: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context
const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

// Provider component
export function SupabaseAuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [gameUser, setGameUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize auth state from Supabase
  useEffect(() => {
    // Set isLoading to true when starting to fetch session
    setIsLoading(true);

    // Get current session
    const initializeAuth = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch game user data
        try {
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (response.ok) {
            const gameUserData = await response.json();
            setGameUser(gameUserData);
          } else {
            console.error('Failed to fetch game user data');
            setGameUser(null);
          }
        } catch (error) {
          console.error('Error fetching game user data:', error);
          setGameUser(null);
        }
      } else {
        // No active session
        setSession(null);
        setUser(null);
        setGameUser(null);
      }

      // Auth state is initialized, set loading to false
      setIsLoading(false);
    };

    // Initialize auth state
    initializeAuth();

    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch game user data when auth state changes
        if (session) {
          try {
            const response = await fetch('/api/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });

            if (response.ok) {
              const gameUserData = await response.json();
              setGameUser(gameUserData);
            } else {
              setGameUser(null);
            }
          } catch (error) {
            console.error('Error fetching game user data on auth change:', error);
            setGameUser(null);
          }
        } else {
          setGameUser(null);
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Signed in',
        description: 'Welcome back to OMERTÀ',
        variant: 'default'
      });

      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Failed to sign in',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    username: string,
    confirmPassword: string
  ) => {
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure your passwords match',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // First, sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        throw error;
      }

      // If successful, create a user in our database
      if (data.user) {
        const apiResponse = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session?.access_token}`
          },
          body: JSON.stringify({
            username,
            email,
            confirmPassword,
            supabaseId: data.user.id
          })
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.message || 'Failed to create user in the game database');
        }

        // Registration successful
        toast({
          title: 'Registration successful',
          description: 'Welcome to OMERTÀ',
          variant: 'default'
        });

        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();

      toast({
        title: 'Signed out',
        description: 'You have been signed out',
        variant: 'default'
      });

      setLocation('/auth');
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message || 'Failed to sign out',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    gameUser,
    isLoading,
    signIn,
    signUp,
    logout
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Hook to use the auth context
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}