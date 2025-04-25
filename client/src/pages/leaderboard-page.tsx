import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, DollarSign, Star, Users, Info, TrendingUp, Calendar, RefreshCcw } from "lucide-react";
import { useState } from "react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<"all" | "daily" | "weekly">("all");

  // Get leaderboard data for each category
  const { data: levelLeaderboard, isLoading: isLevelLoading } = useQuery({
    queryKey: [`/api/leaderboard?type=level&timeFrame=${timeFrame}`],
  });
  
  const { data: cashLeaderboard, isLoading: isCashLoading } = useQuery({
    queryKey: [`/api/leaderboard?type=cash&timeFrame=${timeFrame}`],
  });
  
  const { data: respectLeaderboard, isLoading: isRespectLoading } = useQuery({
    queryKey: [`/api/leaderboard?type=respect&timeFrame=${timeFrame}`],
  });
  
  const { data: gangLeaderboard, isLoading: isGangLoading } = useQuery({
    queryKey: [`/api/leaderboard?type=gangs&timeFrame=${timeFrame}`],
  });

  // Find user's rank in each category
  const findUserRank = (leaderboard: any[] | undefined) => {
    if (!user || !leaderboard) return "N/A";
    const index = leaderboard.findIndex(player => player.id === user.id);
    return index >= 0 ? `#${index + 1}` : "Not ranked";
  };

  const userLevelRank = findUserRank(levelLeaderboard);
  const userCashRank = findUserRank(cashLeaderboard);
  const userRespectRank = findUserRank(respectLeaderboard);

  return (
    <MainLayout title="Leaderboards">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-secondary" />
                  Leaderboards
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-3">
                    <button
                      className={`text-sm px-2 py-1 rounded ${timeFrame === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('all')}
                    >
                      All Time
                    </button>
                    <button
                      className={`text-sm px-2 py-1 rounded ${timeFrame === 'daily' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('daily')}
                    >
                      Daily
                    </button>
                    <button
                      className={`text-sm px-2 py-1 rounded ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('weekly')}
                    >
                      Weekly
                    </button>
                  </div>
                  <RefreshCcw 
                    className="h-4 w-4 cursor-pointer text-gray-400 hover:text-white" 
                    onClick={() => {
                      // Refresh all leaderboard queries
                      ['level', 'cash', 'respect', 'gangs'].forEach(type => {
                        window.queryClient.invalidateQueries({ 
                          queryKey: [`/api/leaderboard?type=${type}&timeFrame=${timeFrame}`] 
                        });
                      });
                    }}
                  />
                </div>
              </div>
              <CardDescription>
                See who's on top across different categories
              </CardDescription>
              
              {/* Mobile time frame selector */}
              <div className="flex sm:hidden items-center justify-between mt-2 space-x-2">
                <button
                  className={`text-xs flex-1 px-2 py-1 rounded ${timeFrame === 'all' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400'}`}
                  onClick={() => setTimeFrame('all')}
                >
                  All Time
                </button>
                <button
                  className={`text-xs flex-1 px-2 py-1 rounded ${timeFrame === 'daily' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400'}`}
                  onClick={() => setTimeFrame('daily')}
                >
                  Daily
                </button>
                <button
                  className={`text-xs flex-1 px-2 py-1 rounded ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400'}`}
                  onClick={() => setTimeFrame('weekly')}
                >
                  Weekly
                </button>
              </div>
            </CardHeader>

            <CardContent>
              <LeaderboardTable
                defaultTab="level"
                levelData={levelLeaderboard}
                cashData={cashLeaderboard}
                respectData={respectLeaderboard}
                gangData={gangLeaderboard}
                isLevelLoading={isLevelLoading}
                isCashLoading={isCashLoading}
                isRespectLoading={isRespectLoading}
                isGangLoading={isGangLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-secondary" />
                Your Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div className="bg-dark-lighter p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-6 w-6 mr-3 text-blue-500" />
                      <div>
                        <div className="font-medium">Level Ranking</div>
                        <div className="text-sm text-gray-400">Level {user.level}</div>
                      </div>
                    </div>
                    <div className="text-lg font-mono text-secondary">{userLevelRank}</div>
                  </div>
                  
                  <div className="bg-dark-lighter p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-6 w-6 mr-3 text-green-500" />
                      <div>
                        <div className="font-medium">Cash Ranking</div>
                        <div className="text-sm text-gray-400">${user.cash.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-lg font-mono text-secondary">{userCashRank}</div>
                  </div>
                  
                  <div className="bg-dark-lighter p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-6 w-6 mr-3 text-yellow-500" />
                      <div>
                        <div className="font-medium">Respect Ranking</div>
                        <div className="text-sm text-gray-400">{user.respect.toLocaleString()} points</div>
                      </div>
                    </div>
                    <div className="text-lg font-mono text-secondary">{userRespectRank}</div>
                  </div>
                  
                  {user.gangId ? (
                    <div className="bg-dark-lighter p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-6 w-6 mr-3 text-purple-500" />
                        <div>
                          <div className="font-medium">Gang Ranking</div>
                          <div className="text-sm text-gray-400">{user.gang?.name || "Your Gang"}</div>
                        </div>
                      </div>
                      <div className="text-lg font-mono text-secondary">
                        {user.gang ? `#${gangLeaderboard?.findIndex((g: any) => g.id === user.gang.id) + 1 || "N/A"}` : "N/A"}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                      Join a gang to see gang rankings
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Log in to see your rankings
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Leaderboard Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Rankings Update</h3>
                <p className="text-sm text-gray-400">
                  Leaderboards are updated in real-time. Daily and weekly rankings reset at midnight.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Level Rankings</h3>
                <p className="text-sm text-gray-400">
                  Based on player level and total XP earned. Shows the most experienced criminals.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Cash Rankings</h3>
                <p className="text-sm text-gray-400">
                  Shows players with the most cash on hand. Gang bank deposits are not counted.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Respect Rankings</h3>
                <p className="text-sm text-gray-400">
                  Based on respect points earned from successful crimes and other activities.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Gang Rankings</h3>
                <p className="text-sm text-gray-400">
                  Gangs are ranked by total bank balance, member count, and collective achievements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
