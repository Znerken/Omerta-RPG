import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Medal, ChevronRight } from "lucide-react";

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  avatar?: string;
  value: number | string;
  isCurrentUser?: boolean;
}

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  valueLabel: string;
  maxEntries?: number;
  className?: string;
  onViewAll?: () => void;
  onEntryClick?: (entry: LeaderboardEntry) => void;
}

export function LeaderboardCard({
  title,
  entries,
  valueLabel,
  maxEntries = 5,
  className,
  onViewAll,
  onEntryClick,
}: LeaderboardCardProps) {
  // Limit the number of entries displayed
  const displayedEntries = entries.slice(0, maxEntries);
  
  // Determine medal colors for top positions
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-400";
      case 2: return "text-gray-300";
      case 3: return "text-amber-600";
      default: return "text-gray-500";
    }
  };

  return (
    <Card className={cn("card-mafia paper-texture", className)}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="game-section-heading text-lg font-heading">{title}</h3>
        </div>
        
        <div className="space-y-3">
          {displayedEntries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-sm transition-colors hover:bg-card/80",
                entry.isCurrentUser ? "bg-primary/10 border border-primary/30" : "border border-border/50",
                onEntryClick && "cursor-pointer"
              )}
              onClick={() => onEntryClick && onEntryClick(entry)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {entry.rank <= 3 ? (
                    <Medal className={cn("h-5 w-5", getMedalColor(entry.rank))} />
                  ) : (
                    <span className="text-sm text-muted-foreground">#{entry.rank}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Avatar 
                    className="h-7 w-7 border border-border/70"
                    src={entry.avatar}
                    alt={entry.name}
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    entry.isCurrentUser && "text-primary"
                  )}>
                    {entry.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm font-medium">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} 
                  <span className="text-xs text-muted-foreground ml-1">{valueLabel}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {entries.length > maxEntries && onViewAll && (
          <button
            onClick={onViewAll}
            className="w-full mt-3 text-sm text-center py-2 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            View all rankings <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
    </Card>
  );
}