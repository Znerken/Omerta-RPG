import React from "react";
import { StatBar } from "./StatBar";
import { Dumbbell, Footprints, SmilePlus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  strength: number;
  stealth: number;
  charisma: number;
  intelligence: number;
};

type StatDisplayProps = {
  stats: Stats;
  size?: "xs" | "sm" | "md" | "lg";
  showLabels?: boolean;
  showValues?: boolean;
  className?: string;
  compact?: boolean;
};

/**
 * StatDisplay component to show all character stats in one component
 */
export function StatDisplay({
  stats,
  size = "md",
  showLabels = true,
  showValues = true,
  className,
  compact = false,
}: StatDisplayProps) {
  // Determine spacing based on compact mode
  const spacing = compact ? "space-y-1.5" : "space-y-3.5";
  
  return (
    <div className={cn(spacing, "mt-2", className)}>
      <StatBar
        label={showLabels ? "Strength" : ""}
        value={stats.strength}
        size={size}
        icon={<Dumbbell className="h-4 w-4 text-red-500" />}
        color="red"
        showValue={showValues}
        animate={true}
      />
      
      <StatBar
        label={showLabels ? "Stealth" : ""}
        value={stats.stealth}
        size={size}
        icon={<Footprints className="h-4 w-4 text-green-500" />}
        color="green"
        showValue={showValues}
        animate={true}
      />
      
      <StatBar
        label={showLabels ? "Charisma" : ""}
        value={stats.charisma}
        size={size}
        icon={<SmilePlus className="h-4 w-4 text-blue-500" />}
        color="blue"
        showValue={showValues}
        animate={true}
      />
      
      <StatBar
        label={showLabels ? "Intelligence" : ""}
        value={stats.intelligence}
        size={size}
        icon={<BookOpen className="h-4 w-4 text-yellow-500" />}
        color="yellow"
        showValue={showValues}
        animate={true}
      />
    </div>
  );
}