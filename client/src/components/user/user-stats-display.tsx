import React, { useMemo, memo } from 'react';
import { useGlobalStats } from '@/hooks/use-global-stats';
import AnimatedNumber from '@/components/ui/animated-number';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Shield, 
  BadgeCheck, 
  Zap, 
  BarChart3 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserStatsDisplayProps {
  className?: string;
  compact?: boolean;
  showTooltips?: boolean;
  showRank?: boolean;
  showRefresh?: boolean;
  variant?: 'default' | 'minimal' | 'fancy';
  maxWidth?: string;
}

/**
 * Component to display user stats with real-time animations
 * Memoized to prevent unnecessary re-renders
 */
const UserStatsDisplay: React.FC<UserStatsDisplayProps> = memo(({ 
  className,
  compact = false,
  showTooltips = true,
  showRank = true,
  showRefresh = true,
  variant = 'default',
  maxWidth
}) => {
  const { stats, refreshStats, isLoading } = useGlobalStats();
  
  // Calculate the next level XP requirements
  const { nextLevelXp, currentLevelProgress, isMaxLevel } = useMemo(() => {
    const level = stats.level;
    const xp = stats.xp;
    
    // Calculate current and next level XP thresholds
    const currentLevelXp = calculateXpForLevel(level);
    const nextLevelXpRequired = calculateXpForLevel(level + 1);
    
    const xpForCurrentLevel = xp - currentLevelXp;
    const xpRequiredForNextLevel = nextLevelXpRequired - currentLevelXp;
    
    // Percentage progress to next level
    const progress = (xpForCurrentLevel / xpRequiredForNextLevel) * 100;
    
    return {
      nextLevelXp: nextLevelXpRequired,
      currentLevelProgress: Math.min(progress, 100),
      isMaxLevel: level >= 100 // Assuming max level is 100
    };
  }, [stats.level, stats.xp]);

  // Format cash with dollar sign
  const formatCash = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Get the appropriate color for the cash display
  const cashColor = useMemo(() => {
    if (stats.cash >= 1000000) return "text-emerald-400";
    if (stats.cash >= 100000) return "text-amber-400";
    if (stats.cash >= 10000) return "text-yellow-400";
    return "text-yellow-300";
  }, [stats.cash]);

  // Get appropriate level color
  const levelColor = useMemo(() => {
    if (stats.level >= 50) return "text-purple-400";
    if (stats.level >= 30) return "text-indigo-400";
    if (stats.level >= 15) return "text-blue-400";
    return "text-cyan-400";
  }, [stats.level]);
  
  // Get appropriate respect color
  const respectColor = useMemo(() => {
    if (stats.respect >= 1000) return "text-red-400";
    if (stats.respect >= 500) return "text-orange-400";
    if (stats.respect >= 100) return "text-amber-400";
    return "text-amber-300";
  }, [stats.respect]);

  // If loading and we don't have stats yet, show skeleton
  if (isLoading && stats.cash === 0 && stats.xp === 0) {
    return (
      <Card className={cn("overflow-hidden", className)} style={maxWidth ? { maxWidth } : undefined}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact display for navbar etc.
  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-3", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("flex items-center font-medium", cashColor)}>
                <DollarSign className="h-4 w-4 mr-1" />
                <AnimatedNumber 
                  value={stats.cash} 
                  prefix="$"
                  threshold={10}
                  formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
                  className="text-sm"
                  springConfig="gentle"
                />
              </div>
            </TooltipTrigger>
            {showTooltips && (
              <TooltipContent side="bottom">
                <div className="text-xs">
                  Cash: ${stats.cash.toLocaleString()}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("flex items-center font-medium", levelColor)}>
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">{stats.level}</span>
              </div>
            </TooltipTrigger>
            {showTooltips && (
              <TooltipContent side="bottom">
                <div className="text-xs">
                  Level {stats.level} • {stats.xp.toLocaleString()} XP
                  {!isMaxLevel && (
                    <div>
                      {Math.round(currentLevelProgress)}% to level {stats.level + 1}
                    </div>
                  )}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
          
          {showRank && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center font-medium text-muted-foreground">
                  <Shield className="h-4 w-4 mr-1" />
                  <span className="text-sm">{getRankShort(stats.level)}</span>
                </div>
              </TooltipTrigger>
              {showTooltips && (
                <TooltipContent side="bottom">
                  <div className="text-xs">
                    Rank: {getRankName(stats.level)}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full stats display with variant styles
  const getCardContentClass = () => {
    switch (variant) {
      case 'minimal':
        return "p-3";
      case 'fancy':
        return "p-4 bg-gradient-to-br from-background to-muted/50";
      default:
        return "p-4";
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden", 
        variant === 'fancy' && "border-gold/30 shadow-lg",
        className
      )}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <CardContent className={getCardContentClass()}>
        {(showRefresh || variant === 'default' || variant === 'fancy') && (
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn(
              "font-semibold",
              variant === 'fancy' ? "text-xl text-gold-gradient" : "text-lg"
            )}>
              {variant === 'fancy' ? 'Criminal Status' : 'Your Stats'}
            </h3>
            {showRefresh && (
              <Button 
                variant={variant === 'fancy' ? 'outline' : 'ghost'} 
                size="icon" 
                onClick={refreshStats}
                disabled={isLoading}
                className={cn(
                  "h-8 w-8",
                  variant === 'fancy' && "border-gold/30 text-gold hover:text-gold/80 hover:bg-black/20"
                )}
              >
                <RefreshCw className={cn(
                  "h-4 w-4", 
                  isLoading && "animate-spin"
                )} />
                <span className="sr-only">Refresh stats</span>
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Cash */}
          <div className={cn(
            "space-y-1", 
            variant === 'fancy' && "bg-black/20 rounded-lg p-3 border border-gold/10"
          )}>
            <div className={cn(
              "text-sm font-medium flex items-center",
              variant === 'fancy' ? "text-gold/70" : "text-muted-foreground"
            )}>
              <DollarSign className="h-4 w-4 mr-1" />
              Cash
            </div>
            <div className={cn(
              "text-2xl font-bold",
              cashColor,
              variant === 'fancy' && "text-gold-gradient"
            )}>
              <AnimatedNumber 
                value={stats.cash} 
                prefix="$"
                threshold={100}
                springConfig={variant === 'fancy' ? 'gentle' : 'default'}
              />
            </div>
          </div>

          {/* Level */}
          <div className={cn(
            "space-y-1", 
            variant === 'fancy' && "bg-black/20 rounded-lg p-3 border border-gold/10"
          )}>
            <div className={cn(
              "text-sm font-medium flex items-center",
              variant === 'fancy' ? "text-gold/70" : "text-muted-foreground"
            )}>
              <TrendingUp className="h-4 w-4 mr-1" />
              Level
            </div>
            <div className={cn(
              "font-bold flex items-baseline",
              variant === 'fancy' ? "text-gold-gradient" : levelColor
            )}>
              <AnimatedNumber 
                value={stats.level} 
                className="text-2xl"
                springConfig={variant === 'fancy' ? 'gentle' : 'default'}
              />
              <span className={cn(
                "text-sm ml-2",
                variant === 'fancy' ? "text-gold/60" : "text-muted-foreground"
              )}>
                <AnimatedNumber 
                  value={stats.xp} 
                  threshold={10}
                  formatOptions={{ notation: stats.xp > 10000 ? 'compact' : 'standard' }}
                /> XP
              </span>
            </div>
            
            {/* Level progress bar */}
            {!isMaxLevel && variant === 'fancy' && (
              <div className="w-full bg-black/40 rounded-full h-1.5 mt-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" 
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Respect */}
          <div className={cn(
            "space-y-1", 
            variant === 'fancy' && "bg-black/20 rounded-lg p-3 border border-gold/10"
          )}>
            <div className={cn(
              "text-sm font-medium flex items-center",
              variant === 'fancy' ? "text-gold/70" : "text-muted-foreground"
            )}>
              <Award className="h-4 w-4 mr-1" />
              Respect
            </div>
            <div className={cn(
              "text-2xl font-bold",
              respectColor,
              variant === 'fancy' && "text-gold-gradient"
            )}>
              <AnimatedNumber 
                value={stats.respect} 
                springConfig={variant === 'fancy' ? 'gentle' : 'default'}
              />
            </div>
          </div>

          {/* Rank */}
          <div className={cn(
            "space-y-1", 
            variant === 'fancy' && "bg-black/20 rounded-lg p-3 border border-gold/10"
          )}>
            <div className={cn(
              "text-sm font-medium flex items-center",
              variant === 'fancy' ? "text-gold/70" : "text-muted-foreground"
            )}>
              <Shield className="h-4 w-4 mr-1" />
              Rank
            </div>
            <div className={cn(
              "text-2xl font-bold",
              variant === 'fancy' && "text-gold-gradient"
            )}>
              {getRankName(stats.level)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Calculate required XP for a level (example formula)
function calculateXpForLevel(level: number): number {
  // This is a simple formula - adjust as needed
  return Math.floor(100 * (level * (level + 1)) / 2);
}

// Helper function to get rank name based on level
function getRankName(level: number): string {
  if (level < 5) return "Rookie";
  if (level < 10) return "Thug";
  if (level < 15) return "Gangster";
  if (level < 20) return "Enforcer";
  if (level < 30) return "Captain";
  if (level < 40) return "Underboss";
  if (level < 50) return "Consigliere";
  return "Godfather";
}

// Helper function to get shortened rank name
function getRankShort(level: number): string {
  if (level < 5) return "Rk";
  if (level < 10) return "Th";
  if (level < 15) return "Gs";
  if (level < 20) return "Ef";
  if (level < 30) return "Cp";
  if (level < 40) return "Ub";
  if (level < 50) return "Cs";
  return "GF";
}

export default UserStatsDisplay;