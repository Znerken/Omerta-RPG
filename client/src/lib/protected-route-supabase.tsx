import { useEffect } from 'react';
import { Redirect, Route } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  component: React.ComponentType;
  adminOnly?: boolean;
  path: string;
}

/**
 * Protected route component for Supabase auth
 * Redirects to login page if user is not authenticated
 * Can optionally require admin privileges
 */
export function ProtectedRouteSupabase({ 
  component: Component, 
  adminOnly = false,
  path
}: ProtectedRouteProps) {
  const { user, gameUser, isLoading } = useSupabaseAuth();

  // If still loading, show loader
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Route>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user || !gameUser) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If admin only and user is not admin, redirect to dashboard
  if (adminOnly && !gameUser.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // All checks passed, render component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}