import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { StatCard } from "@/components/stats/StatCard";
import { GangCard } from "@/components/gang/GangCard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { CrimeCard } from "@/components/crime/CrimeCard";
import { Briefcase, Dumbbell, Users, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: crimes, isLoading: crimesLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div>Failed to load dashboard data</div>
      </MainLayout>
    );
  }

  // Extract data from the dashboard response
  const { user, recentActivity, topPlayers } = dashboardData;
  const userStats = user.stats;

  // Convert API crime history to activity items format
  const activities = recentActivity.map((activity: any) => ({
    id: activity.id,
    type: 'crime',
    title: crimes?.find((c: any) => c.id === activity.crimeId)?.name || 'Unknown Crime',
    result: activity.success ? 'success' : activity.jailed ? 'jailed' : 'failed',
    reward: activity.success ? {
      cash: activity.cashReward,
      xp: activity.xpReward,
    } : undefined,
    timestamp: new Date(activity.timestamp),
  }));

  return (
    <MainLayout>
      {/* Welcome Card */}
      <Card className="bg-dark-surface rounded-lg p-4 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-heading text-2xl mb-2">Welcome back, {user.username}!</h2>
          <p className="text-gray-400 mb-4">Your criminal empire awaits. What's the plan today?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Link href="/crimes">
              <Button className="w-full bg-primary hover:bg-primary/80 text-white">
                <Briefcase className="mr-2 h-4 w-4" /> Commit Crime
              </Button>
            </Link>
            <Link href="/training">
              <Button variant="outline" className="w-full bg-dark-lighter hover:bg-dark-lighter/80">
                <Dumbbell className="mr-2 h-4 w-4" /> Train Stats
              </Button>
            </Link>
            <Link href="/gang">
              <Button variant="outline" className="w-full bg-dark-lighter hover:bg-dark-lighter/80">
                <Users className="mr-2 h-4 w-4" /> Gang Activities
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Briefcase className="text-[120px] text-secondary" />
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="mb-8">
        <h3 className="font-heading text-xl mb-4">YOUR STATS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            name="strength" 
            value={userStats.strength} 
            maxValue={100} 
            cooldownTime={userStats.strengthTrainingCooldown ? new Date(userStats.strengthTrainingCooldown) : null}
            progressColor="bg-red-600"
          />
          <StatCard 
            name="stealth" 
            value={userStats.stealth} 
            maxValue={100} 
            cooldownTime={userStats.stealthTrainingCooldown ? new Date(userStats.stealthTrainingCooldown) : null}
            progressColor="bg-green-600"
          />
          <StatCard 
            name="charisma" 
            value={userStats.charisma} 
            maxValue={100} 
            cooldownTime={userStats.charismaTrainingCooldown ? new Date(userStats.charismaTrainingCooldown) : null}
            progressColor="bg-blue-600"
          />
          <StatCard 
            name="intelligence" 
            value={userStats.intelligence} 
            maxValue={100} 
            cooldownTime={userStats.intelligenceTrainingCooldown ? new Date(userStats.intelligenceTrainingCooldown) : null}
            progressColor="bg-yellow-600"
          />
        </div>
      </div>

      {/* Crimes Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl">AVAILABLE CRIMES</h3>
          <Link href="/crimes">
            <Button variant="link" className="text-secondary">View All</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crimesLoading ? (
            <div className="col-span-3 flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            crimes?.slice(0, 3).map((crime: any) => (
              <CrimeCard key={crime.id} crime={crime} />
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl">RECENT ACTIVITY</h3>
          <Link href="/profile">
            <Button variant="link" className="text-secondary">View All</Button>
          </Link>
        </div>
        
        <ActivityTable activities={activities} limit={5} />
      </div>

      {/* Gang Activity */}
      {user.gang && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-xl">YOUR GANG</h3>
            <Link href="/gang">
              <Button variant="link" className="text-secondary">View All</Button>
            </Link>
          </div>
          
          <GangCard 
            gang={user.gang} 
            isUserInGang={true} 
            userRank={user.gangRank} 
          />
        </div>
      )}

      {/* Leaderboard Preview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl">TOP PLAYERS</h3>
          <Link href="/leaderboard">
            <Button variant="link" className="text-secondary">Full Leaderboard</Button>
          </Link>
        </div>
        
        <LeaderboardTable />
      </div>
    </MainLayout>
  );
}
