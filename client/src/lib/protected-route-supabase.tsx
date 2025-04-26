import { ReactNode } from 'react';
import { Redirect, Route } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';

/**
 * Properties for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** The path pattern to match */
  path: string;
  /** Whether to check for admin privileges */
  requireAdmin?: boolean;
  /** The component to render if the user is authenticated */
  children: ReactNode;
}

/**
 * Properties for the ProtectedComponent wrapper
 */
interface ProtectedComponentProps {
  /** Whether to check for admin privileges */
  requireAdmin?: boolean;
  /** The component to render if the user is authenticated */
  children: ReactNode;
}

/**
 * A wrapper that checks authentication status
 * This is used internally by ProtectedRoute
 */
function ProtectedComponent({ requireAdmin = false, children }: ProtectedComponentProps) {
  const { user, gameUser, isLoading } = useSupabaseAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  // If no user or game user, redirect to auth page
  if (!user || !gameUser) {
    return <Redirect to="/auth" />;
  }

  // If admin is required but user is not admin, redirect to access denied
  if (requireAdmin && !gameUser.isAdmin) {
    return <Redirect to="/access-denied" />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * A route component that protects a route from unauthenticated access
 * If the user is not authenticated, they will be redirected to the auth page
 */
export function ProtectedRoute({ path, requireAdmin = false, children }: ProtectedRouteProps) {
  return (
    <Route path={path}>
      <ProtectedComponent requireAdmin={requireAdmin}>
        {children}
      </ProtectedComponent>
    </Route>
  );
}

/**
 * Properties for the AdminRoute component
 */
interface AdminRouteProps {
  /** The path pattern to match */
  path: string;
  /** The component to render if the user is authenticated and is an admin */
  children: ReactNode;
}

/**
 * A route component that protects a route from non-admin access
 * If the user is not an admin, they will be redirected to the access denied page
 */
export function AdminRoute({ path, children }: AdminRouteProps) {
  return (
    <ProtectedRoute path={path} requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Properties for the withAuth component
 */
interface WithAuthOptions {
  /** Whether to check for admin privileges */
  requireAdmin?: boolean;
}

/**
 * Higher-order component that adds authentication protection to a component
 * @param Component The component to protect
 * @param options Options for the HOC
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  { requireAdmin = false }: WithAuthOptions = {}
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedComponent requireAdmin={requireAdmin}>
        <Component {...props} />
      </ProtectedComponent>
    );
  };
}