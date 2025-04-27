import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAchievements } from "@/hooks/use-achievements";
import { useMessages } from "@/hooks/use-messages";
import { useNotification } from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  Briefcase, 
  CheckCircle,
  Dumbbell, 
  Users, 
  Lock, 
  Package, 
  MailIcon, 
  Trophy, 
  Menu, 
  X, 
  LogOut,
  Shield,
  Award,
  Pill,
  DollarSign,
  UserPlus,
  Bell,
  BellOff,
  Gauge,
  Zap
} from "lucide-react";
import { 
  TommyGunIcon, 
  FedoraIcon, 
  MoneyBriefcaseIcon 
} from "@/components/ui/mafia-icons";
import { NotificationList } from "@/components/notification/notification-list";
import { ConnectionStatus } from "@/components/social/ConnectionStatus";
import { SocialSidebar } from "@/components/social/SocialSidebar";
import { MiniProfile } from "@/components/profile/MiniProfile";
import UserStatsDisplay from "@/components/user/user-stats-display";

// Organize nav items into categories
const personalItems = [
  { name: "Dashboard", path: "/", icon: <Home className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Profile", path: "/profile", icon: <User className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Achievements", path: "/achievements", icon: <Award className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Jail", path: "/jail", icon: <Lock className="h-4.5 w-4.5 mr-2.5" /> },
];

const activityItems = [
  { name: "Crimes", path: "/crimes", icon: <Briefcase className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Challenges", path: "/challenges", icon: <CheckCircle className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Training", path: "/training", icon: <Dumbbell className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Gangs", path: "/gang", icon: <Users className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Drugs", path: "/drugs", icon: <Pill className="h-4.5 w-4.5 mr-2.5" /> },
];

const economyItems = [
  { name: "Inventory", path: "/inventory", icon: <Package className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Banking", path: "/banking", icon: <MoneyBriefcaseIcon size="sm" className="mr-2.5" /> },
  { name: "Casino", path: "/casino", icon: <DollarSign className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Noir Casino", path: "/casino-new", icon: <Zap className="h-4.5 w-4.5 mr-2.5 text-amber-400" /> },
  { name: "Leaderboard", path: "/leaderboard", icon: <Trophy className="h-4.5 w-4.5 mr-2.5" /> },
];

const socialNavItems = [
  { name: "Friends", path: "/friends", icon: <UserPlus className="h-4.5 w-4.5 mr-2.5" /> },
  { name: "Messages", path: "/messages", icon: <MailIcon className="h-4.5 w-4.5 mr-2.5" /> },
];

// Development items moved to admin panel
const developmentItems = [];

export interface MafiaLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function MafiaLayout({ children, title, description }: MafiaLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { unviewedCount, hasNewAchievements } = useAchievements();
  const { unreadCount } = useMessages();
  const { notificationsEnabled, toggleNotifications } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Create admin menu item if user is admin
  const adminMenuItem = {
    name: "Admin Panel",
    path: "/admin",
    icon: <Shield className="h-4.5 w-4.5 mr-2.5" />
  };

  // We don't need these anymore as we're using category arrays
  const showJail = user && user.isJailed;
  
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar - Main Navigation */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border h-screen sticky top-0 bg-gradient-to-b from-background to-background/95">
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="mb-6 flex flex-col items-center">
            <div className="p-3 bg-black/30 rounded-lg border border-gold/20 shadow-lg mb-4 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://cdn.glitch.global/bbff0cf5-8266-486e-ad7e-2f94bce3e386/leather-texture.jpg?v=1704455693446')] opacity-20 mix-blend-overlay"></div>
              <h1 className="text-3xl font-serif tracking-widest text-center font-bold text-gold-gradient mb-1">
                OMERTÀ
              </h1>
              <div className="h-px bg-gradient-to-r from-gold/10 via-gold/50 to-gold/10 my-2"></div>
              <div className="flex items-center justify-center">
                <TommyGunIcon className="h-5 w-5 mr-2 text-gold/70" />
                <p className="text-xs text-muted-foreground/90 italic">The code of silence</p>
              </div>
            </div>
          </div>
          
          {user && (
            <div className="mb-5">
              <div className="w-full">
                <MiniProfile variant="sidebar" className="w-full" />
                <div className="mt-3">
                  <UserStatsDisplay compact={true} className="px-2 py-2" />
                </div>
              </div>
            </div>
          )}
          
          <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 my-5"></div>
          
          {/* Personal Category */}
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
              Personal
            </h3>
            
            <nav className="space-y-1">
              {personalItems.map((item) => (
                item.path !== "/jail" || (user && user.isJailed) ? (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        location === item.path
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                      )}
                    >
                      {item.icon}
                      {item.name}
                      
                      {/* Display badges for notifications */}
                      {item.path === "/achievements" && hasNewAchievements && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] text-xs"
                        >
                          {unviewedCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ) : null
              ))}
            </nav>
          </div>
          
          {/* Activities Category */}
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
              Activities
            </h3>
            
            <nav className="space-y-1">
              {activityItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      location === item.path
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Economy Category */}
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
              Economy
            </h3>
            
            <nav className="space-y-1">
              {economyItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      location === item.path
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Development Category moved to Admin Panel */}
          
          {/* Admin Section */}
          {user?.isAdmin && (
            <div className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-destructive/70 mb-3 px-1.5">
                Administration
              </h3>
              
              <nav className="space-y-1">
                <Link href="/admin">
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      location === "/admin"
                        ? "bg-destructive/10 text-destructive border-l-2 border-destructive"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-l-2 border-transparent"
                    )}
                  >
                    {adminMenuItem.icon}
                    {adminMenuItem.name}
                  </div>
                </Link>
              </nav>
            </div>
          )}
        </div>
        
        <div className="px-4 mt-auto mb-4">
          <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 mb-4"></div>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
          >
            <LogOut className="h-4 w-4 mr-2.5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <h1 className="text-xl text-gold-gradient font-serif tracking-widest">OMERTÀ</h1>
          <div className="flex items-center space-x-2">
            {user && <MiniProfile variant="navbar" className="max-w-[60%]" />}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 pt-16">
          <div className="px-4 py-4 overflow-y-auto scrollbar-hide h-[calc(100%-4rem)]">
            
            {/* User Stats (Mobile) */}
            {user && (
              <div className="mb-4 bg-muted/30 rounded-lg px-3 py-2">
                <UserStatsDisplay compact={true} className="my-2" />
              </div>
            )}
            {/* Personal Category */}
            <div className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
                Personal
              </h3>
              
              <nav className="space-y-1">
                {personalItems.map((item) => (
                  item.path !== "/jail" || (user && user.isJailed) ? (
                    <Link key={item.path} href={item.path}>
                      <div
                        className={cn(
                          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          location === item.path
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                        
                        {/* Display badges for notifications */}
                        {item.path === "/achievements" && hasNewAchievements && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] text-xs"
                          >
                            {unviewedCount}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ) : null
                ))}
              </nav>
            </div>
            
            {/* Activities Category */}
            <div className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
                Activities
              </h3>
              
              <nav className="space-y-1">
                {activityItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        location === item.path
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Economy Category */}
            <div className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
                Economy
              </h3>
              
              <nav className="space-y-1">
                {economyItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        location === item.path
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Social Category */}
            <div className="mb-5">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-3 px-1.5">
                Social
              </h3>
              
              <nav className="space-y-1">
                {socialNavItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        location === item.path
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                      
                      {/* Display badge for unread messages */}
                      {item.path === "/messages" && unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Development Category moved to Admin Panel */}
            
            {/* Admin Section */}
            {user?.isAdmin && (
              <div className="mb-5">
                <h3 className="text-[11px] uppercase tracking-wider font-medium text-destructive/70 mb-3 px-1.5">
                  Administration
                </h3>
                
                <nav className="space-y-1">
                  <Link href="/admin">
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        location === "/admin"
                          ? "bg-destructive/10 text-destructive border-l-2 border-destructive"
                          : "text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-l-2 border-transparent"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {adminMenuItem.icon}
                      {adminMenuItem.name}
                    </div>
                  </Link>
                </nav>
              </div>
            )}
            
            <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 my-4"></div>
            
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10 mt-3"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
          {/* Mobile only notification bell (top-right of screen) */}
          {user && (
            <div className="md:hidden fixed top-20 right-4 z-30 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                title={notificationsEnabled ? "Turn off notifications" : "Turn on notifications"}
                className="h-9 w-9 text-gold/70 hover:text-gold hover:bg-black/30 rounded-full bg-black/20 shadow-md border border-gold/10"
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gold/70 hover:text-gold hover:bg-black/30 rounded-full bg-black/20 shadow-md border border-gold/10"
              >
                <NotificationList>
                  <Bell className="h-4 w-4" />
                </NotificationList>
              </Button>
            </div>
          )}
          {/* Page title and description */}
          {(title || description) && (
            <div className="mb-6">
              {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
              {description && <p className="text-muted-foreground">{description}</p>}
              <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 mt-4"></div>
            </div>
          )}
          
          {children}
        </div>
      </main>

      {/* Right Sidebar - Social */}
      <aside className="hidden md:flex md:w-64 flex-col border-l border-border h-screen sticky top-0 bg-gradient-to-b from-background to-background/95">
        <div className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Social Network</span>
              </h2>
              
              {/* Desktop notification bell */}
              {user && (
                <div className="flex items-center space-x-1">
                  {/* Notification toggle button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleNotifications}
                    title={notificationsEnabled ? "Turn off notifications" : "Turn on notifications"}
                    className="h-8 w-8 text-gold/70 hover:text-gold hover:bg-black/30 rounded-full"
                  >
                    {notificationsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <NotificationList>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gold/70 hover:text-gold hover:bg-black/30 rounded-full"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </NotificationList>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ConnectionStatus />
                <span className="text-xs text-muted-foreground">Network Status</span>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              {socialNavItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      location === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {item.icon}
                    {item.name}
                    
                    {/* Display badge for unread messages */}
                    {item.path === "/messages" && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-border/5 via-border to-border/5 my-4"></div>
          
          {/* Friends Section */}
          <div className="mt-6">
            <SocialSidebar />
          </div>
        </div>
      </aside>
    </div>
  );
}