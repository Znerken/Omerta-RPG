import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';
import { ThemeProvider } from '@/components/ui/theme-provider';
import MafiaLayout from '@/components/layout/mafia-layout';
import HomePage from '@/pages/dashboard-page'; // Using dashboard-page as the home page
import NotFound from '@/pages/not-found';
import SupabaseAuthPage from '@/pages/supabase-auth-page';

// Lazy-loaded pages
const ProfilePage = lazy(() => import('@/pages/profile-page'));
const PublicProfilePage = lazy(() => import('@/pages/public-profile-page'));
const MessagesPage = lazy(() => import('@/pages/messages-page'));
const BankingPage = lazy(() => import('@/pages/banking-page'));
const CasinoPage = lazy(() => import('@/pages/casino-page'));
const CrimesPage = lazy(() => import('@/pages/crimes-page'));
const GangPage = lazy(() => import('@/pages/gang-page'));
const LeaderboardPage = lazy(() => import('@/pages/leaderboard-page'));
const InventoryPage = lazy(() => import('@/pages/inventory-page'));
const AchievementsPage = lazy(() => import('@/pages/achievements-page'));
const FriendsPage = lazy(() => import('@/pages/friends-page'));
const TrainingPage = lazy(() => import('@/pages/training-page'));
const JailPage = lazy(() => import('@/pages/jail-page'));
const AdminPage = lazy(() => import('@/pages/admin-page'));
const LocationsPage = lazy(() => import('@/pages/locations-page'));
const DrugsPage = lazy(() => import('@/pages/drugs-page'));
const ChallengesPage = lazy(() => import('@/pages/challenges-page'));

// Protected route component - checks if user is authenticated
function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <MafiaLayout>
      <Component />
    </MafiaLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="omerta-theme">
      <QueryClientProvider client={queryClient}>
        <SupabaseAuthProvider>
          <div className="min-h-screen bg-black text-white">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <Switch>
                {/* Public routes */}
                <Route path="/auth" component={SupabaseAuthPage} />
                
                {/* Protected routes */}
                <Route path="/">
                  <ProtectedPage component={HomePage} />
                </Route>
                <Route path="/profile">
                  <ProtectedPage component={ProfilePage} />
                </Route>
                <Route path="/player/:userId">
                  <ProtectedPage component={PublicProfilePage} />
                </Route>
                <Route path="/messages">
                  <ProtectedPage component={MessagesPage} />
                </Route>
                <Route path="/banking">
                  <ProtectedPage component={BankingPage} />
                </Route>
                <Route path="/casino">
                  <ProtectedPage component={CasinoPage} />
                </Route>
                <Route path="/crimes">
                  <ProtectedPage component={CrimesPage} />
                </Route>
                <Route path="/gang">
                  <ProtectedPage component={GangPage} />
                </Route>
                <Route path="/leaderboard">
                  <ProtectedPage component={LeaderboardPage} />
                </Route>
                <Route path="/inventory">
                  <ProtectedPage component={InventoryPage} />
                </Route>
                <Route path="/achievements">
                  <ProtectedPage component={AchievementsPage} />
                </Route>
                <Route path="/friends">
                  <ProtectedPage component={FriendsPage} />
                </Route>
                <Route path="/training">
                  <ProtectedPage component={TrainingPage} />
                </Route>
                <Route path="/jail">
                  <ProtectedPage component={JailPage} />
                </Route>
                <Route path="/admin">
                  <ProtectedPage component={AdminPage} />
                </Route>
                <Route path="/locations">
                  <ProtectedPage component={LocationsPage} />
                </Route>
                <Route path="/drugs">
                  <ProtectedPage component={DrugsPage} />
                </Route>
                <Route path="/challenges">
                  <ProtectedPage component={ChallengesPage} />
                </Route>
                
                {/* 404 route */}
                <Route component={NotFound} />
              </Switch>
            </Suspense>
            <Toaster />
          </div>
        </SupabaseAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;