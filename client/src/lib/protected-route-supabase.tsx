import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Route, Redirect, useLocation } from 'wouter';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, AlertCircle, Shield } from 'lucide-react';

interface RouteProps {
  path: string;
  component: () => JSX.Element;
}

// Basic protected route - requires authentication
export function ProtectedRoute({ path, component: Component }: RouteProps) {
  const { isLoading, isAuthenticated, gameUser } = useSupabaseAuth();
  const [, navigate] = useLocation();

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