import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket-context";
import { GlobalStatsProvider } from "./hooks/use-global-stats";
import { NotificationProvider } from "./hooks/use-notification";
import { AchievementsProvider } from "./hooks/use-achievements";
import { MessagesProvider } from "./hooks/use-messages";
import { ProtectedRoute } from "./lib/protected-route";
import { MafiaLayout } from "@/components/layout/mafia-layout";
import { useAuth } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import PublicProfilePage from "@/pages/public-profile-page";
import EmergencyProfilePage from "@/pages/emergency-profile";
import CrimesPage from "@/pages/crimes-page";
import TrainingPage from "@/pages/training-page";
import GangPage from "@/pages/gang-page";
import JailPage from "@/pages/jail-page";
import InventoryPage from "@/pages/inventory-page";
import MessagesPage from "@/pages/messages-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import BankingPage from "@/pages/banking-page";
import ATMBankingPage from "@/pages/atm-banking-page";
import ChallengesPage from "@/pages/challenges-page";
import AchievementsPage from "@/pages/achievements-page";
import AdminPage from "@/pages/admin-page";
import ItemManagementPage from "@/pages/admin/item-management";
import DrugsPage from "@/pages/drugs-page";
import CasinoPage from "@/pages/casino-page";
import NewCasinoPage from "@/pages/new-casino-page";
import FriendsPage from "@/pages/friends-page";
import FriendSystemTestPage from "@/pages/friend-system-test";
import LocationsPage from "@/pages/locations-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import ThrottleDemoPage from "@/pages/throttle-demo-page";
import TestGangPage from "@/pages/test-gang-page";

// Protected route with layout wrapper
function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <MafiaLayout>
      <Component />
    </MafiaLayout>
  );
}

// Router component that uses the auth context
function AppRouter() {
  const { user, isLoading } = useAuth();
  
  // Loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
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
      
      {/* Deprecated route - keeping for backwards compatibility but redirecting to /player/:id */}
      <Route path="/profile/:userId">
        {({ params }) => (
          <ProtectedRoute 
            path={`/profile/${params.userId}`} 
            component={() => <ProtectedPage component={() => <PublicProfilePage userId={parseInt(params.userId)} />} />} 
          />
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
      
      {/* Redirect Gang 2.0 URL to the main gang page */}
      <Route path="/gang-new">
        {() => (
          <ProtectedRoute path="/gang-new" component={() => {
            // Use window.location for immediate redirect
            typeof window !== "undefined" && (window.location.href = "/gang");
            return <div>Redirecting to gang page...</div>;
          }} />
        )}
      </Route>
      
      <Route path="/drugs">
        {() => (
          <ProtectedRoute path="/drugs" component={() => <ProtectedPage component={DrugsPage} />} />
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
      
      <Route path="/banking">
        {() => (
          <ProtectedRoute path="/banking" component={() => <ProtectedPage component={ATMBankingPage} />} />
        )}
      </Route>

      <Route path="/banking-classic">
        {() => (
          <ProtectedRoute path="/banking-classic" component={() => <ProtectedPage component={BankingPage} />} />
        )}
      </Route>
      
      <Route path="/casino">
        {() => (
          <ProtectedRoute path="/casino" component={() => <ProtectedPage component={CasinoPage} />} />
        )}
      </Route>
      
      <Route path="/casino-new">
        {() => (
          <ProtectedRoute path="/casino-new" component={() => <ProtectedPage component={NewCasinoPage} />} />
        )}
      </Route>
      
      <Route path="/challenges">
        {() => (
          <ProtectedRoute path="/challenges" component={() => <ProtectedPage component={ChallengesPage} />} />
        )}
      </Route>
      
      <Route path="/achievements">
        {() => (
          <ProtectedRoute path="/achievements" component={() => <ProtectedPage component={AchievementsPage} />} />
        )}
      </Route>
      
      <Route path="/friends">
        {() => (
          <ProtectedRoute path="/friends" component={() => <ProtectedPage component={FriendsPage} />} />
        )}
      </Route>
      
      <Route path="/friend-system-test">
        {() => (
          <ProtectedRoute path="/friend-system-test" component={() => <ProtectedPage component={FriendSystemTestPage} />} />
        )}
      </Route>
      
      <Route path="/locations">
        {() => (
          <ProtectedRoute path="/locations" component={() => <ProtectedPage component={LocationsPage} />} />
        )}
      </Route>
      
      <Route path="/throttle-demo">
        {() => (
          <ProtectedRoute path="/throttle-demo" component={() => <ProtectedPage component={ThrottleDemoPage} />} />
        )}
      </Route>
      
      <Route path="/test-gang">
        {() => (
          <ProtectedRoute path="/test-gang" component={() => <ProtectedPage component={TestGangPage} />} />
        )}
      </Route>
      
      <Route path="/admin">
        {() => (
          <ProtectedRoute path="/admin" component={() => {
            // Only render the admin page if the user is an admin
            const { user } = useAuth();
            if (!user?.isAdmin) {
              return <ProtectedPage component={() => (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <h1 className="text-2xl font-bold">Access Denied</h1>
                  <p className="text-gray-400">You don't have permission to access this page.</p>
                </div>
              )} />
            }
            return <ProtectedPage component={AdminPage} />;
          }} />
        )}
      </Route>
      
      <Route path="/admin/item-management">
        {() => (
          <ProtectedRoute path="/admin/item-management" component={() => {
            // Only render the item management page if the user is an admin
            const { user } = useAuth();
            if (!user?.isAdmin) {
              return <ProtectedPage component={() => (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <h1 className="text-2xl font-bold">Access Denied</h1>
                  <p className="text-gray-400">You don't have permission to access this page.</p>
                </div>
              )} />
            }
            return <ProtectedPage component={ItemManagementPage} />;
          }} />
        )}
      </Route>
      
      {/* Public profile route - not protected, only wrapped in layout */}
      <Route path="/player/:id">
        {(params) => {
          const id = params?.id || '';
          return (
            <MafiaLayout>
              <PublicProfilePage userId={parseInt(id)} />
            </MafiaLayout>
          );
        }}
      </Route>
      
      {/* Emergency profile route - use this for debugging, outside of authentication/layout */}
      <Route path="/emergency-profile/:id" component={EmergencyProfilePage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

// Wrap the entire application
function App() {
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <AuthProvider>
          <WebSocketProvider>
            <GlobalStatsProvider>
              <NotificationProvider>
                <AchievementsProvider>
                  <MessagesProvider>
                    <AppRouter />
                  </MessagesProvider>
                </AchievementsProvider>
              </NotificationProvider>
            </GlobalStatsProvider>
          </WebSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </TooltipProvider>
  );
}

export default App;
