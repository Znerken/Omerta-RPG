import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Import pages
import SupabaseAuthPage from "@/pages/supabase-auth-page";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AchievementsPage from "@/pages/achievements-page";
import AdminPage from "@/pages/admin-page";
import BankingPage from "@/pages/banking-page";
import CasinoPage from "@/pages/casino-page";
import ChallengesPage from "@/pages/challenges-page";
import CrimesPage from "@/pages/crimes-page";
import DashboardPage from "@/pages/dashboard-page";
import DrugsPage from "@/pages/drugs-page";
import FriendsPage from "@/pages/friends-page";
import GangPage from "@/pages/gang-page";
import InventoryPage from "@/pages/inventory-page";
import JailPage from "@/pages/jail-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import LocationsPage from "@/pages/locations-page";
import MessagesPage from "@/pages/messages-page";
import ProfilePage from "@/pages/profile-page";
import PublicProfilePage from "@/pages/public-profile-page";
import TrainingPage from "@/pages/training-page";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  return <Component {...rest} />;
}

// Modified to use Supabase Auth
function Router() {
  return (
    <Switch>
      <Route path="/auth" component={SupabaseAuthPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={AchievementsPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/banking" component={() => <ProtectedRoute component={BankingPage} />} />
      <Route path="/casino" component={() => <ProtectedRoute component={CasinoPage} />} />
      <Route path="/challenges" component={() => <ProtectedRoute component={ChallengesPage} />} />
      <Route path="/crimes" component={() => <ProtectedRoute component={CrimesPage} />} />
      <Route path="/drugs" component={() => <ProtectedRoute component={DrugsPage} />} />
      <Route path="/friends" component={() => <ProtectedRoute component={FriendsPage} />} />
      <Route path="/gang" component={() => <ProtectedRoute component={GangPage} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={InventoryPage} />} />
      <Route path="/jail" component={() => <ProtectedRoute component={JailPage} />} />
      <Route path="/leaderboard" component={() => <ProtectedRoute component={LeaderboardPage} />} />
      <Route path="/locations" component={() => <ProtectedRoute component={LocationsPage} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={MessagesPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/player/:userId" component={({params}) => <ProtectedRoute component={PublicProfilePage} userId={Number(params.userId)} />} />
      <Route path="/training" component={() => <ProtectedRoute component={TrainingPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <div className="app-container bg-dark-background text-foreground min-h-screen">
          <Router />
          <Toaster />
        </div>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}