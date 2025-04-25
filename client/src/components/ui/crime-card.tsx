import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Zap,
  Dumbbell,
  Ghost,
  Brain,
  Speech,
  Lock,
  CheckCircle2,
  TimerOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CrimeCardProps {
  id: number;
  name: string;
  description: string;
  minCashReward: number;
  maxCashReward: number;
  minXpReward: number;
  maxXpReward: number;
  jailRisk: number;
  successChance: number;
  cooldown?: Date;
  isOnCooldown?: boolean;
  // Stat weights
  strengthWeight: number;
  stealthWeight: number;
  charismaWeight: number;
  intelligenceWeight: number;
  // User stats for comparison
  userStats?: {
    strength: number;
    stealth: number;
    charisma: number;
    intelligence: number;
  };
  onExecute?: (id: number) => void;
  className?: string;
  disabled?: boolean;
}

export function CrimeCard({
  id,
  name,
  description,
  minCashReward,
  maxCashReward,
  minXpReward,
  maxXpReward,
  jailRisk,
  successChance,
  cooldown,
  isOnCooldown = false,
  strengthWeight,
  stealthWeight,
  charismaWeight,
  intelligenceWeight,
  userStats,
  onExecute,
  className,
  disabled = false,
}: CrimeCardProps) {
  // Format rewards
  const cashRange = `$${minCashReward.toLocaleString()} - $${maxCashReward.toLocaleString()}`;
  const xpRange = `${minXpReward.toLocaleString()} - ${maxXpReward.toLocaleString()} XP`;
  
  // Calculate countdown if on cooldown
  const cooldownText = cooldown ? formatDistanceToNow(new Date(cooldown), { addSuffix: true }) : "";

  // Determine difficulty level based on success chance
  const getDifficulty = () => {
    if (successChance >= 70) return { level: "Easy", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    if (successChance >= 40) return { level: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    return { level: "Hard", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  };
  
  const difficulty = getDifficulty();

  // Format stat contribution percentage
  const getStatContribution = (weight: number) => {
    const total = strengthWeight + stealthWeight + charismaWeight + intelligenceWeight;
    return Math.round((weight / total) * 100);
  };

  return (
    <Card
      className={cn(
        "game-card paper-texture overflow-hidden transition-all duration-300",
        isOnCooldown && "opacity-80",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-heading text-gold-gradient">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Badge className={cn("border", difficulty.color)}>
            {difficulty.level}
          </Badge>
        </div>
        
        {/* Success Chance Meter */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs text-muted-foreground">Success Chance</div>
            <div className={cn(
              "text-xs font-medium",
              successChance >= 70 ? "text-green-400" : 
              successChance >= 40 ? "text-yellow-400" : 
              "text-red-400"
            )}>
              {successChance}%
            </div>
          </div>
          <Progress 
            value={successChance} 
            className={cn(
              "h-1.5 progress-bar-animated",
              successChance >= 70 ? "bg-green-900" : 
              successChance >= 40 ? "bg-yellow-900" : 
              "bg-red-900"
            )}
          />
        </div>
        
        {/* Rewards & Risks */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2 p-2 rounded-sm bg-green-500/10">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">Cash</div>
              <div className="text-xs font-medium text-green-400">{cashRange}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-sm bg-blue-500/10">
            <Zap className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">XP</div>
              <div className="text-xs font-medium text-blue-400">{xpRange}</div>
            </div>
          </div>
        </div>
        
        {/* Jail Risk */}
        <div className="mt-3 flex items-center gap-2 p-2 rounded-sm bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <div>
            <div className="text-xs text-muted-foreground">Jail Risk</div>
            <div className="text-xs font-medium text-red-400">{jailRisk}%</div>
          </div>
        </div>
        
        {/* Required Skills */}
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Required Skills</div>
          <div className="grid grid-cols-4 gap-2">
            {strengthWeight > 0 && (
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-red-500/10 mb-1">
                  <Dumbbell className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-xs">{getStatContribution(strengthWeight)}%</span>
              </div>
            )}
            
            {stealthWeight > 0 && (
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-purple-500/10 mb-1">
                  <Ghost className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <span className="text-xs">{getStatContribution(stealthWeight)}%</span>
              </div>
            )}
            
            {charismaWeight > 0 && (
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-yellow-500/10 mb-1">
                  <Speech className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <span className="text-xs">{getStatContribution(charismaWeight)}%</span>
              </div>
            )}
            
            {intelligenceWeight > 0 && (
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-blue-500/10 mb-1">
                  <Brain className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-xs">{getStatContribution(intelligenceWeight)}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="mt-4">
          <Button
            variant={isOnCooldown ? "outline" : "default"}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              !isOnCooldown && "hover:shadow-glow"
            )}
            disabled={disabled || isOnCooldown}
            onClick={() => onExecute && onExecute(id)}
          >
            {isOnCooldown ? (
              <>
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>Cooldown {cooldownText}</span>
              </>
            ) : disabled ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Execute Crime</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}