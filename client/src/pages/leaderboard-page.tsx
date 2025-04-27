import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { LeaderboardCard3D } from "@/components/leaderboard/LeaderboardCard3D";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { 
  Trophy, 
  DollarSign, 
  Star, 
  Users, 
  Info, 
  TrendingUp, 
  Calendar, 
  RefreshCcw, 
  Medal, 
  Crown, 
  ArrowUp,
  Clock, 
  ChevronsUp
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<"all" | "daily" | "weekly">("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Animate elements after initial load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
  
  // Styling for rank badges
  const getRankColor = (rank: string) => {
    if (rank === "#1") return "gold";
    if (rank === "#2") return "silver";
    if (rank === "#3") return "bronze";
    return "default";
  };
  
  const getRankIcon = (rank: string) => {
    if (rank === "#1") return <Crown className="h-4 w-4" />;
    if (rank === "#2") return <Medal className="h-4 w-4" />;
    if (rank === "#3") return <Star className="h-4 w-4" />;
    return <ArrowUp className="h-4 w-4" />;
  };

  return (
    <>
      <div className="gradient-overlay absolute inset-0 pointer-events-none" />
      
      <PageHeader 
        title="Leaderboards" 
        icon={<Trophy className="h-5 w-5" />}
        description="See who's on top in the mafia world"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="bg-dark-surface/80 backdrop-blur-sm mb-6 overflow-hidden">
            <CardHeader className="pb-2 relative z-10">
              <motion.div 
                className="flex justify-between items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600">
                    Leaderboards
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex items-center p-1 bg-dark-lighter/80 backdrop-blur-sm rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${timeFrame === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('all')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      All Time
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${timeFrame === 'daily' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('daily')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Daily
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setTimeFrame('weekly')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Weekly
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-dark-lighter/80 backdrop-blur-sm"
                    onClick={() => {
                      // Refresh all leaderboard queries
                      ['level', 'cash', 'respect', 'gangs'].forEach(type => {
                        window.queryClient.invalidateQueries({ 
                          queryKey: [`/api/leaderboard?type=${type}&timeFrame=${timeFrame}`] 
                        });
                      });
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
              <CardDescription>
                See who's on top across different categories
              </CardDescription>
              
              {/* Mobile time frame selector */}
              <div className="flex md:hidden items-center justify-between mt-2 space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 flex-1 ${timeFrame === 'all' ? 'bg-primary text-white' : 'bg-dark-lighter/80 text-gray-400'}`}
                  onClick={() => setTimeFrame('all')}
                >
                  All Time
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 flex-1 ${timeFrame === 'daily' ? 'bg-primary text-white' : 'bg-dark-lighter/80 text-gray-400'}`}
                  onClick={() => setTimeFrame('daily')}
                >
                  Daily
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 flex-1 ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'bg-dark-lighter/80 text-gray-400'}`}
                  onClick={() => setTimeFrame('weekly')}
                >
                  Weekly
                </Button>
              </div>
            </CardHeader>

            <CardContent className="relative z-0">
              <LeaderboardCard3D
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
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 50 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="bg-dark-surface/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl">
                  <div className="mr-2 text-primary rounded-full bg-primary/10 p-1.5">
                    <Trophy className="h-5 w-5" />
                  </div>
                  Your Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <motion.div 
                      className="bg-dark-lighter/80 backdrop-blur-sm p-3 rounded-md flex items-center justify-between"
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400 mr-3">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">Level Ranking</div>
                          <div className="text-sm text-gray-400">Level {user.level}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`
                          px-3 py-1 rounded-md font-mono text-sm
                          ${userLevelRank === "N/A" || userLevelRank === "Not ranked" 
                            ? "bg-dark-surface text-gray-400" 
                            : `bg-${getRankColor(userLevelRank)}-900/30 text-${getRankColor(userLevelRank)}-400`}
                          flex items-center gap-1 font-bold
                        `}>
                          {getRankIcon(userLevelRank)}
                          {userLevelRank}
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-dark-lighter/80 backdrop-blur-sm p-3 rounded-md flex items-center justify-between"
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-green-500/20 flex items-center justify-center text-green-400 mr-3">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">Cash Ranking</div>
                          <div className="text-sm text-gray-400">${user.cash.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`
                          px-3 py-1 rounded-md font-mono text-sm
                          ${userCashRank === "N/A" || userCashRank === "Not ranked" 
                            ? "bg-dark-surface text-gray-400" 
                            : `bg-${getRankColor(userCashRank)}-900/30 text-${getRankColor(userCashRank)}-400`}
                          flex items-center gap-1 font-bold
                        `}>
                          {getRankIcon(userCashRank)}
                          {userCashRank}
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-dark-lighter/80 backdrop-blur-sm p-3 rounded-md flex items-center justify-between"
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-yellow-500/20 flex items-center justify-center text-yellow-400 mr-3">
                          <Star className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">Respect Ranking</div>
                          <div className="text-sm text-gray-400">{user.respect.toLocaleString()} points</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`
                          px-3 py-1 rounded-md font-mono text-sm
                          ${userRespectRank === "N/A" || userRespectRank === "Not ranked" 
                            ? "bg-dark-surface text-gray-400" 
                            : `bg-${getRankColor(userRespectRank)}-900/30 text-${getRankColor(userRespectRank)}-400`}
                          flex items-center gap-1 font-bold
                        `}>
                          {getRankIcon(userRespectRank)}
                          {userRespectRank}
                        </div>
                      </div>
                    </motion.div>
                    
                    {user.gangId ? (
                      <motion.div 
                        className="bg-dark-lighter/80 backdrop-blur-sm p-3 rounded-md flex items-center justify-between"
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400 mr-3">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">Gang Ranking</div>
                            <div className="text-sm text-gray-400">{user.gang?.name || "Your Gang"}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="px-3 py-1 rounded-md bg-dark-surface text-gray-400 font-mono text-sm flex items-center gap-1 font-bold">
                            <ChevronsUp className="h-4 w-4" />
                            {user.gang 
                              ? `#${gangLeaderboard?.findIndex((g: any) => g.id === user.gang.id) + 1 || "N/A"}` 
                              : "N/A"}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-dark-lighter/80 backdrop-blur-sm p-3 rounded-md text-center text-gray-400">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 50 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="bg-dark-surface/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl">
                  <div className="mr-2 text-primary rounded-full bg-primary/10 p-1.5">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Leaderboard Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="bg-dark-lighter/70 backdrop-blur-sm p-3 rounded-lg"
                  whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                >
                  <h3 className="font-medium mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Rankings Update
                  </h3>
                  <p className="text-sm text-gray-400">
                    Leaderboards are updated in real-time. Daily and weekly rankings reset at midnight.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="bg-dark-lighter/70 backdrop-blur-sm p-3 rounded-lg"
                  whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                >
                  <h3 className="font-medium mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Level Rankings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Based on player level and total XP earned. Shows the most experienced criminals.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="bg-dark-lighter/70 backdrop-blur-sm p-3 rounded-lg"
                  whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                >
                  <h3 className="font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    Cash Rankings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Shows players with the most cash on hand. Gang bank deposits are not counted.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="bg-dark-lighter/70 backdrop-blur-sm p-3 rounded-lg"
                  whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                >
                  <h3 className="font-medium mb-1 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Respect Rankings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Based on respect points earned from successful crimes and other activities.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="bg-dark-lighter/70 backdrop-blur-sm p-3 rounded-lg"
                  whileHover={{ backgroundColor: 'rgba(39, 39, 42, 0.9)' }}
                >
                  <h3 className="font-medium mb-1 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    Gang Rankings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Gangs are ranked by total bank balance, member count, and collective achievements.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {/* Add this CSS for the gradient overlay */}
      <style jsx>{`
        .gradient-overlay {
          background: radial-gradient(circle at top right, rgba(76, 29, 149, 0.1) 0%, transparent 70%),
                      radial-gradient(circle at bottom left, rgba(30, 64, 175, 0.1) 0%, transparent 70%);
          z-index: -1;
        }
        
        /* Gold glow */
        .bg-gold-900\/30 { background-color: rgba(133, 77, 14, 0.3); }
        .text-gold-400 { color: #FFD700; }
        
        /* Silver glow */
        .bg-silver-900\/30 { background-color: rgba(115, 115, 115, 0.3); }
        .text-silver-400 { color: #C0C0C0; }
        
        /* Bronze glow */
        .bg-bronze-900\/30 { background-color: rgba(120, 66, 18, 0.3); }
        .text-bronze-400 { color: #CD7F32; }
        
        /* Default rank */
        .bg-default-900\/30 { background-color: rgba(39, 39, 42, 0.3); }
        .text-default-400 { color: #A1A1AA; }
      `}</style>
    </>
  );
}
