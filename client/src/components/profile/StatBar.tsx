import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StatBarProps = {
  label: string;
  value: number;
  max?: number; 
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  color?: "red" | "green" | "blue" | "yellow" | "primary";
  className?: string;
  showValue?: boolean;
  animate?: boolean;
};

/**
 * StatBar component used to display character stats with various styles
 */
export function StatBar({
  label,
  value,
  max = 100,
  size = "md",
  icon,
  color = "primary",
  className,
  showValue = true,
  animate = false,
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Size classes
  const sizeClasses = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3",
  };
  
  // Text size classes
  const textSizeClasses = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  // Color classes
  const colorClasses = {
    red: "from-red-700 to-red-500",
    green: "from-green-700 to-green-500",
    blue: "from-blue-700 to-blue-500",
    yellow: "from-yellow-700 to-yellow-500",
    primary: "from-primary/70 to-primary",
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          {icon && <span className="mr-1.5">{icon}</span>}
          <span className={cn("text-gray-300", textSizeClasses[size])}>
            {label}
          </span>
        </div>
        {showValue && (
          <span className={cn("font-mono", textSizeClasses[size])}>
            {value}/{max}
          </span>
        )}
      </div>
      <Progress 
        value={percentage} 
        className={cn(sizeClasses[size], animate ? "progress-bar-animated" : "")} 
        indicatorClassName={cn("bg-gradient-to-r", colorClasses[color])}
      />
    </div>
  );
}