import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { MafiaLayout } from "@/components/layout/mafia-layout";
import { useAuth } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import CrimesPage from "@/pages/crimes-page";
import TrainingPage from "@/pages/training-page";
import GangPage from "@/pages/gang-page";
import JailPage from "@/pages/jail-page";
import InventoryPage from "@/pages/inventory-page";
import MessagesPage from "@/pages/messages-page";
import LeaderboardPage from "@/pages/leaderboard-page";

// Protected route with layout wrapper
function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <MafiaLayout>
      <Component />
    </MafiaLayout>
  );
}

function Router() {
  const { user } = useAuth();
  
  // Conditional rendering to avoid React hooks rule violations
  if (user === undefined) {
    return null; // Loading state
  }
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes with layout */}
      <Route path="/">
        {() => (
          <ProtectedRoute path="/" component={() => <ProtectedPage component={DashboardPage} />} />
        )}
      </Route>
      
      <Route path="/profile">
        {() => (
          <ProtectedRoute path="/profile" component={() => <ProtectedPage component={ProfilePage} />} />
        )}
      </Route>
      
      <Route path="/crimes">
        {() => (
          <ProtectedRoute path="/crimes" component={() => <ProtectedPage component={CrimesPage} />} />
        )}
      </Route>
      
      <Route path="/training">
        {() => (
          <ProtectedRoute path="/training" component={() => <ProtectedPage component={TrainingPage} />} />
        )}
      </Route>
      
      <Route path="/gang">
        {() => (
          <ProtectedRoute path="/gang" component={() => <ProtectedPage component={GangPage} />} />
        )}
      </Route>
      
      <Route path="/jail">
        {() => (
          <ProtectedRoute path="/jail" component={() => <ProtectedPage component={JailPage} />} />
        )}
      </Route>
      
      <Route path="/inventory">
        {() => (
          <ProtectedRoute path="/inventory" component={() => <ProtectedPage component={InventoryPage} />} />
        )}
      </Route>
      
      <Route path="/messages">
        {() => (
          <ProtectedRoute path="/messages" component={() => <ProtectedPage component={MessagesPage} />} />
        )}
      </Route>
      
      <Route path="/leaderboard">
        {() => (
          <ProtectedRoute path="/leaderboard" component={() => <ProtectedPage component={LeaderboardPage} />} />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
