import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Route, Redirect, useLocation } from 'wouter';
import { ReactNode, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, AlertCircle, Shield } from 'lucide-react';
import { getCurrentUser, getSession } from './supabase';

interface RouteProps {
  path: string;
  component: () => JSX.Element;
}

// Basic protected route - requires authentication
export function ProtectedRoute({ path, component: Component }: RouteProps) {
  const { isLoading, isAuthenticated, gameUser } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasDirectAuth, setHasDirectAuth] = useState(false);

  // Double-check authentication directly with Supabase
  useEffect(() => {
    async function verifyAuth() {
      try {
        // First check if we already have auth from the context
        if (isAuthenticated && gameUser) {
          console.log('Protected route using context auth - authenticated with game user');
          setHasDirectAuth(true);
          setIsChecking(false);
          return;
        }
        
        // If the context is still loading, wait for it
        if (isLoading) {
          console.log('Auth context still loading, waiting...');
          return;
        }
        
        console.log('Context auth check failed, double checking with Supabase directly');
        
        // Double check with Supabase directly
        const session = await getSession();
        console.log('Session check result:', session ? 'Session found' : 'No session found');
        
        const user = await getCurrentUser();
        console.log('User check result:', user ? `User found: ${user.id}` : 'No user found');
        
        if (session && user) {
          console.log('Protected route found direct auth via session and user checks');
          setHasDirectAuth(true);
          
          // Force prefetch the game user
          try {
            console.log('Attempting to prefetch game user profile with token:', session.access_token.substring(0, 10) + '...');
            
            const res = await fetch('/api/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            
            if (res.ok) {
              const userData = await res.json();
              console.log('Successfully fetched user API response:', userData);
              
              // Check if this is a "needs linking" response
              if (userData.needsLinking) {
                console.log('User needs account linking - redirecting to link account page');
                navigate('/link-account');
                return;
              }
              
              // Otherwise it's a normal game user profile
              console.log('Successfully prefetched game user profile');
              
              // Reload the page to pick up the new game user data, but only once
              // Set a flag in localStorage to avoid reload loops
              const hasReloaded = localStorage.getItem('auth_reload_done');
              const currentUserId = localStorage.getItem('current_user_id');
              
              // Check if we have userData and don't need to reload
              if (hasReloaded || gameUser) {
                console.log('Already authenticated, no need to reload');
                return;
              }
              
              // Only reload once per session to break the loop
              console.log('Setting reload flag and refreshing to update game user data');
              localStorage.setItem('auth_reload_done', 'true');
              localStorage.setItem('current_user_id', userData.id.toString());
              
              // Instead of navigating/reloading, just set the local state to proceed
              setIsChecking(false);
              setHasDirectAuth(true);
              return;
            } else {
              console.error('Failed to prefetch game user profile:', res.status, res.statusText);
              // Try to get the error message from the response
              try {
                const errorData = await res.text();
                console.error('Error response:', errorData);
              } catch (e) {
                console.error('Could not parse error response');
              }
            }
          } catch (err) {
            console.error('Exception prefetching game user profile:', err);
          }
        } else {
          console.log('No direct auth found - redirecting to login');
          setHasDirectAuth(false);
          
          // Clear any reload flags
          localStorage.removeItem('auth_reload_done');
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Error verifying auth:', error);
        setHasDirectAuth(false);
        setIsChecking(false);
        
        // Clear any reload flags on error
        localStorage.removeItem('auth_reload_done');
      }
    }
    
    verifyAuth();
    
    // Clear reload flag when component unmounts
    return () => {
      localStorage.removeItem('auth_reload_done');
    };
  }, [isAuthenticated, isLoading, gameUser]);

  if (isLoading || isChecking) {
    return (
      <Route path={path}>
        <LoadingScreen message="Authenticating..." />
      </Route>
    );
  }

  // Handle case where user is authenticated with Supabase but doesn't have a game user
  if (isAuthenticated && !gameUser && !hasDirectAuth) {
    console.log('User authenticated with Supabase but no game user - redirecting to account linking page');
    return (
      <Route path={path}>
        <Redirect to="/link-account" />
      </Route>
    );
  }
  
  // Handle case where user is not authenticated at all
  if ((!isAuthenticated && !hasDirectAuth) || (!gameUser && !hasDirectAuth)) {
    console.log('User not authenticated - redirecting to auth page');
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

// Admin route - requires admin privileges
export function AdminProtectedRoute({ path, component: Component }: RouteProps) {
  const { isLoading, isAuthenticated, gameUser } = useSupabaseAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingScreen message="Authenticating..." />
      </Route>
    );
  }

  // Handle case where user is authenticated with Supabase but doesn't have a game user
  if (isAuthenticated && !gameUser) {
    console.log('Admin route - authenticated with Supabase but no game user - redirecting to account linking page');
    return (
      <Route path={path}>
        <Redirect to="/link-account" />
      </Route>
    );
  }
  
  // Handle case where user is not authenticated at all
  if (!isAuthenticated) {
    console.log('Admin route - not authenticated - redirecting to auth page');
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!gameUser.isAdmin) {
    return (
      <Route path={path}>
        <AccessDeniedScreen
          title="Admin Access Required"
          message="You need administrative privileges to access this page."
          icon={<Shield className="h-12 w-12 text-destructive" />}
        />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

// Jail protected route - requires not being in jail
export function JailProtectedRoute({ path, component: Component }: RouteProps) {
  const { isLoading, isAuthenticated, gameUser } = useSupabaseAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingScreen message="Authenticating..." />
      </Route>
    );
  }

  // Handle case where user is authenticated with Supabase but doesn't have a game user
  if (isAuthenticated && !gameUser) {
    console.log('Jail route - authenticated with Supabase but no game user - redirecting to account linking page');
    return (
      <Route path={path}>
        <Redirect to="/link-account" />
      </Route>
    );
  }
  
  // Handle case where user is not authenticated at all
  if (!isAuthenticated) {
    console.log('Jail route - not authenticated - redirecting to auth page');
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (gameUser.isJailed) {
    return (
      <Route path={path}>
        <Redirect to="/jail" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

// Loading screen component
function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-xl font-medium">{message}</p>
      </div>
    </div>
  );
}

// Access denied screen component
interface AccessDeniedProps {
  title: string;
  message: string;
  icon?: ReactNode;
  buttonText?: string;
  buttonAction?: () => void;
}

function AccessDeniedScreen({
  title,
  message,
  icon = <AlertCircle className="h-12 w-12 text-destructive" />,
  buttonText = "Go back",
  buttonAction
}: AccessDeniedProps) {
  const [, navigate] = useLocation();

  const handleButtonClick = () => {
    if (buttonAction) {
      buttonAction();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex justify-center">{icon}</div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
          <Button onClick={handleButtonClick} className="mt-4">
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}