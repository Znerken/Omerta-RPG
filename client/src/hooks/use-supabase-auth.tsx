import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, signInWithEmail, signUpWithEmail, signOut, UserProfile } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Create a context for authentication
interface SupabaseAuthContextType {
  session: Session | null;
  user: User | null;
  gameUser: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Provider component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get game user data from our database
  const { data: gameUser } = useQuery<UserProfile>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest('GET', '/api/user');
        if (!res.ok) {
          throw new Error('Failed to fetch user profile');
        }
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!user,
  });

  // Check for session on initial load
  useEffect(() => {
    setIsLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await signInWithEmail(email, password);
      setUser(user);
      
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Welcome back',
        description: 'You have successfully signed in.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email, password and username
  const signUp = async (email: string, password: string, username: string, confirmPassword: string) => {
    // Validate password match
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      throw new Error('Passwords do not match');
    }

    setIsLoading(true);
    try {
      // Register with Supabase
      const { user } = await signUpWithEmail(email, password, username);
      
      if (user) {
        // Create user in our database
        const res = await apiRequest('POST', '/api/register', {
          supabaseId: user.id,
          username,
          email,
          password,
          confirmPassword,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to complete registration');
        }
        
        setUser(user);
        
        // Invalidate user query to fetch game user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        toast({
          title: 'Account created',
          description: 'Your account has been created successfully. Welcome to OMERTÀ!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Please try again with different credentials.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setUser(null);
      setSession(null);
      
      // Clear user data from query cache
      queryClient.setQueryData(['/api/user'], null);
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message || 'There was an error signing out.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    session,
    user,
    gameUser,
    isLoading,
    signIn,
    signUp,
    logout,
  };

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