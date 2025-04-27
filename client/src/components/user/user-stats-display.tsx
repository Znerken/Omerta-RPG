import React from 'react';
import { useGlobalStats } from '@/hooks/use-global-stats';
import AnimatedNumber from '@/components/ui/animated-number';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, DollarSign, TrendingUp, Award, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserStatsDisplayProps {
  className?: string;
  compact?: boolean;
}

/**
 * Component to display user stats with real-time animations
 */
const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ 
  className,
  compact = false
}) => {
  const { stats, refreshStats, isLoading } = useGlobalStats();

  // Format cash with dollar sign
  const formatCash = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // If loading and we don't have stats yet, show skeleton
  if (isLoading && stats.cash === 0 && stats.xp === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
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
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center text-yellow-400 font-medium">
          <DollarSign className="h-4 w-4 mr-1" />
          <AnimatedNumber 
            value={stats.cash} 
            formatter={formatCash} 
            className="text-sm"
          />
        </div>
        <div className="flex items-center text-blue-400 font-medium">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm">{stats.level}</span>
        </div>
      </div>
    );
  }

  // Full stats display
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Stats</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshStats}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn(
              "h-4 w-4", 
              isLoading && "animate-spin"
            )} />
            <span className="sr-only">Refresh stats</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Cash
            </div>
            <div className="text-2xl font-bold">
              <AnimatedNumber 
                value={stats.cash} 
                formatter={formatCash} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Level
            </div>
            <div className="text-2xl font-bold flex items-baseline">
              <AnimatedNumber value={stats.level} />
              <span className="text-sm text-muted-foreground ml-2">
                <AnimatedNumber value={stats.xp} /> XP
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center">
              <Award className="h-4 w-4 mr-1" />
              Respect
            </div>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={stats.respect} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Rank
            </div>
            <div className="text-2xl font-bold">
              {getRankName(stats.level)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

export default UserStatsDisplay;