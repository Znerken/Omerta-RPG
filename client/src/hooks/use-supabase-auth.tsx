import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { supabase, signInWithPassword, signUp as signUpFn, signOut as signOutFn } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Authentication context type definition
type AuthContextType = {
  supabaseUser: User | null;
  gameUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<any, Error, { email: string; password: string }>;
  signUpMutation: UseMutationResult<any, Error, { email: string; username: string; password: string }>;
  logoutMutation: UseMutationResult<boolean, Error, void>;
  checkEmailAndUsername: (email: string, username: string) => Promise<{ available: boolean, message?: string }>;
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

  // Fetch the authenticated user data from Supabase on mount
  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
  }, [queryClient]);

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
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await signInWithPassword(email, password);
      
      if (error) {
        throw new Error(error);
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back to OMERTÀ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
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
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Welcome to OMERTÀ! Please check your email to confirm your account.",
      });
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
    onSuccess: () => {
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
      queryClient.setQueryData(['/api/user/profile'], null);
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
export function withAuthProtection<P>(Component: React.ComponentType<P>): React.FC<P> {
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