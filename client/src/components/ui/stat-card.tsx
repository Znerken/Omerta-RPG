import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "card-mafia overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:translate-y-[-2px]",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          {icon && (
            <div className="p-2 rounded-sm bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        
        {(trend || description) && (
          <div className="mt-3 flex items-center space-x-2">
            {trend && (
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
                {trendValue}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ProgressStatCardProps extends Omit<StatCardProps, "trend" | "trendValue"> {
  progress: number; // 0-100
  progressColor?: string;
}

export function ProgressStatCard({
  title,
  value,
  description,
  icon,
  progress,
  progressColor = "bg-primary",
  className,
  onClick,
}: ProgressStatCardProps) {
  return (
    <Card
      className={cn(
        "card-mafia overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:translate-y-[-2px]",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          {icon && (
            <div className="p-2 rounded-sm bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-1.5 mb-1">
            <div
              className={cn("h-1.5 rounded-full", progressColor)}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}