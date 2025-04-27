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
            
            const res = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            
            if (res.ok) {
              const gameUserData = await res.json();
              console.log('Successfully prefetched game user profile:', gameUserData ? 'Data found' : 'No data returned');
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
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Error verifying auth:', error);
        setHasDirectAuth(false);
        setIsChecking(false);
      }
    }
    
    verifyAuth();
  }, [isAuthenticated, isLoading, gameUser]);

  if (isLoading || isChecking) {
    return (
      <Route path={path}>
        <LoadingScreen message="Authenticating..." />
      </Route>
    );
  }

  if ((!isAuthenticated && !hasDirectAuth) || (!gameUser && !hasDirectAuth)) {
    console.log('Redirecting to auth from protected route');
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

  if (!isAuthenticated || !gameUser) {
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

  if (!isAuthenticated || !gameUser) {
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