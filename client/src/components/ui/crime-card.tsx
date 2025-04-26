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
  Sparkles,
  Briefcase,
  Timer
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
        "game-card paper-texture overflow-hidden border-0 relative shadow-md dark-card text-shadow-sm",
        isOnCooldown && "opacity-80",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* Stylized mafia-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/patterns/dark-leather.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      
      {/* Crime ID Tag - adds a nice mafia file style */}
      <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 -rotate-12 bg-red-800/80 text-xs text-white px-3 py-1 font-mono shadow-md z-10">
        CASE #{id.toString().padStart(3, '0')}
      </div>
      
      <CardContent className="p-5 relative">
        {/* Stylized Title Section with Mafia-themed accents */}
        <div className="flex justify-between items-start mb-4 border-b border-primary/20 pb-3">
          <div>
            <h3 className="text-lg font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/70 drop-shadow-glow text-shadow-title">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 italic">{description}</p>
          </div>
          <Badge 
            className={cn(
              "border text-xs flex items-center whitespace-nowrap shadow-glow", 
              difficulty.color
            )}
          >
            {difficulty.icon}
            {difficulty.level}
          </Badge>
        </div>
        
        {/* Success Chance Meter - with enhanced styling */}
        <div className="mt-4 bg-black/30 p-3 rounded-md border border-primary/10">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs flex items-center font-heading tracking-wide">
              <BarChart className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>SUCCESS PROBABILITY</span>
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
            className="h-2.5 bg-muted/30 progress-bar-animated rounded-none"
            indicatorClassName={`${getProgressGradient()} shadow-glow`}
          />
          
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
            <div className="flex items-center">
              <Timer className="h-3 w-3 mr-1 text-primary/70" />
              <span>PLANNING: {Math.floor(Math.random() * 24) + 2}hrs</span>
            </div>
            <div className="flex items-center justify-end">
              <Briefcase className="h-3 w-3 mr-1 text-primary/70" />
              <span>COMPLEXITY: {['LOW', 'MODERATE', 'HIGH'][Math.min(2, Math.floor((100 - successChance) / 33))]}</span>
            </div>
          </div>
        </div>
        
        {/* Rewards & Risks - with file folder styling */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-sm border-l-4 border-green-500 p-3 shadow-md transform transition-transform hover:translate-x-1">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-2 border border-green-500/40">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-green-400 font-medium uppercase tracking-wider">Cash Reward</div>
                <div className="text-xs font-mono mt-0.5">{cashRange}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/40 rounded-sm border-l-4 border-blue-500 p-3 shadow-md transform transition-transform hover:translate-x-1">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2 border border-blue-500/40">
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-blue-400 font-medium uppercase tracking-wider">XP Reward</div>
                <div className="text-xs font-mono mt-0.5">{xpRange}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Jail Risk - with police file styling */}
        <div className="mt-3 bg-black/40 rounded-sm border-l-4 border-red-500 p-3 shadow-md">
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-2 border border-red-500/40">
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-red-400 font-medium uppercase tracking-wider flex items-center">
                Law Enforcement Risk
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3.5 w-3.5 ml-1 text-red-400/60" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/80 border border-red-500/30 shadow-glow-red">
                      <p className="text-xs">
                        If caught, you'll be sent to jail and unable to perform most actions
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-4 mt-0.5">
                <div className="text-xs font-mono">{jailRisk}%</div>
                <div className="flex-1 h-1.5 bg-red-900/20 rounded-sm overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-900 to-red-500" 
                    style={{ width: `${jailRisk}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Required Skills */}
        <div className="mt-5 bg-black/30 p-3 rounded-md border border-primary/10">
          <div className="text-xs flex items-center mb-3 uppercase tracking-wider font-heading text-primary/90">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            <span>Required Expertise</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {strengthWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center bg-black/30 py-2 px-1 rounded-sm border border-red-500/20 transition-colors hover:bg-black/50">
                      <Dumbbell className="h-5 w-5 text-red-400 mb-1" />
                      <span className="text-xs font-mono text-red-300">{getStatContribution(strengthWeight)}%</span>
                      <span className="text-[10px] mt-1 uppercase tracking-wide text-red-300/70">Force</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/80 border border-red-500/30">
                    <p className="text-xs flex justify-between w-full">
                      <span>Your Strength:</span> 
                      <span className="font-mono ml-2">{userStats?.strength || 0}/100</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {stealthWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center bg-black/30 py-2 px-1 rounded-sm border border-purple-500/20 transition-colors hover:bg-black/50">
                      <Ghost className="h-5 w-5 text-purple-400 mb-1" />
                      <span className="text-xs font-mono text-purple-300">{getStatContribution(stealthWeight)}%</span>
                      <span className="text-[10px] mt-1 uppercase tracking-wide text-purple-300/70">Shadow</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/80 border border-purple-500/30">
                    <p className="text-xs flex justify-between w-full">
                      <span>Your Stealth:</span> 
                      <span className="font-mono ml-2">{userStats?.stealth || 0}/100</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {charismaWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center bg-black/30 py-2 px-1 rounded-sm border border-yellow-500/20 transition-colors hover:bg-black/50">
                      <Speech className="h-5 w-5 text-yellow-400 mb-1" />
                      <span className="text-xs font-mono text-yellow-300">{getStatContribution(charismaWeight)}%</span>
                      <span className="text-[10px] mt-1 uppercase tracking-wide text-yellow-300/70">Talk</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/80 border border-yellow-500/30">
                    <p className="text-xs flex justify-between w-full">
                      <span>Your Charisma:</span> 
                      <span className="font-mono ml-2">{userStats?.charisma || 0}/100</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {intelligenceWeight > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center bg-black/30 py-2 px-1 rounded-sm border border-blue-500/20 transition-colors hover:bg-black/50">
                      <Brain className="h-5 w-5 text-blue-400 mb-1" />
                      <span className="text-xs font-mono text-blue-300">{getStatContribution(intelligenceWeight)}%</span>
                      <span className="text-[10px] mt-1 uppercase tracking-wide text-blue-300/70">Mind</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/80 border border-blue-500/30">
                    <p className="text-xs flex justify-between w-full">
                      <span>Your Intelligence:</span> 
                      <span className="font-mono ml-2">{userStats?.intelligence || 0}/100</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Action Button - enhanced styling */}
      <CardFooter className="px-5 pb-5 pt-0">
        <Button
          variant={isOnCooldown ? "outline" : "default"}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-11 relative shadow-glow font-medium text-sm uppercase tracking-wide",
            isOnCooldown 
              ? "bg-yellow-950/50 hover:bg-yellow-900/50 text-yellow-400 border-yellow-700/30" 
              : disabled 
                ? "bg-muted/20 hover:bg-muted/30" 
                : "bg-primary/80 hover:bg-primary"
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
              <span>EXECUTE OPERATION</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}