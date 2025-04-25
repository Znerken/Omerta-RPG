import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { 
  User, 
  DollarSign, 
  Award, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Medal, 
  Dumbbell, 
  Footprints, 
  BookOpen, 
  SmilePlus,
  Briefcase,
  Users
} from "lucide-react";
import { formatCurrency, getInitials, calculateLevelProgress } from "@/lib/utils";

export default function ProfilePage() {
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });
  
  const { data: crimeHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

  // Convert API crime history to activity items format
  const crimeActivities = crimeHistory?.map((crime: any) => {
    if (!crime.lastPerformed) return null;
    
    return {
      id: crime.lastPerformed.id,
      type: 'crime',
      title: crime.name,
      result: crime.lastPerformed.success ? 'success' : crime.lastPerformed.jailed ? 'jailed' : 'failed',
      reward: crime.lastPerformed.success ? {
        cash: crime.lastPerformed.cashReward,
        xp: crime.lastPerformed.xpReward,
      } : undefined,
      timestamp: new Date(crime.lastPerformed.timestamp),
    };
  }).filter(Boolean);

  // Add some sample training activities for UI demonstration
  const trainingActivities = [
    {
      id: 10001,
      type: 'training',
      title: 'Trained Strength',
      result: 'completed',
      reward: { stat: 'Strength', statValue: 2 },
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: 10002,
      type: 'training',
      title: 'Trained Stealth',
      result: 'completed',
      reward: { stat: 'Stealth', statValue: 1 },
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    }
  ];

  const allActivities = [...(crimeActivities || []), ...trainingActivities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (profileLoading) {
    return (
      <>
        <PageHeader 
          title="Your Profile" 
          icon={<User className="h-5 w-5" />}
          description="View your character stats and activity"
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <PageHeader 
          title="Your Profile" 
          icon={<User className="h-5 w-5" />}
          description="View your character stats and activity"
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400">Failed to load profile data</p>
          </div>
        </div>
      </>
    );
  }

  const { username, level, xp, cash, respect, stats } = userProfile;
  const nextLevelXp = userProfile.nextLevelXP || 100 * Math.pow(level, 2);
  const xpProgress = calculateLevelProgress(xp, nextLevelXp);

  return (
    <>
      <PageHeader 
        title="Your Profile" 
        icon={<User className="h-5 w-5" />}
        description="View your character stats and activity"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4 bg-primary">
                  <AvatarFallback className="text-3xl font-heading">{getInitials(username)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-medium mb-1">{username}</h2>
                <div className="flex items-center text-gray-400">
                  <Medal className="h-4 w-4 mr-1" />
                  <span>Level {level}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* XP Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Level Progress</span>
                    <span className="text-gray-400">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-3 bg-dark-lighter p-3 rounded-md">
                  <div className="text-center p-2">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-lg font-medium">{formatCurrency(cash)}</div>
                    <div className="text-xs text-gray-400">Cash</div>
                  </div>
                  <div className="text-center p-2">
                    <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-medium">{respect.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Respect</div>
                  </div>
                  <div className="text-center p-2">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-lg font-medium">48h</div>
                    <div className="text-xs text-gray-400">Play Time</div>
                  </div>
                  <div className="text-center p-2">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <div className="text-lg font-medium">85</div>
                    <div className="text-xs text-gray-400">Actions</div>
                  </div>
                </div>

                {/* Character Stats */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Character Stats
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm flex items-center text-gray-300">
                          <Dumbbell className="h-4 w-4 mr-1 text-red-500" /> Strength
                        </span>
                        <span className="text-sm font-mono">{stats.strength}/100</span>
                      </div>
                      <Progress value={stats.strength} className="h-1.5" indicatorClassName="bg-red-600" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm flex items-center text-gray-300">
                          <Footprints className="h-4 w-4 mr-1 text-green-500" /> Stealth
                        </span>
                        <span className="text-sm font-mono">{stats.stealth}/100</span>
                      </div>
                      <Progress value={stats.stealth} className="h-1.5" indicatorClassName="bg-green-600" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm flex items-center text-gray-300">
                          <SmilePlus className="h-4 w-4 mr-1 text-blue-500" /> Charisma
                        </span>
                        <span className="text-sm font-mono">{stats.charisma}/100</span>
                      </div>
                      <Progress value={stats.charisma} className="h-1.5" indicatorClassName="bg-blue-600" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm flex items-center text-gray-300">
                          <BookOpen className="h-4 w-4 mr-1 text-yellow-500" /> Intelligence
                        </span>
                        <span className="text-sm font-mono">{stats.intelligence}/100</span>
                      </div>
                      <Progress value={stats.intelligence} className="h-1.5" indicatorClassName="bg-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Medal className="h-5 w-5 mr-2" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center">
                  <Briefcase className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Master Thief</div>
                  <div className="text-xs text-gray-400">50 successful crimes</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <Dumbbell className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Strong Arm</div>
                  <div className="text-xs text-gray-400">Reach 50 Strength</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <Users className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Gang Boss</div>
                  <div className="text-xs text-gray-400">Lead a gang of 5+ members</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <DollarSign className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Millionaire</div>
                  <div className="text-xs text-gray-400">Accumulate $1,000,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity History */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-dark-lighter">
                  <TabsTrigger value="all">All Activity</TabsTrigger>
                  <TabsTrigger value="crimes">Crimes</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <ActivityTable activities={allActivities} loading={historyLoading} />
                </TabsContent>
                
                <TabsContent value="crimes">
                  <ActivityTable activities={crimeActivities || []} loading={historyLoading} />
                </TabsContent>
                
                <TabsContent value="training">
                  <ActivityTable activities={trainingActivities} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-dark-surface mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">42</div>
                  <div className="text-xs text-gray-400">Crimes Committed</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">78%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">3</div>
                  <div className="text-xs text-gray-400">Jail Sentences</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">{formatCurrency(15420)}</div>
                  <div className="text-xs text-gray-400">Total Earnings</div>
                </div>
              </div>

              <Separator className="my-6 bg-gray-700" />

              <h3 className="font-medium mb-4">Crime Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-green-500" />
                    </div>
                    <span>Pickpocket a Tourist</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">28 times</div>
                    <div className="text-xs text-gray-400">92% success</div>
                  </div>
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-yellow-500" />
                    </div>
                    <span>Break into a Car</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">12 times</div>
                    <div className="text-xs text-gray-400">75% success</div>
                  </div>
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-red-500" />
                    </div>
                    <span>Rob a Convenience Store</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">2 times</div>
                    <div className="text-xs text-gray-400">50% success</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
