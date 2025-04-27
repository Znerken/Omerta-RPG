import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { Redirect, Route } from 'wouter';

/**
 * ProtectedRoute component for Supabase authentication
 * 
 * This component protects routes that require authentication
 * If the user is not authenticated, they are redirected to the auth page
 * If authentication is in progress (loading), a loading indicator is shown
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { gameUser, isLoading } = useSupabaseAuth();

  // If authentication is still loading, show a loading indicator
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your credentials...</p>
          </div>
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!gameUser) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user is authenticated, render the protected component
  return <Route path={path} component={Component} />;
}

/**
 * AdminProtectedRoute component for Supabase authentication
 * 
 * This component protects routes that require admin privileges
 * If the user is not authenticated or not an admin, they are redirected
 */
export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { gameUser, isLoading } = useSupabaseAuth();

  // If authentication is still loading, show a loading indicator
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your credentials...</p>
          </div>
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!gameUser) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user is authenticated but not an admin, redirect to dashboard
  if (!gameUser.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If user is authenticated and is an admin, render the protected component
  return <Route path={path} component={Component} />;
}

/**
 * JailProtectedRoute component
 * 
 * This component redirects users who are jailed to the jail page
 * Used to prevent jailed users from accessing certain pages
 */
export function JailProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { gameUser, isLoading } = useSupabaseAuth();

  // If authentication is still loading, show a loading indicator
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your credentials...</p>
          </div>
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!gameUser) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user is jailed, redirect to jail page
  if (gameUser.isJailed) {
    return (
      <Route path={path}>
        <Redirect to="/jail" />
      </Route>
    );
  }

  // If user is authenticated and not jailed, render the protected component
  return <Route path={path} component={Component} />;
}