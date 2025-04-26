import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  UserProfile
} from '@/lib/supabase';

// Define the auth context type
interface SupabaseAuthContextType {
  session: Session | null;
  user: User | null;
  gameUser: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, confirmPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshGameUser: () => Promise<void>;
}

// Create the auth context
const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Auth provider component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [gameUser, setGameUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Fetch game user profile when auth state changes
      if (session) {
        refreshGameUser();
      } else {
        setGameUser(null);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch game user profile from API
  const refreshGameUser = async () => {
    if (!user) {
      setGameUser(null);
      return;
    }

    try {
      const response = await apiRequest('GET', '/api/user');
      
      if (response.ok) {
        const data = await response.json();
        setGameUser(data);
      } else {
        // If 401, user needs to link account
        if (response.status === 401) {
          setGameUser(null);
        } else {
          console.error(`API error: ${response.status}`);
          setError(new Error(`Failed to fetch user profile: ${response.statusText}`));
        }
      }
    } catch (err) {
      console.error('Error fetching game user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
    }
  };

  // Sign in handler
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signInWithEmail(email, password);
      
      toast({
        title: 'Success',
        description: 'You have been signed in.',
      });
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign in'));
      
      toast({
        title: 'Sign in failed',
        description: err instanceof Error ? err.message : 'Failed to sign in',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up handler
  const signUp = async (email: string, password: string, username: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate password match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Sign up with Supabase Auth
      const { user } = await signUpWithEmail(email, password, username);
      
      if (!user || !user.id) {
        throw new Error('Failed to create account');
      }
      
      // Register in our game database
      const response = await apiRequest('POST', '/api/register', {
        username,
        email,
        password,
        confirmPassword,
        supabaseId: user.id,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to register game account');
      }
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign up'));
      
      toast({
        title: 'Sign up failed',
        description: err instanceof Error ? err.message : 'Failed to sign up',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabaseSignOut();
      
      setGameUser(null);
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out.',
      });
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      
      toast({
        title: 'Sign out failed',
        description: err instanceof Error ? err.message : 'Failed to sign out',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Provide auth context
  const value = {
    session,
    user,
    gameUser,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    refreshGameUser,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Auth hook
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}