import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { queryClient } from './lib/queryClient';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';

// Page imports
import DashboardPage from '@/pages/dashboard-page';
import ProfilePage from '@/pages/profile-page';
import SupabaseAuthPage from '@/pages/supabase-auth-page';
import NotFound from '@/pages/not-found';
import AchievementsPage from '@/pages/achievements-page';
import CrimesPage from '@/pages/crimes-page';
import CasinoPage from '@/pages/casino-page';
import BankingPage from '@/pages/banking-page';
import AdminPage from '@/pages/admin-page';
import DrugsPage from '@/pages/drugs-page';
import ChallengesPage from '@/pages/challenges-page';
import GangPage from '@/pages/gang-page';
import LeaderboardPage from '@/pages/leaderboard-page';
import JailPage from '@/pages/jail-page';
import InventoryPage from '@/pages/inventory-page';
import LocationsPage from '@/pages/locations-page';
import MessagesPage from '@/pages/messages-page';
import TrainingPage from '@/pages/training-page';
import FriendsPage from '@/pages/friends-page';
import PublicProfilePage from '@/pages/public-profile-page';

import { ProtectedRouteWithSupabase } from '@/lib/protected-route-supabase';

function AppContent() {
  return (
    <Switch>
      {/* Auth routes - public */}
      <Route path="/auth" component={SupabaseAuthPage} />
      
      {/* Public routes */}
      <Route path="/player/:userId" component={PublicProfilePage} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRouteWithSupabase path="/" component={DashboardPage} />
      <ProtectedRouteWithSupabase path="/profile" component={ProfilePage} />
      <ProtectedRouteWithSupabase path="/achievements" component={AchievementsPage} />
      <ProtectedRouteWithSupabase path="/crimes" component={CrimesPage} />
      <ProtectedRouteWithSupabase path="/casino" component={CasinoPage} />
      <ProtectedRouteWithSupabase path="/bank" component={BankingPage} />
      <ProtectedRouteWithSupabase path="/drugs" component={DrugsPage} />
      <ProtectedRouteWithSupabase path="/challenges" component={ChallengesPage} />
      <ProtectedRouteWithSupabase path="/gang" component={GangPage} />
      <ProtectedRouteWithSupabase path="/leaderboard" component={LeaderboardPage} />
      <ProtectedRouteWithSupabase path="/jail" component={JailPage} />
      <ProtectedRouteWithSupabase path="/inventory" component={InventoryPage} />
      <ProtectedRouteWithSupabase path="/locations" component={LocationsPage} />
      <ProtectedRouteWithSupabase path="/messages" component={MessagesPage} />
      <ProtectedRouteWithSupabase path="/training" component={TrainingPage} />
      <ProtectedRouteWithSupabase path="/friends" component={FriendsPage} />
      
      {/* Admin routes - also protected */}
      <ProtectedRouteWithSupabase path="/admin" component={AdminPage} adminRequired={true} />
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="omerta-ui-theme">
        <SupabaseAuthProvider>
          <AppContent />
          <Toaster />
        </SupabaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}