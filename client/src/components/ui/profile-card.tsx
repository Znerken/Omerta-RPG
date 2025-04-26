import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, Mail, Star, 
  TrendingUp, DollarSign, 
  Shield, Clock, Edit
} from "lucide-react";

export interface UserStats {
  strength: number;
  stealth: number;
  charisma: number;
  intelligence: number;
}

interface ProfileCardProps {
  username: string;
  email?: string;
  avatar?: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  cash: number;
  respect: number;
  stats?: UserStats;
  gangInfo?: {
    name: string;
    role: string;
  };
  isOwner?: boolean;
  onEditProfile?: () => void;
  className?: string;
}

export function ProfileCard({
  username,
  email,
  avatar,
  level,
  currentXP,
  nextLevelXP,
  cash,
  respect,
  stats,
  gangInfo,
  isOwner = false,
  onEditProfile,
  className,
}: ProfileCardProps) {
  // Calculate XP progress percentage
  const xpProgress = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));
  
  return (
    <Card className={cn("card-mafia overflow-hidden", className)}>
      {/* Header Section with Avatar and Stats */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="h-28 bg-gradient-to-r from-accent to-primary/80 paper-texture">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/5 rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-black/10 rounded-full translate-x-8 translate-y-8"></div>
          </div>
        </div>
        
        {/* Avatar Overlay */}
        <div className="absolute bottom-0 left-5 transform translate-y-1/2 flex items-end">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
              {avatar ? (
                <img src={avatar} alt={username} />
              ) : (
                <User className="h-10 w-10" />
              )}
            </Avatar>
            <div className="absolute bottom-1 right-1 bg-background rounded-full p-0.5 border border-secondary/30">
              <Star className="h-4 w-4 text-secondary" fill="currentColor" />
            </div>
          </div>
        </div>
        
        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-background/70 backdrop-blur-sm border-secondary/30 px-2.5 py-1">
            <Star className="h-3.5 w-3.5 text-secondary mr-1" fill="currentColor" />
            <span>Level {level}</span>
          </Badge>
        </div>
        
        {/* Edit Button for Owner */}
        {isOwner && onEditProfile && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-3 left-3 bg-background/70 backdrop-blur-sm hover:bg-background/90"
            onClick={onEditProfile}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Edit</span>
          </Button>
        )}
      </div>
      
      {/* User Info Section */}
      <div className="pt-12 pb-4 px-5">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-heading">{username}</h2>
          
          {email && (
            <div className="flex items-center justify-center sm:justify-start mt-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              <span>{email}</span>
            </div>
          )}
          
          {gangInfo && (
            <div className="mt-2">
              <Badge variant="outline" className="border-primary/30">
                {gangInfo.name} - {gangInfo.role}
              </Badge>
            </div>
          )}
        </div>
        
        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">XP Progress</span>
            <span>{currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()}</span>
          </div>
          <div className="progress-bar-animated">
            <Progress value={xpProgress} className="h-2" />
          </div>
        </div>
        
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center p-2 rounded-sm bg-muted/50">
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <div className="text-xs text-muted-foreground">Cash</div>
              <div className="font-medium">${cash.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="flex items-center p-2 rounded-sm bg-muted/50">
            <Shield className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <div className="text-xs text-muted-foreground">Respect</div>
              <div className="font-medium">{respect.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Player Stats Section */}
      {stats && (
        <div className="border-t border-border/50 px-5 py-4">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            <h3 className="text-sm font-medium">Player Stats</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Strength</span>
                <span className="text-xs">{stats.strength}/100</span>
              </div>
              <Progress value={stats.strength} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-red-700 to-red-500" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Stealth</span>
                <span className="text-xs">{stats.stealth}/100</span>
              </div>
              <Progress value={stats.stealth} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-green-700 to-green-500" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Charisma</span>
                <span className="text-xs">{stats.charisma}/100</span>
              </div>
              <Progress value={stats.charisma} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-blue-700 to-blue-500" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Intelligence</span>
                <span className="text-xs">{stats.intelligence}/100</span>
              </div>
              <Progress value={stats.intelligence} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-yellow-700 to-yellow-500" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}