import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserAvatar } from "./UserAvatar";
import { StatDisplay } from "./StatDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Medal, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MiniProfileProps {
  variant?: "sidebar" | "navbar";
  className?: string;
}

export function MiniProfile({ 
  variant = "sidebar",
  className = ""
}: MiniProfileProps) {
  // State to toggle stats display
  const [showStats, setShowStats] = useState(false);
  
  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/profile");
      return await response.json();
    }
  });
  
  // Fetch bank accounts data
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/banking/accounts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/banking/accounts");
      return await response.json();
    }
  });
  
  const isLoading = profileLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }
  
  // Calculate total bank balance across all accounts
  const totalBankBalance = accounts?.reduce((total: number, account: { balance: number }) => total + account.balance, 0) || 0;

  const { username, level, cash, respect, isAdmin, avatar } = profile;
  
  // Format currency helper function
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };
  
  // Navbar variant is horizontal, sidebar variant is more compact
  if (variant === "navbar") {
    return (
      <div className={cn("relative flex items-center p-2 rounded-lg bg-black/20 border border-border/50 hover:bg-black/30 transition", className)}>
        <UserAvatar 
          username={username} 
          avatarUrl={avatar} 
          size="md"
          withBorder={true}
          withRing={true}
          borderColor="border-background" 
          ringColor="ring-gold/30"
        />
        
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <p className="font-medium text-sm">{username}</p>
            {isAdmin && (
              <Badge variant="outline" className="ml-2 py-0 h-5">
                <Shield className="h-3 w-3 mr-1 text-primary" />
                Admin
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Medal className="h-3.5 w-3.5 mr-1 text-gold" />
            Level {level}
          </div>
          
          {/* Money info */}
          <div className="flex items-center mt-1 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-emerald-400">
                    {formatCurrency(cash)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Cash on hand</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <span className="text-muted-foreground text-xs">•</span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-blue-400">
                    {formatCurrency(totalBankBalance)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Total bank balance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Stats accordion */}
          {showStats && profile.stats && (
            <div className="mt-3 pt-2 border-t border-border/20">
              <StatDisplay 
                stats={profile.stats} 
                size="xs" 
                showValues={true} 
                showLabels={false}
                compact={true}
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 mb-1"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Sidebar variant (default)
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-3">
        <UserAvatar 
          username={username} 
          avatarUrl={avatar} 
          size="md"
          withBorder={true}
          withRing={true}
        />
        <div className="flex-1">
          <div className="flex items-center">
            <p className="font-medium text-sm">{username}</p>
            {isAdmin && (
              <Badge variant="outline" className="ml-2 py-0 h-5">
                <Shield className="h-3 w-3 mr-1 text-primary" />
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Medal className="h-3 w-3 mr-1 text-gold" />
              <span className="text-xs text-muted-foreground">Level {level}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-1"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Money Info */}
      <div className="mt-2 bg-black/20 rounded-md p-2 grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Cash</div>
          <div className="text-sm font-medium text-emerald-400">{formatCurrency(cash)}</div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">Bank</div>
          <div className="text-sm font-medium text-blue-400">{formatCurrency(totalBankBalance)}</div>
        </div>
      </div>
      
      {/* Stats accordion */}
      {showStats && profile.stats && (
        <div className="mt-3 pt-3 pl-10 border-t border-border/10">
          <StatDisplay 
            stats={profile.stats} 
            size="xs" 
            showValues={true} 
            showLabels={true}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}