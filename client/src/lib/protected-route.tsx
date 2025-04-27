import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { memo } from "react";

// Memorize the loading spinner component to prevent re-rendering
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-dark">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";

// Wrapped component that has memorization to reduce re-renders
const MemoizedRouteWrapper = memo(({ 
  Component 
}: { 
  Component: () => React.JSX.Element 
}) => <Component />);
MemoizedRouteWrapper.displayName = "MemoizedRouteWrapper";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingSpinner />
      </Route>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Authenticated - render component with memoization
  return (
    <Route path={path}>
      <MemoizedRouteWrapper Component={Component} />
    </Route>
  );
}
