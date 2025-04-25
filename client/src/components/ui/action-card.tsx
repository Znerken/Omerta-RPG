import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Check, X } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  reward?: string;
  difficulty?: "easy" | "medium" | "hard";
  cooldown?: boolean;
  cooldownTime?: string;
  successRate?: number;
  risk?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  status?: "available" | "cooldown" | "locked";
  imageUrl?: string;
}

export function ActionCard({
  title,
  description,
  reward,
  difficulty = "medium",
  cooldown,
  cooldownTime,
  successRate,
  risk,
  onClick,
  disabled = false,
  className,
  status = "available",
  imageUrl,
}: ActionCardProps) {
  const difficultyColor = {
    easy: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusDisplay = {
    available: { label: "Available", icon: <Check className="h-4 w-4 mr-1" /> },
    cooldown: { label: "Cooldown", icon: <Clock className="h-4 w-4 mr-1" /> },
    locked: { label: "Locked", icon: <X className="h-4 w-4 mr-1" /> },
  };

  return (
    <Card
      className={cn(
        "game-card paper-texture overflow-hidden transition-all duration-300 bg-gradient-to-b from-card to-card/90",
        disabled && "opacity-75 cursor-not-allowed",
        className
      )}
    >
      {/* Card Header with Image */}
      {imageUrl && (
        <div 
          className="h-28 bg-cover bg-center relative" 
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute bottom-2 left-3">
            <h2 className="text-xl font-heading text-white">{title}</h2>
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={cn("border px-2 py-0.5", difficultyColor[difficulty])}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div>
        </div>
      )}
      
      {/* Card Body */}
      <div className={cn("p-4", !imageUrl && "pt-3")}>
        {!imageUrl && (
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-heading">{title}</h3>
            <Badge className={cn("border", difficultyColor[difficulty])}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {successRate !== undefined && (
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Success:</span>
              <span className={cn(
                successRate >= 70 ? "text-green-400" : 
                successRate >= 40 ? "text-yellow-400" : 
                "text-red-400"
              )}>
                {successRate}%
              </span>
            </div>
          )}
          
          {risk && (
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Risk:</span>
              <span className="text-red-400">{risk}</span>
            </div>
          )}
          
          {reward && (
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Reward:</span>
              <span className="text-green-400">{reward}</span>
            </div>
          )}
          
          {status === "cooldown" && cooldownTime && (
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Cooldown:</span>
              <span className="text-yellow-400">{cooldownTime}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="mt-auto">
          <Button 
            variant={status === "available" ? "default" : "outline"}
            className={cn(
              "w-full transition-all hover:shadow-glow",
              status === "available" ? "bg-primary hover:bg-primary/90" : 
              status === "cooldown" ? "border-yellow-500/50 text-yellow-400" : 
              "border-muted text-muted-foreground opacity-70"
            )}
            onClick={onClick}
            disabled={disabled || status !== "available"}
          >
            <div className="flex items-center justify-center">
              {statusDisplay[status].icon}
              {status === "available" ? "Execute" : statusDisplay[status].label}
            </div>
          </Button>
        </div>
      </div>
    </Card>
  );
}