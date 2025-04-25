import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatNumber } from "@shared/gameUtils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, ProgressStatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  Dumbbell, 
  Briefcase, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Trophy 
} from "lucide-react";
import { 
  TommyGunIcon, 
  FedoraIcon, 
  MoneyBriefcaseIcon, 
  WhiskeyGlassIcon, 
  DiceIcon, 
  FamilyIcon 
} from "@/components/ui/mafia-icons";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: crimes, isLoading: isCrimesLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Welcome to your criminal empire dashboard"
        icon={<FedoraIcon size="lg" color="secondary" />}
      />

      {/* User stats */}
      <section className="mb-10">
        <h2 className="game-section-heading">Your Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Level"
            value={user.level}
            icon={<TrendingUp className="h-6 w-6" />}
            description={`${formatNumber(user.xp || 0)} XP`}
            className="game-card"
          />
          
          <StatCard
            title="Money"
            value={formatCurrency(user.cash || 0)}
            icon={<DollarSign className="h-6 w-6" />}
            trend="up"
            trendValue="+12% this week"
            className="game-card"
          />
          
          <StatCard
            title="Respect"
            value={formatNumber(user.respect || 0)}
            icon={<FamilyIcon size="md" />}
            trend="neutral"
            trendValue="Stable"
            className="game-card"
          />
          
          <StatCard
            title="Activities"
            value="7"
            icon={<Activity className="h-6 w-6" />}
            description="Completed today"
            className="game-card"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <Card className="backdrop-mafia p-6 lg:p-8">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-heading mb-2">Quick Actions</h2>
              <p className="text-muted-foreground">What's your next move, boss?</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionCard 
                title="Commit Crime"
                description="Make some quick cash"
                icon={<MoneyBriefcaseIcon size="lg" color="primary" />}
                link="/crimes"
              />
              
              <ActionCard 
                title="Train Skills"
                description="Improve your abilities"
                icon={<Dumbbell className="h-8 w-8" />}
                link="/training"
              />
              
              <ActionCard 
                title="Gang Activities"
                description="Coordinate with your crew"
                icon={<Users className="h-8 w-8" />}
                link="/gang"
              />
              
              <ActionCard 
                title="Browse Market"
                description="Get new equipment"
                icon={<WhiskeyGlassIcon size="lg" />}
                link="/inventory"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Criminal Stats */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="game-section-heading">Your Criminal Skills</h2>
          <Link href="/training">
            <Button variant="outline" size="sm">Train Skills</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkillCard 
            title="Strength" 
            value={user?.stats?.strength || 0} 
            maxValue={100}
            description="Brute force and physical power"
            color="bg-red-600"
            cooldown={user?.stats?.strengthTrainingCooldown}
            className="game-card"
          />
          
          <SkillCard 
            title="Stealth" 
            value={user?.stats?.stealth || 0} 
            maxValue={100}
            description="Moving unseen and unheard"
            color="bg-green-600"
            cooldown={user?.stats?.stealthTrainingCooldown}
            className="game-card"
          />
          
          <SkillCard 
            title="Charisma" 
            value={user?.stats?.charisma || 0} 
            maxValue={100}
            description="Persuasion and social influence"
            color="bg-blue-600"
            cooldown={user?.stats?.charismaTrainingCooldown}
            className="game-card"
          />
          
          <SkillCard 
            title="Intelligence" 
            value={user?.stats?.intelligence || 0} 
            maxValue={100}
            description="Planning and problem solving"
            color="bg-yellow-600"
            cooldown={user?.stats?.intelligenceTrainingCooldown}
            className="game-card"
          />
        </div>
      </section>
      
      {/* Available Crimes */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="game-section-heading">Available Crimes</h2>
          <Link href="/crimes">
            <Button variant="outline" size="sm">View All Crimes</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCrimesLoading ? (
            <>
              <CrimeSkeleton />
              <CrimeSkeleton />
              <CrimeSkeleton />
            </>
          ) : crimes && crimes.length > 0 ? (
            crimes.slice(0, 3).map((crime: any) => (
              <CrimeCard 
                key={crime.id}
                name={crime.name}
                description={crime.description}
                cashReward={`$${crime.minCashReward} - $${crime.maxCashReward}`}
                xpReward={`${crime.minXpReward} - ${crime.maxXpReward} XP`}
                successChance={crime.successChance || calculateSuccessChance(crime, user?.stats)}
                cooldown={formatTime(crime.cooldown)}
                jailRisk={crime.jailRisk}
                className="game-card"
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              No crimes available at your level
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ActionCard({ 
  title, 
  description, 
  icon, 
  link 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  link: string;
}) {
  return (
    <Link href={link}>
      <div className="card-mafia h-full p-5 flex flex-col hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function SkillCard({ 
  title, 
  value, 
  maxValue, 
  color = "bg-primary", 
  description,
  cooldown,
  className
}: { 
  title: string; 
  value: number; 
  maxValue: number; 
  color?: string; 
  description: string;
  cooldown?: string | Date | null;
  className?: string;
}) {
  const progress = Math.min(100, Math.floor((value / maxValue) * 100));
  const cooldownDate = cooldown ? new Date(cooldown) : null;
  const isOnCooldown = cooldownDate && cooldownDate > new Date();
  
  return (
    <Card className={cn("card-mafia overflow-hidden", className)}>
      <div className="p-5">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="font-heading text-lg">{title}</h3>
          <span className="font-mono text-lg">{value}</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 mb-3 progress-bar-animated">
          <div
            className={cn("h-2 rounded-full", color)}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        
        {isOnCooldown && (
          <div className="flex items-center text-xs status-cooldown mt-1">
            <span>Cooldown: {formatCooldown(cooldownDate)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function CrimeCard({ 
  name, 
  description, 
  cashReward, 
  xpReward, 
  successChance, 
  cooldown,
  jailRisk,
  className
}: { 
  name: string; 
  description: string; 
  cashReward: string; 
  xpReward: string; 
  successChance: number; 
  cooldown: string;
  jailRisk: number;
  className?: string;
}) {
  return (
    <Card className={cn("card-mafia overflow-hidden", className)}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-heading text-lg">{name}</h3>
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <TommyGunIcon size="sm" />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{cashReward}</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{xpReward}</span>
          </div>
          <div className="flex items-center status-cooldown">
            <span>Cooldown: {cooldown}</span>
          </div>
          <div className="flex items-center status-danger">
            <span>Risk: {jailRisk}%</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span>Success Chance</span>
            <span className={getSuccessChanceColor(successChance)}>{successChance}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 progress-bar-animated">
            <div
              className={cn("h-1.5 rounded-full", getSuccessChanceBarColor(successChance))}
              style={{ width: `${successChance}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button className="w-full hover:shadow-glow">Execute</Button>
        </div>
      </div>
    </Card>
  );
}

function CrimeSkeleton() {
  return (
    <Card className="card-mafia overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-[80%] mb-4" />
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Skeleton className="h-4 w-[90px]" />
          <Skeleton className="h-4 w-[90px]" />
          <Skeleton className="h-4 w-[90px]" />
          <Skeleton className="h-4 w-[90px]" />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <Skeleton className="h-4 w-[100px]" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}

// Utility functions
function calculateSuccessChance(crime: any, stats: any) {
  if (!stats) return 50;
  
  // Simple calculation based on weights
  const strengthContribution = (stats.strength || 0) * (crime.strengthWeight || 0.25);
  const stealthContribution = (stats.stealth || 0) * (crime.stealthWeight || 0.25);
  const charismaContribution = (stats.charisma || 0) * (crime.charismaWeight || 0.25);
  const intelligenceContribution = (stats.intelligence || 0) * (crime.intelligenceWeight || 0.25);
  
  const totalContribution = strengthContribution + stealthContribution + 
                            charismaContribution + intelligenceContribution;
  
  // Scale to a percentage (max stats would be 400 total)
  let chance = Math.min(95, Math.max(5, Math.floor(totalContribution / 4)));
  
  return chance;
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatCooldown(date: Date) {
  const now = new Date();
  const diff = Math.max(0, Math.floor((date.getTime() - now.getTime()) / 1000));
  return formatTime(diff);
}

function getSuccessChanceColor(chance: number) {
  if (chance < 30) return "text-red-500";
  if (chance < 60) return "text-yellow-500";
  return "text-green-500";
}

function getSuccessChanceBarColor(chance: number) {
  if (chance < 30) return "bg-red-500";
  if (chance < 60) return "bg-yellow-500";
  return "bg-green-500";
}