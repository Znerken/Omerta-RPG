import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as supabaseSignOut,
  getUser
} from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: { email: string; password: string }) => Promise<User>;
  signUp: (email: string, password: string, metadata?: any) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
        setError(error instanceof Error ? error : new Error('Failed to get user'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoading(false);
      }
    );

    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (credentials: { email: string; password: string }): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await signInWithEmail(credentials.email, credentials.password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign in'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await signUpWithEmail(email, password, metadata);
      // Do not automatically set user on sign up as email verification may be required
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign up'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabaseSignOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign out'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh user data'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}