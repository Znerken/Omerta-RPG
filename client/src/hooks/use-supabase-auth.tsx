import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { signInWithPassword, signUp as signUpFn, signOut as signOutFn } from '@/lib/supabase';
import { useSupabase } from '@/providers/supabase-provider';
import { resetSupabaseClient } from '@/providers/supabase-provider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Authentication context type definition
type AuthContextType = {
  supabaseUser: User | null;
  gameUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<any, Error, { emailOrUsername: string; password: string }>;
  signUpMutation: UseMutationResult<any, Error, { email: string; username: string; password: string }>;
  logoutMutation: UseMutationResult<boolean, Error, void>;
  checkEmailAndUsername: (email: string, username: string) => Promise<{ available: boolean, message?: string }>;
  signOut: () => Promise<void>; // Direct signOut method for emergency use
};

// Define the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the authentication provider
interface AuthProviderProps {
  children: ReactNode;
}

// The Supabase Authentication Provider
export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get Supabase client from our provider
  const { supabase } = useSupabase();

  // Fetch the authenticated user data from Supabase on mount
  useEffect(() => {
    if (!supabase) return; // Skip if supabase client is not available yet
    
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setSupabaseUser(session?.user || null);
        
        // Invalidate user data query when auth state changes
        if (session?.user) {
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        } else {
          queryClient.setQueryData(['/api/user/profile'], null);
        }
      }
    );

    // Clean up the subscription
    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  // Fetch the game user profile if authenticated
  const {
    data: gameUser,
    isLoading: isUserLoading,
    error: userError
  } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      if (!supabaseUser) return null;
      
      try {
        const res = await apiRequest('GET', '/api/user/profile');
        if (!res.ok) {
          throw new Error(`Failed to fetch user profile: ${res.status}`);
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching game user:', error);
        return null;
      }
    },
    enabled: !!supabaseUser,
  });

  // Handle login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ emailOrUsername, password }: { emailOrUsername: string; password: string }) => {
      // Determine if input is an email or username
      const isEmail = emailOrUsername.includes('@');
      
      let data, error;
      
      if (isEmail) {
        // Login with email
        console.log('Logging in with email:', emailOrUsername);
        ({ data, error } = await signInWithPassword(emailOrUsername, password));
      } else {
        // Login with username - we need to get the email for this username first
        try {
          console.log('Fetching email for username:', emailOrUsername);
          const res = await apiRequest('POST', '/api/get-email-by-username', { username: emailOrUsername });
          
          if (!res.ok) {
            console.error('API error:', await res.text());
            throw new Error('User not found');
          }
          
          const emailData = await res.json();
          console.log('Email lookup response:', emailData);
          
          if (!emailData.email) {
            throw new Error('User not found');
          }
          
          // Now sign in with the retrieved email
          console.log('Logging in with retrieved email:', emailData.email);
          ({ data, error } = await signInWithPassword(emailData.email, password));
        } catch (err: any) {
          console.error('Login error:', err);
          throw new Error(err.message || 'Login failed');
        }
      }
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(error);
      }
      
      return data;
    },
    onSuccess: async (data) => {
      toast({
        title: "Login successful",
        description: "Welcome back to OMERTÀ",
      });
      
      console.log('Login successful, preparing for reload with new session');
      
      // Small delay to ensure session is registered and toast is shown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a full page reload to completely refresh auth state
      // This is the most reliable way to ensure proper authentication flow
      window.location.href = '/?reload=' + Date.now();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, username, password }: { email: string; username: string; password: string }) => {
      // First, check if email and username are available
      const checkResult = await checkEmailAndUsername(email, username);
      
      if (!checkResult.available) {
        throw new Error(checkResult.message || 'Email or username is already taken');
      }
      
      // If available, proceed with Supabase signup
      const { data, error } = await signUpFn(email, password, { username });
      
      if (error) {
        throw new Error(error);
      }
      
      // Register the user in our game database
      const res = await apiRequest('POST', '/api/register', { email, username, password });
      
      if (!res.ok) {
        throw new Error('Registration in game database failed');
      }
      
      return data;
    },
    onSuccess: async (data) => {
      toast({
        title: "Registration successful",
        description: "Welcome to OMERTÀ! Please check your email to confirm your account.",
      });
      
      console.log('Registration successful, preparing for reload with new session');
      
      // Give time for the Supabase session to be established and for the toast to be read
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Force a full page reload to completely refresh auth state
      // This is the most reliable way to ensure proper authentication flow
      window.location.href = '/?reload=' + Date.now();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await signOutFn();
    },
    onSuccess: async () => {
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
      
      console.log('Logout successful, preparing for reload with cleared session');
      
      // Clear local storage and session storage for good measure
      localStorage.clear();
      sessionStorage.clear();
      
      // Small delay to ensure the session is properly cleared and toast is shown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a full page reload to the auth page with a timestamp to prevent caching issues
      // This is the most reliable way to ensure proper session termination
      window.location.href = '/auth?logout=' + Date.now();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to check if email and username are available
  async function checkEmailAndUsername(email: string, username: string): Promise<{ available: boolean, message?: string }> {
    try {
      const res = await apiRequest('POST', '/api/check-username-email', { email, username });
      
      if (!res.ok) {
        const error = await res.json();
        return { available: false, message: error.message || 'Email or username is not available' };
      }
      
      return { available: true };
    } catch (error: any) {
      return { available: false, message: error.message || 'Failed to check email and username availability' };
    }
  }

  // Determine if user is authenticated
  const isAuthenticated = !!supabaseUser && !!gameUser;
  const isLoading = !!supabaseUser && isUserLoading;

  // Direct sign out function for emergency cases
  async function signOut() {
    console.log("NUCLEAR OPTION: Emergency sign out triggered");
    try {
      // Call server-side logout route
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
      } catch (e) {
        console.error("Error calling server logout:", e);
      }
      
      // Force clear all Supabase cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase if available
      if (supabase) {
        try {
          // Try to sign out from Supabase
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Supabase sign out error:", e);
        }
      }
      
      // Reset the global Supabase client
      resetSupabaseClient();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Remove the user from state
      setSupabaseUser(null);
      
      console.log("Emergency sign out completed, preparing for hard reload");
      
      // Force a hard full page reload to clear any cached states
      const logoutUrl = '/auth?logout=' + Date.now();
      
      toast({
        title: "Successfully logged out",
        description: "Redirecting to login page...",
      });
      
      // Add a delay to make sure toast is shown
      setTimeout(() => {
        // Attempt to use window.location.replace for a cleaner navigation history
        try {
          window.location.replace(logoutUrl);
        } catch (e) {
          // Fall back to standard redirect if replace fails
          window.location.href = logoutUrl;
        }
      }, 1000);
    } catch (error) {
      console.error("Sign out error:", error);
      // Force navigation in case of error
      alert("An error occurred during logout. The page will now reload.");
      window.location.reload();
    }
  }

  // Define the context value
  const contextValue: AuthContextType = {
    supabaseUser,
    gameUser,
    isLoading,
    isAuthenticated,
    loginMutation,
    signUpMutation,
    logoutMutation,
    checkEmailAndUsername,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}

// Protected route component
export function withAuthProtection<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useSupabaseAuth();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return null;
    }
    
    return <Component {...props} />;
  };
}