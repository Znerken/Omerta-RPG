import { Switch, Route } from 'wouter';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import DashboardPage from '@/pages/dashboard-page';
import ProfilePage from '@/pages/profile-page';
import NotFound from '@/pages/not-found';
import SupabaseAuthPage from '@/pages/supabase-auth-page';
import CrimesPage from '@/pages/crimes-page';
import CasinoPage from '@/pages/casino-page';
import TrainingPage from '@/pages/training-page';
import JailPage from '@/pages/jail-page';
import InventoryPage from '@/pages/inventory-page';
import MessagesPage from '@/pages/messages-page';
import LeaderboardPage from '@/pages/leaderboard-page';
import BankingPage from '@/pages/banking-page';
import GangPage from '@/pages/gang-page';
import AchievementsPage from '@/pages/achievements-page';
import ChallengesPage from '@/pages/challenges-page';
import DrugsPage from '@/pages/drugs-page';
import LocationsPage from '@/pages/locations-page';
import FriendsPage from '@/pages/friends-page';
import AdminPage from '@/pages/admin-page';
import PublicProfilePage from '@/pages/public-profile-page';
import { ProtectedRoute, AdminProtectedRoute, JailProtectedRoute } from '@/lib/protected-route-supabase';

// App component
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="omerta-theme">
      <main>
        <Switch>
          {/* Public routes */}
          <Route path="/auth" component={SupabaseAuthPage} />

          {/* Protected routes (require authentication) */}
          <ProtectedRoute path="/" component={DashboardPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <Route path="/player/:userId" component={({ params }) => {
            const userId = parseInt(params.userId);
            return <PublicProfilePage userId={userId} />;
          }} />

          {/* Protected routes (require not being in jail) */}
          <JailProtectedRoute path="/crimes" component={CrimesPage} />
          <JailProtectedRoute path="/casino" component={CasinoPage} />
          <JailProtectedRoute path="/training" component={TrainingPage} />
          <JailProtectedRoute path="/inventory" component={InventoryPage} />
          <JailProtectedRoute path="/banking" component={BankingPage} />
          <JailProtectedRoute path="/gang" component={GangPage} />
          <JailProtectedRoute path="/drugs" component={DrugsPage} />
          <JailProtectedRoute path="/locations" component={LocationsPage} />

          {/* Routes that are accessible even when in jail */}
          <ProtectedRoute path="/jail" component={JailPage} />
          <ProtectedRoute path="/messages" component={MessagesPage} />
          <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
          <ProtectedRoute path="/achievements" component={AchievementsPage} />
          <ProtectedRoute path="/challenges" component={ChallengesPage} />
          <ProtectedRoute path="/friends" component={FriendsPage} />

          {/* Admin routes */}
          <AdminProtectedRoute path="/admin" component={AdminPage} />

          {/* Catch-all route for 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;