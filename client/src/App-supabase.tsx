import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import HomePage from "@/pages/dashboard-page";
import NotFound from "@/pages/not-found";
import SupabaseAuthPage from "@/pages/supabase-auth-page";
import AdminPage from "@/pages/admin-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import CrimesPage from "@/pages/crimes-page";
import CasinoPage from "@/pages/casino-page";
import TrainingPage from "@/pages/training-page";
import BankingPage from "@/pages/banking-page";
import LocationsPage from "@/pages/locations-page";
import JailPage from "@/pages/jail-page";
import ProfilePage from "@/pages/profile-page";
import PublicProfilePage from "@/pages/public-profile-page";
import GangPage from "@/pages/gang-page";
import MessagesPage from "@/pages/messages-page";
import DrugsPage from "@/pages/drugs-page";
import ChallengesPage from "@/pages/challenges-page";
import AchievementsPage from "@/pages/achievements-page";
import FriendsPage from "@/pages/friends-page";
import InventoryPage from "@/pages/inventory-page";
import { ProtectedRoute } from './lib/protected-route';
import './index.css';

// Wrapper component for protected routes
function ProtectedRouteWrapper({ 
  component: Component, 
  path 
}: { 
  component: React.ComponentType, 
  path: string 
}) {
  return (
    <Route path={path}>
      <ProtectedRoute path={path} component={Component} />
    </Route>
  );
}

function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="bg-black border-b border-gray-800 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">OMERTÀ</h1>
        </div>
        <div className="flex space-x-4">
          <a href="/" className={location === "/" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Home
          </a>
          <a href="/profile" className={location === "/profile" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Profile
          </a>
          <a href="/crimes" className={location === "/crimes" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Crimes
          </a>
          <a href="/casino" className={location === "/casino" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Casino
          </a>
          <a href="/banking" className={location === "/banking" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Banking
          </a>
          <a href="/gang" className={location === "/gang" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Gang
          </a>
          <a href="/drugs" className={location === "/drugs" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Drugs
          </a>
          <a href="/challenges" className={location === "/challenges" ? "text-red-500" : "text-gray-400 hover:text-white"}>
            Challenges
          </a>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [location] = useLocation();
  const showNavbar = location !== "/auth";

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <ThemeProvider defaultTheme="dark">
          {showNavbar && <Navbar />}
          <main className="min-h-screen">
            <Switch>
              {/* Public Routes */}
              <Route path="/auth" component={SupabaseAuthPage} />
              
              {/* Protected Routes */}
              <ProtectedRouteWrapper path="/" component={HomePage} />
              <ProtectedRouteWrapper path="/admin" component={AdminPage} />
              <ProtectedRouteWrapper path="/leaderboard" component={LeaderboardPage} />
              <ProtectedRouteWrapper path="/crimes" component={CrimesPage} />
              <ProtectedRouteWrapper path="/casino" component={CasinoPage} />
              <ProtectedRouteWrapper path="/training" component={TrainingPage} />
              <ProtectedRouteWrapper path="/banking" component={BankingPage} />
              <ProtectedRouteWrapper path="/locations" component={LocationsPage} />
              <ProtectedRouteWrapper path="/jail" component={JailPage} />
              <ProtectedRouteWrapper path="/profile" component={ProfilePage} />
              <ProtectedRouteWrapper path="/player/:userId" component={PublicProfilePage} />
              <ProtectedRouteWrapper path="/gang" component={GangPage} />
              <ProtectedRouteWrapper path="/messages" component={MessagesPage} />
              <ProtectedRouteWrapper path="/drugs" component={DrugsPage} />
              <ProtectedRouteWrapper path="/challenges" component={ChallengesPage} />
              <ProtectedRouteWrapper path="/achievements" component={AchievementsPage} />
              <ProtectedRouteWrapper path="/friends" component={FriendsPage} />
              <ProtectedRouteWrapper path="/inventory" component={InventoryPage} />
              
              {/* 404 Route */}
              <Route component={NotFound} />
            </Switch>
          </main>
          <Toaster />
        </ThemeProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;