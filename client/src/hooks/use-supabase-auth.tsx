import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

interface SupabaseAuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (email: string, password: string, userData: { username: string; email: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch user data from API
   */
  const fetchUserData = async () => {
    try {
      const response = await apiRequest('GET', '/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If user is not found in our database but authenticated in Supabase
        // we should create a user in our database
        console.log('User authenticated in Supabase but not found in database');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  /**
   * Refresh user data (called after login, signup, or session change)
   */
  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setSupabaseUser(authUser);
        await fetchUserData();
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setSupabaseUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        throw new Error(handleSupabaseError(error, 'Login failed'));
      }
      
      // Check if user exists in our database
      const userResponse = await apiRequest('GET', '/api/user');
      
      if (!userResponse.ok) {
        // If user is not found in our database but authenticated in Supabase,
        // we need to link the accounts
        try {
          // Link Supabase account with existing database account
          const linkResponse = await apiRequest('POST', '/api/link-supabase-account', {
            email: credentials.email,
            password: credentials.password,
            supabaseId: data.user.id,
          });
          
          if (!linkResponse.ok) {
            throw new Error('Failed to link Supabase account with existing account');
          }
          
          const userData = await linkResponse.json();
          setUser(userData);
        } catch (linkError) {
          console.error('Error linking accounts:', linkError);
          // Sign out from Supabase since we couldn't link accounts
          await supabase.auth.signOut();
          throw new Error('Failed to link your account. Please contact support.');
        }
      } else {
        const userData = await userResponse.json();
        setUser(userData);
      }
      
      setSupabaseUser(data.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, userData: { username: string; email: string }) => {
    setIsLoading(true);
    try {
      // First, check if username is taken
      const checkResponse = await apiRequest('GET', `/api/check-username?username=${encodeURIComponent(userData.username)}`);
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        throw new Error('Username is already taken');
      }
      
      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw new Error(handleSupabaseError(error, 'Registration failed'));
      }
      
      if (!data.user) {
        throw new Error('User creation failed');
      }
      
      // Register user in our database
      try {
        const registerResponse = await apiRequest('POST', '/api/register', {
          ...userData,
          supabaseId: data.user.id,
          confirmPassword: password, // Required by our API, but not stored
        });
        
        if (!registerResponse.ok) {
          // If registration fails, clean up Supabase user
          await supabase.auth.admin.deleteUser(data.user.id);
          throw new Error('Failed to create user profile');
        }
        
        const newUser = await registerResponse.json();
        setUser(newUser);
        setSupabaseUser(data.user);
      } catch (registerError) {
        // Clean up Supabase user if our registration fails
        if (data.user?.id) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
        
        console.error('Registration error:', registerError);
        throw registerError;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/logout');
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Listen for authentication state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSupabaseUser(session.user);
          await fetchUserData();
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    refreshUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    supabaseUser,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
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