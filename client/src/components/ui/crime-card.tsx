import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  TimerOff,
  ShieldAlert,
  Skull,
  BarChart,
  Sparkles
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
  const cashRange = `${formatCurrency(minCashReward)} - ${formatCurrency(maxCashReward)}`;
  const xpRange = `${minXpReward.toLocaleString()} - ${maxXpReward.toLocaleString()}`;
  
  // Calculate countdown if on cooldown
  const cooldownText = cooldown ? formatDistanceToNow(new Date(cooldown), { addSuffix: true }) : "";

  // Determine difficulty level based on success chance
  const getDifficulty = () => {
    if (successChance >= 70) return { 
      level: "Low Risk", 
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: <DollarSign className="h-3.5 w-3.5 mr-1" />
    };
    if (successChance >= 40) return { 
      level: "Medium Risk", 
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
    };
    return { 
      level: "High Risk", 
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: <Skull className="h-3.5 w-3.5 mr-1" />
    };
  };
  
  const difficulty = getDifficulty();

  // Format stat contribution percentage
  const getStatContribution = (weight: number) => {
    const total = strengthWeight + stealthWeight + charismaWeight + intelligenceWeight;
    return Math.round((weight / total) * 100);
  };

  // Calculate success chance indicator color and styles
  const getSuccessChanceColor = () => {
    if (successChance >= 70) return "text-green-400";
    if (successChance >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  // Calculate progress bar indicator gradient
  const getProgressGradient = () => {
    if (successChance >= 70) return "bg-gradient-to-r from-green-700 to-green-500";
    if (successChance >= 40) return "bg-gradient-to-r from-yellow-700 to-yellow-500";
    return "bg-gradient-to-r from-red-700 to-red-500";
  };

  return (
    <Card
      className={cn(
        "game-card paper-texture overflow-hidden border-0",
        isOnCooldown && "opacity-80",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
      <CardContent className="p-5 relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Badge 
            className={cn(
              "border text-xs flex items-center whitespace-nowrap", 
              difficulty.color
            )}
          >
            {difficulty.icon}
            {difficulty.level}
          </Badge>
        </div>
        
        {/* Success Chance Meter */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs flex items-center">
              <BarChart className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              <span>Success Chance</span>
            </div>
            <div className={cn(
              "text-xs font-mono font-medium",
              getSuccessChanceColor()
            )}>
              {successChance}%
            </div>
          </div>
          <Progress 
            value={successChance} 
            className="h-2 bg-muted/30 progress-bar-animated"
            indicatorClassName={getProgressGradient()}
          />
        </div>
        
        {/* Rewards & Risks */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center p-2 rounded-sm bg-green-500/10 border border-green-500/20">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-green-400 font-medium">Cash Reward</div>
              <div className="text-xs font-mono">{cashRange}</div>
            </div>
          </div>
          
          <div className="flex items-center p-2 rounded-sm bg-blue-500/10 border border-blue-500/20">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-blue-400 font-medium">XP Reward</div>
              <div className="text-xs font-mono">{xpRange}</div>
            </div>
          </div>
        </div>
        
        {/* Jail Risk */}
        <div className="mt-3 flex items-center p-2 rounded-sm bg-red-500/10 border border-red-500/20">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-red-400 font-medium">Jail Risk</div>
            <div className="text-xs font-mono">{jailRisk}%</div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-6 h-6 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-400/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  If caught, you'll be sent to jail and unable to perform most actions
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Required Skills */}
        <div className="mt-4">
          <div className="text-xs flex items-center mb-2">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            <span>Required Skills</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {strengthWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20 mb-1">
                        <Dumbbell className="h-4 w-4 text-red-400" />
                      </div>
                      <span className="text-xs font-mono">{getStatContribution(strengthWeight)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Strength: {userStats?.strength || 0}/100</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {stealthWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-1">
                        <Ghost className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="text-xs font-mono">{getStatContribution(stealthWeight)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Stealth: {userStats?.stealth || 0}/100</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {charismaWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-1">
                        <Speech className="h-4 w-4 text-yellow-400" />
                      </div>
                      <span className="text-xs font-mono">{getStatContribution(charismaWeight)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Charisma: {userStats?.charisma || 0}/100</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {intelligenceWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-1">
                        <Brain className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-xs font-mono">{getStatContribution(intelligenceWeight)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Intelligence: {userStats?.intelligence || 0}/100</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Action Button */}
      <CardFooter className="px-5 pb-5 pt-0">
        <Button
          variant={isOnCooldown ? "outline" : "default"}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-10",
            isOnCooldown ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/20" :
            disabled ? "bg-muted/20 hover:bg-muted/30" :
            "bg-primary/80 hover:bg-primary"
          )}
          disabled={disabled || isOnCooldown}
          onClick={() => onExecute && onExecute(id)}
        >
          {isOnCooldown ? (
            <>
              <Clock className="h-4 w-4" />
              <span>Available {cooldownText}</span>
            </>
          ) : disabled ? (
            <>
              <Lock className="h-4 w-4" />
              <span>Unavailable</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Execute Operation</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}