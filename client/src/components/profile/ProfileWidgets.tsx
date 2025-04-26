import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Award, 
  DollarSign, 
  Briefcase, 
  Users, 
  Clock, 
  Trophy,
  Heart,
  Shield,
  Sword,
  Brain,
  Target,
  Eye,
  Bolt,
  Calendar,
  Flame,
  Sparkles,
  Crown,
  BadgeDollarSign,
  Skull,
  MapPin,
  Star,
  Zap,
  Music
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FedoraIcon } from '@/components/ui/mafia-icons';

// Widget position types
export type WidgetPosition = 'top' | 'left' | 'right' | 'bottom' | 'disabled';

// Widget definition
export interface ProfileWidget {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  position: WidgetPosition;
  size: 'small' | 'medium' | 'large';
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
  renderContent: (userData: any) => React.ReactNode;
}

// Available widgets
export const PROFILE_WIDGETS: ProfileWidget[] = [
  // Basic Stats Widgets
  {
    id: 'cash',
    name: 'Cash Balance',
    description: 'Display your current cash balance',
    icon: <DollarSign className="h-4 w-4" />,
    position: 'top',
    size: 'small',
    unlocked: true,
    rarity: 'common',
    renderContent: (user) => (
      <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
        <DollarSign className="h-4 w-4 mr-1 text-green-500" />
        ${user?.cash?.toLocaleString() || '0'}
      </Badge>
    )
  },
  {
    id: 'respect',
    name: 'Respect Level',
    description: 'Show how much respect you command',
    icon: <Award className="h-4 w-4" />,
    position: 'top',
    size: 'small',
    unlocked: true,
    rarity: 'common',
    renderContent: (user) => (
      <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
        <Award className="h-4 w-4 mr-1 text-primary" />
        {user?.respect?.toLocaleString() || '0'} Respect
      </Badge>
    )
  },
  {
    id: 'rank',
    name: 'Mafia Rank',
    description: 'Display your current rank in the mafia hierarchy',
    icon: <Briefcase className="h-4 w-4" />,
    position: 'top',
    size: 'small',
    unlocked: true,
    rarity: 'common',
    renderContent: (user) => {
      // Calculate rank based on level
      const level = user?.level || 1;
      let rank = "Associate";
      if (level >= 50) rank = "Godfather";
      else if (level >= 40) rank = "Boss";
      else if (level >= 30) rank = "Underboss";
      else if (level >= 20) rank = "Capo";
      else if (level >= 10) rank = "Soldier";
      else if (level >= 5) rank = "Made Man";
      
      return (
        <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
          <Briefcase className="h-4 w-4 mr-1 text-amber-500" />
          {rank}
        </Badge>
      );
    }
  },
  {
    id: 'crew',
    name: 'Crew Status',
    description: 'Show your gang membership and size',
    icon: <Users className="h-4 w-4" />,
    position: 'top',
    size: 'small',
    unlocked: true,
    rarity: 'common',
    renderContent: (user) => {
      const gangName = user?.gang?.name || "No Crew";
      const memberCount = user?.gang?.memberCount || 0;
      
      return (
        <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
          <Users className="h-4 w-4 mr-1 text-blue-500" />
          {gangName}: {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
        </Badge>
      );
    }
  },
  
  // Enhanced Stat Widgets
  {
    id: 'skill-stats',
    name: 'Combat Skills',
    description: 'Display your strength, stealth, charisma, and intelligence ratings',
    icon: <Sword className="h-4 w-4" />,
    position: 'left',
    size: 'medium',
    unlocked: true,
    rarity: 'rare',
    renderContent: (user) => {
      const stats = user?.stats || { strength: 0, stealth: 0, charisma: 0, intelligence: 0 };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Sword className="h-5 w-5 mr-2 text-red-500" /> Combat Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sword className="h-4 w-4 mr-2 text-red-400" />
                  <span>Strength</span>
                </div>
                <div className="relative w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-400"
                    style={{ width: `${Math.min(100, stats.strength)}%` }}
                  ></div>
                </div>
                <span className="text-sm">{stats.strength}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-blue-400" />
                  <span>Stealth</span>
                </div>
                <div className="relative w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${Math.min(100, stats.stealth)}%` }}
                  ></div>
                </div>
                <span className="text-sm">{stats.stealth}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-pink-400" />
                  <span>Charisma</span>
                </div>
                <div className="relative w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-600 to-pink-400"
                    style={{ width: `${Math.min(100, stats.charisma)}%` }}
                  ></div>
                </div>
                <span className="text-sm">{stats.charisma}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-400" />
                  <span>Intelligence</span>
                </div>
                <div className="relative w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ width: `${Math.min(100, stats.intelligence)}%` }}
                  ></div>
                </div>
                <span className="text-sm">{stats.intelligence}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  },
  {
    id: 'crime-stats',
    name: 'Criminal Record',
    description: 'Show your crime success rate and most successful crimes',
    icon: <Skull className="h-4 w-4" />,
    position: 'right',
    size: 'medium',
    unlocked: true,
    rarity: 'rare',
    renderContent: (user) => {
      // This would be better with real data from the API
      const totalCrimes = 247;
      const successfulCrimes = 178;
      const successRate = totalCrimes > 0 ? Math.round((successfulCrimes / totalCrimes) * 100) : 0;
      
      const crimesData = [
        { name: 'Pickpocket', count: 48, success: 39 },
        { name: 'Store Robbery', count: 35, success: 28 },
        { name: 'Bank Heist', count: 21, success: 14 },
      ];
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Skull className="h-5 w-5 mr-2 text-red-500" /> Criminal Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <span>Success Rate:</span>
              <div className="flex items-center">
                <div className="relative w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-amber-400"
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
                <span className="ml-2">{successRate}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Type</span>
                <span>Success</span>
                <span>Total</span>
              </div>
              
              {crimesData.map(crime => (
                <div key={crime.name} className="flex justify-between text-sm">
                  <span>{crime.name}</span>
                  <span className="text-green-400">{crime.success}</span>
                  <span>{crime.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  },
  {
    id: 'territory',
    name: 'Territory Control',
    description: 'Map of controlled territories',
    icon: <MapPin className="h-4 w-4" />,
    position: 'bottom',
    size: 'large',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Control at least one territory',
    cost: 25000,
    renderContent: (user) => {
      const territories = [
        { name: 'Downtown', controlled: true, contestedBy: null },
        { name: 'Waterfront', controlled: false, contestedBy: 'The Sharks' },
        { name: 'Chinatown', controlled: true, contestedBy: null },
        { name: 'Little Italy', controlled: true, contestedBy: 'The Giovannis' },
      ];
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-500" /> Territory Control
            </CardTitle>
            <CardDescription>
              Your family's influence across the city
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {territories.map(territory => (
                <div 
                  key={territory.name} 
                  className={cn(
                    "border p-3 rounded-md relative",
                    territory.controlled 
                      ? "border-green-600/50 bg-green-950/30" 
                      : "border-red-600/50 bg-red-950/30"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{territory.name}</h4>
                    {territory.controlled ? (
                      <Badge className="bg-green-600">Controlled</Badge>
                    ) : (
                      <Badge className="bg-red-600">Contested</Badge>
                    )}
                  </div>
                  
                  {territory.contestedBy && (
                    <p className="text-xs mt-2 text-zinc-400">Contested by: {territory.contestedBy}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-xs text-zinc-500">
            Control of territories provides passive income and resource bonuses
          </CardFooter>
        </Card>
      );
    }
  },
  {
    id: 'achievements',
    name: 'Achievement Showcase',
    description: 'Display your rarest achievements',
    icon: <Trophy className="h-4 w-4" />,
    position: 'right',
    size: 'medium',
    unlocked: true,
    rarity: 'rare',
    renderContent: (user) => {
      // This would be better with real data from the API
      const achievements = [
        { name: 'First Blood', description: 'Complete your first hit contract', rarity: 'common', date: '2025-03-15' },
        { name: 'Million Dollar Man', description: 'Accumulate $1,000,000 in cash', rarity: 'epic', date: '2025-03-21' },
        { name: 'Shadow Master', description: 'Successfully complete 50 stealth missions', rarity: 'rare', date: '2025-04-02' },
      ];
      
      const rarityColors = {
        common: 'text-gray-400',
        rare: 'text-blue-400',
        epic: 'text-purple-400',
        legendary: 'text-orange-400',
        mythic: 'text-red-400'
      };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" /> Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {achievements.map(achievement => (
                <div key={achievement.name} className="flex items-start">
                  <Trophy className={cn("h-4 w-4 mr-2 mt-0.5", rarityColors[achievement.rarity as keyof typeof rarityColors])} />
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <Badge 
                        className="ml-2 text-[10px]" 
                        variant="outline"
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  },
  {
    id: 'financial',
    name: 'Financial Portfolio',
    description: 'Display your investments and businesses',
    icon: <BadgeDollarSign className="h-4 w-4" />,
    position: 'left',
    size: 'medium',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Own at least one business',
    cost: 50000,
    renderContent: (user) => {
      const finances = {
        bankBalance: 258400,
        investments: 750000,
        businesses: [
          { name: 'Downtown Bar', revenue: 4500, worth: 180000 },
          { name: 'Casino Front', revenue: 8250, worth: 420000 }
        ],
        properties: [
          { name: 'Luxury Apartment', revenue: 2800, worth: 350000 },
        ]
      };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <BadgeDollarSign className="h-5 w-5 mr-2 text-green-500" /> Financial Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Bank Balance:</span>
                <span className="font-medium">${finances.bankBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Investments:</span>
                <span className="font-medium">${finances.investments.toLocaleString()}</span>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Businesses:</h4>
                <div className="space-y-2">
                  {finances.businesses.map(business => (
                    <div key={business.name} className="flex justify-between text-sm">
                      <span>{business.name}</span>
                      <span className="text-green-400">${business.revenue}/day</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Properties:</h4>
                <div className="space-y-2">
                  {finances.properties.map(property => (
                    <div key={property.name} className="flex justify-between text-sm">
                      <span>{property.name}</span>
                      <span className="text-green-400">${property.revenue}/week</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 border-t border-border/30 mt-4 text-xs text-muted-foreground">
            <span>Total Net Worth: ${(finances.bankBalance + finances.investments + 
              finances.businesses.reduce((acc, b) => acc + b.worth, 0) + 
              finances.properties.reduce((acc, p) => acc + p.worth, 0)).toLocaleString()}</span>
          </CardFooter>
        </Card>
      );
    }
  },
  {
    id: 'reputation',
    name: 'Reputation Meter',
    description: 'Show your standing with different factions',
    icon: <Target className="h-4 w-4" />,
    position: 'bottom',
    size: 'medium',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Reach level 15',
    cost: 35000,
    renderContent: (user) => {
      const factions = [
        { name: 'Police Department', reputation: -65 },
        { name: 'Chinatown Triads', reputation: 45 },
        { name: 'City Officials', reputation: 20 },
        { name: 'Street Gangs', reputation: -30 },
        { name: 'Italian Families', reputation: 75 }
      ];
      
      const getReputationColor = (rep: number) => {
        if (rep >= 75) return 'from-green-600 to-green-400';
        if (rep >= 25) return 'from-lime-600 to-lime-400';
        if (rep >= -25) return 'from-yellow-600 to-yellow-400';
        if (rep >= -75) return 'from-orange-600 to-orange-400';
        return 'from-red-600 to-red-400';
      };
      
      const getReputationLabel = (rep: number) => {
        if (rep >= 75) return 'Allied';
        if (rep >= 25) return 'Friendly';
        if (rep >= -25) return 'Neutral';
        if (rep >= -75) return 'Hostile';
        return 'Enemy';
      };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" /> Faction Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {factions.map(faction => (
                <div key={faction.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{faction.name}</span>
                    <span>{getReputationLabel(faction.reputation)}</span>
                  </div>
                  <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 ${faction.reputation >= 0 ? 'left-1/2' : 'right-1/2'} h-full bg-gradient-to-r ${getReputationColor(faction.reputation)}`}
                      style={{ width: `${Math.abs(faction.reputation) / 2}%` }}
                    ></div>
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-500"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-xs text-zinc-500">
            Your reputation affects prices, mission availability, and territory control
          </CardFooter>
        </Card>
      );
    }
  },
  {
    id: 'music-player',
    name: 'Music Player',
    description: 'Custom profile music player',
    icon: <Music className="h-4 w-4" />,
    position: 'bottom',
    size: 'medium',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'VIP status required',
    cost: 100000,
    renderContent: (user) => {
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Music className="h-5 w-5 mr-2 text-purple-500" /> Profile Music
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-black/50 rounded-sm flex items-center justify-center">
                  <FedoraIcon className="text-primary h-6 w-6" />
                </div>
                <div className="ml-3">
                  <div className="font-medium">OMERTÀ Theme</div>
                  <div className="text-sm text-muted-foreground">La Famiglia</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="relative w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-primary"></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1:15</span>
                <span>3:42</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  },
  {
    id: 'hitman-stats',
    name: 'Hitman Stats',
    description: 'Display your contract kill statistics',
    icon: <Target className="h-4 w-4" />,
    position: 'right',
    size: 'medium',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete 10 hit contracts',
    cost: 75000,
    renderContent: (user) => {
      const hitmanStats = {
        totalContracts: 32,
        completed: 27,
        failed: 5,
        perfectKills: 18,
        bounty: 345000,
        preferredWeapon: 'Silenced Pistol',
        topTarget: 'Police Commissioner'
      };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-red-500" /> Hitman Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500">Contracts</div>
                <div className="text-2xl font-bold">{hitmanStats.totalContracts}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Success Rate</div>
                <div className="text-2xl font-bold">
                  {Math.round((hitmanStats.completed / hitmanStats.totalContracts) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Perfect Kills</div>
                <div className="text-2xl font-bold">{hitmanStats.perfectKills}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Total Bounty</div>
                <div className="text-2xl font-bold">${hitmanStats.bounty.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Preferred Weapon</span>
                <span className="text-sm">{hitmanStats.preferredWeapon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Top Target</span>
                <span className="text-sm">{hitmanStats.topTarget}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  },
  {
    id: 'mastermind',
    name: 'Mastermind',
    description: 'Display your heist planning and execution stats',
    icon: <Brain className="h-4 w-4" />,
    position: 'left',
    size: 'medium',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Successfully plan 5 major heists',
    cost: 100000,
    renderContent: (user) => {
      const heistStats = {
        totalHeists: 14,
        successful: 11,
        perfectExecutions: 7,
        biggestScore: 2450000,
        crewSize: 6,
        preferredApproach: 'Stealth',
        notoriety: 85
      };
      
      return (
        <Card className="bg-dark-surface border-primary/20 w-full">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-500" /> Mastermind
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-purple-400" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-zinc-500">Notoriety</div>
                  <div className="text-2xl font-bold">{heistStats.notoriety}/100</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Success Rate</div>
                  <div className="text-lg font-bold">
                    {Math.round((heistStats.successful / heistStats.totalHeists) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Perfect Executions</div>
                  <div className="text-lg font-bold">{heistStats.perfectExecutions}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Biggest Score</div>
                  <div className="text-lg font-bold">${(heistStats.biggestScore / 1000000).toFixed(2)}M</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Preferred Approach</div>
                  <div className="text-lg font-bold">{heistStats.preferredApproach}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }
];

// Widget component - renders a widget at its specified position
export const ProfileWidget: React.FC<{
  widget: ProfileWidget;
  userData: any;
  position: WidgetPosition;
}> = ({ widget, userData, position }) => {
  if (widget.position !== position) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "widget-container",
            widget.size === 'small' && "widget-small",
            widget.size === 'medium' && "widget-medium",
            widget.size === 'large' && "widget-large",
            !widget.unlocked && "opacity-50 pointer-events-none"
          )}>
            {widget.renderContent(userData)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <h3 className="font-bold">{widget.name}</h3>
          <p className="text-sm">{widget.description}</p>
          {!widget.unlocked && widget.requirement && (
            <p className="text-xs text-amber-400 mt-1">{widget.requirement}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Widget container component - renders all widgets at a given position
export const WidgetContainer: React.FC<{
  widgets: ProfileWidget[];
  userData: any;
  position: WidgetPosition;
  className?: string;
}> = ({ widgets, userData, position, className }) => {
  const positionWidgets = widgets.filter(widget => widget.position === position);
  
  if (positionWidgets.length === 0) return null;
  
  return (
    <div className={cn(
      "widget-position-container",
      position === 'top' && "flex flex-wrap gap-2 justify-center",
      position === 'left' && "space-y-4",
      position === 'right' && "space-y-4",
      position === 'bottom' && "space-y-4",
      className
    )}>
      {positionWidgets.map(widget => (
        <ProfileWidget 
          key={widget.id} 
          widget={widget} 
          userData={userData} 
          position={position} 
        />
      ))}
    </div>
  );
};

// Profile widget customization component
export interface ProfileWidgetCustomizationProps {
  userWidgets: ProfileWidget[];
  onWidgetChange: (widgets: ProfileWidget[]) => void;
}

// Helper to get a profile widget by ID
export function getWidgetById(id: string): ProfileWidget | undefined {
  return PROFILE_WIDGETS.find(widget => widget.id === id);
}

// Helper to get relevant position CSS class
export function getWidgetPositionClass(position: WidgetPosition): string {
  switch (position) {
    case 'top': return 'flex flex-wrap gap-2 justify-center';
    case 'left': return 'space-y-4';
    case 'right': return 'space-y-4';
    case 'bottom': return 'space-y-4';
    default: return '';
  }
}