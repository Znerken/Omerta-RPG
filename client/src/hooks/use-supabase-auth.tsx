import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { apiRequest } from '../lib/queryClient';
import { useToast } from './use-toast';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the auth context type
type SupabaseAuthContextType = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, confirmPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
  gameUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

// Create the auth context
const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// SupabaseAuthProvider component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [gameUser, setGameUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize the auth state
  useEffect(() => {
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchGameUser(session.user.id);
      } else {
        setUser(null);
        setGameUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchGameUser(session.user.id);
      } else {
        setUser(null);
        setGameUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    // Clean up the listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch the game user data from our API
  const fetchGameUser = async (supabaseUserId: string) => {
    try {
      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setGameUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      const token = session.access_token;
      
      // Call our API to get the game user data
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setGameUser(userData);
        setIsAuthenticated(true);
      } else {
        // If we have a Supabase user but no game user, they need to create a game profile
        if (response.status === 404) {
          setGameUser(null);
          setIsAuthenticated(false);
          toast({
            title: "Profile needed",
            description: "Please complete your game profile registration",
            variant: "default"
          });
        } else {
          throw new Error('Failed to fetch user data');
        }
      }
    } catch (error) {
      console.error('Error fetching game user:', error);
      setGameUser(null);
      setIsAuthenticated(false);
      toast({
        title: "Authentication error",
        description: "Failed to fetch your game profile",
        variant: "destructive"
      });
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // User is now authenticated with Supabase
      setUser(data.user);
      
      // Fetch the game user data
      await fetchGameUser(data.user.id);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      
      // First check if the username and email are available
      const checkResponse = await apiRequest('POST', '/api/check-username-email', {
        username,
        email
      });
      
      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.message || 'Username or email is already taken');
      }
      
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        throw error;
      }

      // Create game user profile
      const createProfileResponse = await apiRequest('POST', '/api/register', {
        username,
        email,
        password,
        confirmPassword,
        supabaseId: data.user?.id
      });

      if (!createProfileResponse.ok) {
        const errorData = await createProfileResponse.json();
        throw new Error(errorData.message || 'Failed to create game profile');
      }

      const gameUserData = await createProfileResponse.json();
      setGameUser(gameUserData);
      setIsAuthenticated(true);
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setGameUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "An error occurred while trying to reset your password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: "Password update failed",
        description: error.message || "An error occurred while trying to update your password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    user,
    gameUser,
    isLoading,
    isAuthenticated,
  };

  // Provide the auth context
  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}