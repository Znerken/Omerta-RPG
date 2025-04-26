import { Redirect, Route } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  adminRequired?: boolean;
};

/**
 * A route that requires authentication to access
 * If the user is not authenticated, they will be redirected to the login page
 * If adminRequired is true, the user must also be an admin
 */
export function ProtectedRouteWithSupabase({
  path,
  component: Component,
  adminRequired = false,
}: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  
  // Fetch the game user data if we have a Supabase user
  const { data: gameUser, isLoading: userDataLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user');
      if (!res.ok) {
        if (res.status === 401) {
          return null;
        }
        throw new Error('Failed to fetch user data');
      }
      return res.json();
    },
    // Only run this query if we have a user
    enabled: !!user,
  });

  // Are we loading auth or user data?
  const isLoading = authLoading || (!!user && userDataLoading);

  return (
    <Route path={path}>
      {isLoading ? (
        // Show loading spinner while checking auth
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        // No Supabase user, redirect to login
        <Redirect to="/auth" />
      ) : !gameUser ? (
        // Has Supabase user but no game user - need to complete profile
        <Redirect to="/complete-profile" />
      ) : adminRequired && !gameUser.isAdmin ? (
        // Needs admin but user is not admin
        <Redirect to="/" />
      ) : (
        // User is authenticated and meets requirements
        <Component />
      )}
    </Route>
  );
}