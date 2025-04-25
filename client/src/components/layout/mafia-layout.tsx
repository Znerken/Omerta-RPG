import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Users,
  Target,
  Activity,
  ShoppingBag,
  Trophy,
  Mail,
  User,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MafiaLayoutProps {
  children: React.ReactNode;
}

export function MafiaLayout({ children }: MafiaLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <Activity className="h-5 w-5 mr-3" />,
    },
    {
      name: "Crimes",
      path: "/crimes",
      icon: <Briefcase className="h-5 w-5 mr-3" />,
    },
    {
      name: "Gang",
      path: "/gang",
      icon: <Users className="h-5 w-5 mr-3" />,
    },
    {
      name: "Training",
      path: "/training",
      icon: <Target className="h-5 w-5 mr-3" />,
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: <ShoppingBag className="h-5 w-5 mr-3" />,
    },
    {
      name: "Leaderboard",
      path: "/leaderboard",
      icon: <Trophy className="h-5 w-5 mr-3" />,
    },
    {
      name: "Messages",
      path: "/messages",
      icon: <Mail className="h-5 w-5 mr-3" />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <User className="h-5 w-5 mr-3" />,
    },
    {
      name: "Jail",
      path: "/jail",
      icon: <Shield className="h-5 w-5 mr-3" />,
    },
  ];

  // Only show jail link if the user is jailed
  const filteredNavItems = user?.isJailed
    ? navItems
    : navItems.filter((item) => item.name !== "Jail");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile */}
      <aside
        className={cn(
          "w-64 bg-card shadow-lg hidden md:block border-r border-border overflow-y-auto pb-12",
          "transition-all duration-300 ease-in-out z-30"
        )}
      >
        <div className="px-6 py-6">
          <h1 className="text-2xl text-gold-gradient pb-2">Mafia Empire</h1>
          <div className="h-px bg-gradient-to-r from-secondary/5 via-secondary/80 to-secondary/5 mb-6"></div>
          
          {user && (
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{user.username}</p>
                <div className="flex space-x-2 text-xs text-muted-foreground">
                  <span>Level {user.level}</span>
                  <span className="text-primary">$
                  {new Intl.NumberFormat().format(user.cash)}</span>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {filteredNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.icon}
                  {item.name}
                </a>
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
                <a
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-sm",
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </a>
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