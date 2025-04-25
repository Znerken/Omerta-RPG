import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  Briefcase, 
  Dumbbell, 
  Users, 
  Lock, 
  Package, 
  MailIcon, 
  Trophy, 
  Menu, 
  X, 
  LogOut 
} from "lucide-react";
import { 
  TommyGunIcon, 
  FedoraIcon, 
  MoneyBriefcaseIcon 
} from "@/components/ui/mafia-icons";

const navItems = [
  { name: "Dashboard", path: "/", icon: <Home className="h-5 w-5 mr-3" /> },
  { name: "Profile", path: "/profile", icon: <User className="h-5 w-5 mr-3" /> },
  { name: "Crimes", path: "/crimes", icon: <Briefcase className="h-5 w-5 mr-3" /> },
  { name: "Training", path: "/training", icon: <Dumbbell className="h-5 w-5 mr-3" /> },
  { name: "Gang", path: "/gang", icon: <Users className="h-5 w-5 mr-3" /> },
  { name: "Jail", path: "/jail", icon: <Lock className="h-5 w-5 mr-3" /> },
  { name: "Inventory", path: "/inventory", icon: <Package className="h-5 w-5 mr-3" /> },
  { name: "Banking", path: "/banking", icon: <MoneyBriefcaseIcon className="h-5 w-5 mr-3" /> },
  { name: "Messages", path: "/messages", icon: <MailIcon className="h-5 w-5 mr-3" /> },
  { name: "Leaderboard", path: "/leaderboard", icon: <Trophy className="h-5 w-5 mr-3" /> },
];

export function MafiaLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Filter out "Jail" if user is not jailed
  const filteredNavItems = navItems.filter(item => {
    if (item.path === "/jail" && user && !user.isJailed) {
      return false;
    }
    return true;
  });
  
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border h-screen sticky top-0">
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl text-gold-gradient font-heading mb-2">
              Mafia Empire
            </h1>
            <div className="flex items-center">
              <TommyGunIcon className="h-5 w-5 mr-2 text-primary" />
              <p className="text-xs text-muted-foreground">Rise to power. Rule the streets.</p>
            </div>
          </div>
          
          {user && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">Level {user.level}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {filteredNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors cursor-pointer",
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-6 mt-6">
          <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 mb-6"></div>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl text-gold-gradient">Mafia Empire</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 pt-16">
          <nav className="px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-sm cursor-pointer",
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            ))}
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start text-destructive mt-4 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}