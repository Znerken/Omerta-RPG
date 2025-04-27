import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { CrimeCard } from "@/components/ui/crime-card";
import { CrimeResultModal } from "@/components/crime/CrimeResultModal";
import { apiRequest } from "@/lib/queryClient";
import { useNotification } from "@/hooks/use-notification";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Briefcase, 
  AlertCircle, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Info, 
  Award, 
  Loader2,
  Dumbbell,
  Ghost,
  Brain,
  Speech,
  Shield,
  Users,
  MapPin,
  Sparkles,
  Flame,
  ShieldAlert,
  Star,
  Skull,
  TrendingUp
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// Type definitions for better type safety
interface Crime {
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
  strengthWeight: number;
  stealthWeight: number;
  charismaWeight: number;
  intelligenceWeight: number;
  lastPerformed?: {
    id: number;
    success: boolean;
    cashReward?: number;
    xpReward?: number;
    jailed: boolean;
    timestamp: string;
    nextAvailableAt?: string;
  }
}

interface UserProfile {
  id: number;
  username: string;
  level: number;
  cash: number;
  respect: number;
  isJailed: boolean;
  jailTimeEnd?: string;
  gang?: {
    id: number;
    name: string;
    tag: string;
  };
  gangRank?: string;
  stats?: {
    strength: number;
    stealth: number;
    charisma: number;
    intelligence: number;
  }
}

interface DashboardData {
  user: UserProfile;
  recentActivity: any[];
  topPlayers: any[];
}

export default function CrimesPage() {
  const [showResultModal, setShowResultModal] = useState(false);
  const [crimeResult, setCrimeResult] = useState<any>(null);
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // Fetch crimes and user data
  const { 
    data: crimes = [], 
    isLoading: crimesLoading 
  } = useQuery<Crime[]>({
    queryKey: ["/api/crimes"],
  });

  const { 
    data: userProfile, 
    isLoading: profileLoading 
  } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading
  } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  // Calculate user's crime success rate for stats panel
  const calculateSuccessRate = () => {
    if (!dashboardData || !dashboardData.recentActivity) return 0;
    
    const crimeActivities = dashboardData.recentActivity.filter(
      activity => activity.type === 'crime'
    );
    
    if (crimeActivities.length === 0) return 0;
    
    const successful = crimeActivities.filter(
      activity => activity.result === 'success'
    );
    
    return Math.round((successful.length / crimeActivities.length) * 100);
  };

  // Group crimes by difficulty for tab filtering
  const easyCrimes = crimes.filter(crime => crime.successChance >= 70);
  const mediumCrimes = crimes.filter(crime => crime.successChance >= 40 && crime.successChance < 70);
  const hardCrimes = crimes.filter(crime => crime.successChance < 40);

  // Convert crime history to activity items format
  const crimeActivities = crimes
    .filter(crime => crime.lastPerformed)
    .map(crime => ({
      id: crime.lastPerformed!.id,
      type: 'crime',
      title: crime.name,
      result: crime.lastPerformed!.success ? 'success' : crime.lastPerformed!.jailed ? 'jailed' : 'failed',
      reward: crime.lastPerformed!.success ? {
        cash: crime.lastPerformed!.cashReward,
        xp: crime.lastPerformed!.xpReward,
      } : undefined,
      timestamp: new Date(crime.lastPerformed!.timestamp),
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Crime execution mutation
  const executeCrime = useMutation({
    mutationFn: async (crimeId: number) => {
      const res = await apiRequest("POST", `/api/crimes/${crimeId}/execute`);
      return await res.json();
    },
    onSuccess: (data, crimeId) => {
      const crime = crimes.find(c => c.id === crimeId);
      if (!crime) return;
      
      setSelectedCrime(crime);
      setCrimeResult(data);
      setShowResultModal(true);
      
      // Delay and prevent auto-refetch to avoid page refreshes
      setTimeout(() => {
        // Invalidate relevant queries to update data but AVOID automatic refetching
        queryClient.invalidateQueries({ 
          queryKey: ["/api/crimes"],
          refetchType: "none" // This prevents automatic refetch which causes page refresh
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ["/api/dashboard"],
          refetchType: "none"
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ["/api/user/profile"],
          refetchType: "none"
        });
      }, 100);
      
      // Show notification based on result type
      if (data.success) {
        const title = "Crime Successful!";
        const message = `You earned ${formatCurrency(data.cashReward)} and ${data.xpReward} XP from ${crime.name}.`;
        
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "success",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id, reward: data.cashReward }
        });
      } else if (data.caught) {
        const title = "Busted!";
        const message = `You were caught attempting ${crime.name} and sent to jail.`;
        
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "error",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id, jailTime: data.jailTime }
        });
      } else {
        const title = "Crime Failed";
        const message = `You failed to execute ${crime.name} but managed to escape arrest.`;
        
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "warning",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id }
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteCrime = (crimeId: number) => {
    executeCrime.mutate(crimeId);
  };

  // Transform crime data for our CrimeCard component
  const transformCrimeData = (crime: Crime) => {
    const isCooldown = crime.lastPerformed?.nextAvailableAt && 
      new Date(crime.lastPerformed.nextAvailableAt) > new Date();
    
    return {
      id: crime.id,
      name: crime.name,
      description: crime.description,
      minCashReward: crime.minCashReward,
      maxCashReward: crime.maxCashReward,
      minXpReward: crime.minXpReward,
      maxXpReward: crime.maxXpReward,
      jailRisk: crime.jailRisk,
      successChance: crime.successChance,
      cooldown: isCooldown && crime.lastPerformed?.nextAvailableAt 
        ? new Date(crime.lastPerformed.nextAvailableAt) 
        : undefined,
      isOnCooldown: isCooldown,
      strengthWeight: crime.strengthWeight || 0,
      stealthWeight: crime.stealthWeight || 0,
      charismaWeight: crime.charismaWeight || 0,
      intelligenceWeight: crime.intelligenceWeight || 0,
      userStats: userProfile?.stats,
      onExecute: handleExecuteCrime,
      disabled: executeCrime.isPending || userProfile?.isJailed,
    };
  };

  // Calculate time remaining in jail
  const calculateJailRemaining = () => {
    if (!userProfile?.isJailed || !userProfile?.jailTimeEnd) return null;
    const jailEnd = new Date(userProfile.jailTimeEnd);
    return formatDistanceToNow(jailEnd, { addSuffix: true });
  };

  const jailTimeRemaining = calculateJailRemaining();

  const isLoading = crimesLoading || profileLoading || dashboardLoading;

  return (
    <>
      <PageHeader 
        title="Criminal Operations" 
        icon={<Briefcase className="h-5 w-5" />}
        description="Execute criminal operations to earn cash, respect, and build your reputation"
        className="text-shadow"
      />
      
      {userProfile?.isJailed && (
        <Alert className="mb-6 border-red-500/30 bg-red-500/10">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">You're in Jail</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            You've been caught and sent to jail. You'll be released {jailTimeRemaining}.
            While in jail, you cannot commit crimes or participate in certain activities.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
        {/* Main content - Available Crimes */}
        <div className="xl:col-span-3 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Criminal Stats Card */}
            <Card className="card-mafia paper-texture bg-crime-pattern overflow-hidden border-0">
              <div className="absolute inset-0 bg-gradient-to-r from-muted/70 to-muted/30 backdrop-blur-sm"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center mb-4">
                  <Flame className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-sm font-medium">Criminal Reputation</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Success Rate</span>
                      <span className="font-mono">{calculateSuccessRate()}%</span>
                    </div>
                    <Progress value={calculateSuccessRate()} className="h-1 progress-bar-animated" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 p-2 rounded-md">
                      <div className="flex items-center text-primary mb-1">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Level</span>
                      </div>
                      <p className="text-lg font-medium">{userProfile?.level || 1}</p>
                    </div>
                    
                    <div className="bg-muted/20 p-2 rounded-md">
                      <div className="flex items-center text-yellow-500 mb-1">
                        <Star className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Respect</span>
                      </div>
                      <p className="text-lg font-medium">{userProfile?.respect || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gang Affiliation Card */}
            <Card className="card-mafia paper-texture bg-gang-pattern overflow-hidden border-0">
              <div className="absolute inset-0 bg-gradient-to-r from-muted/70 to-muted/30 backdrop-blur-sm"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-sm font-medium">Gang Affiliation</h3>
                </div>
                
                {userProfile?.gang ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-heading">{userProfile.gang.name}</p>
                        <Badge variant="outline" className="mt-1 text-xs bg-primary/10 border-primary/20">
                          {userProfile.gangRank || "Member"}
                        </Badge>
                      </div>
                      <span className="text-2xl font-heading">{userProfile.gang.tag}</span>
                    </div>
                    
                    <Button variant="ghost" className="w-full mt-2 h-8 bg-primary/10 hover:bg-primary/20 text-xs" asChild>
                      <Link href="/gang">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Gang Operations
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2">
                    <Shield className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      You're not affiliated with any gang yet
                    </p>
                    <Button variant="ghost" className="w-full h-8 bg-primary/10 hover:bg-primary/20 text-xs" asChild>
                      <Link href="/gang">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Join a Gang
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Territory Control Card */}
            <Card className="card-mafia paper-texture bg-territory-pattern overflow-hidden border-0">
              <div className="absolute inset-0 bg-gradient-to-r from-muted/70 to-muted/30 backdrop-blur-sm"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-sm font-medium">Territory Control</h3>
                </div>
                
                {userProfile?.gang ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Expand your gang's territory to gain passive income and resources.
                    </p>
                    <Button variant="ghost" className="w-full h-8 bg-primary/10 hover:bg-primary/20 text-xs" asChild>
                      <Link href="/gang">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        View Territories
                      </Link>
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2">
                    <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      Join a gang to participate in territory control
                    </p>
                    <Button variant="ghost" className="w-full h-8 bg-primary/10 hover:bg-primary/20 text-xs" disabled>
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      No Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Crimes List */}
          <Card className="card-mafia paper-texture">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Briefcase className="h-5 w-5 mr-2 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Available Operations
                </span>
              </CardTitle>
              <CardDescription>
                Select a criminal operation based on your skills and risk tolerance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="all" 
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="h-full"
              >
                <div className="border-b border-border/40 pb-2">
                  <TabsList className="bg-background/50 p-0.5 h-9">
                    <TabsTrigger 
                      value="all" 
                      className="rounded-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      All Operations
                    </TabsTrigger>
                    <TabsTrigger 
                      value="easy" 
                      className="rounded-sm data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400"
                    >
                      <span className="hidden sm:inline">Low Risk</span>
                      <span className="sm:hidden">Easy</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="medium" 
                      className="rounded-sm data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400"
                    >
                      <span className="hidden sm:inline">Medium Risk</span>
                      <span className="sm:hidden">Medium</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="hard" 
                      className="rounded-sm data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400"
                    >
                      <span className="hidden sm:inline">High Risk</span>
                      <span className="sm:hidden">Hard</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p className="text-muted-foreground mt-2">Scouting for criminal opportunities...</p>
                    </div>
                  ) : crimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {crimes.map((crime) => (
                        <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Skull className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      No criminal opportunities available at the moment
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="easy" className="mt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : easyCrimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {easyCrimes.map((crime) => (
                        <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No low-risk operations available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="medium" className="mt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : mediumCrimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mediumCrimes.map((crime) => (
                        <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No medium-risk operations available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="hard" className="mt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : hardCrimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hardCrimes.map((crime) => (
                        <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No high-risk operations available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Criminal Record */}
          <Card className="card-mafia paper-texture film-grain">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Criminal Record
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable 
                activities={crimeActivities} 
                loading={isLoading} 
                emptyMessage="Your criminal record is clean... for now."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with info and stats */}
        <div className="space-y-6">
          {/* Criminal Skills */}
          <Card className="card-mafia paper-texture">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Your Skills
                </span>
              </CardTitle>
              <CardDescription>
                Improve your skills to increase your success rate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-red-500/10 mr-2">
                      <Dumbbell className="h-3.5 w-3.5 text-red-400" />
                    </div>
                    <span className="text-sm">Strength</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.strength || 0}/100</span>
                </div>
                <Progress 
                  value={userProfile?.stats?.strength || 0} 
                  className="h-1.5 progress-bar-animated" 
                  indicatorClassName="bg-gradient-to-r from-red-700 to-red-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-purple-500/10 mr-2">
                      <Ghost className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <span className="text-sm">Stealth</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.stealth || 0}/100</span>
                </div>
                <Progress 
                  value={userProfile?.stats?.stealth || 0} 
                  className="h-1.5 progress-bar-animated"
                  indicatorClassName="bg-gradient-to-r from-purple-700 to-purple-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-blue-500/10 mr-2">
                      <Brain className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span className="text-sm">Intelligence</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.intelligence || 0}/100</span>
                </div>
                <Progress 
                  value={userProfile?.stats?.intelligence || 0} 
                  className="h-1.5 progress-bar-animated"
                  indicatorClassName="bg-gradient-to-r from-blue-700 to-blue-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-yellow-500/10 mr-2">
                      <Speech className="h-3.5 w-3.5 text-yellow-400" />
                    </div>
                    <span className="text-sm">Charisma</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.charisma || 0}/100</span>
                </div>
                <Progress 
                  value={userProfile?.stats?.charisma || 0} 
                  className="h-1.5 progress-bar-animated"
                  indicatorClassName="bg-gradient-to-r from-yellow-700 to-yellow-500"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                className="w-full bg-muted/10 hover:bg-muted/20 text-sm h-9"
                asChild
              >
                <Link href="/training">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Train Your Skills
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Info Card */}
          <Card className="card-mafia paper-texture border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Crime Guide
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <Alert className="bg-card border-primary/10">
                  <AlertTitle className="text-primary flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Rewards
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1">
                    Successfully completed crimes earn cash and XP. Higher risk operations offer greater rewards.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-card border-yellow-500/10">
                  <AlertTitle className="text-yellow-400 flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Success Chance
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1">
                    Your skills determine your success chance. Train your character to improve odds.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-card border-red-500/10">
                  <AlertTitle className="text-red-400 flex items-center text-sm">
                    <ShieldAlert className="h-4 w-4 mr-1.5" />
                    Jail Risk
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1">
                    Failed operations may result in jail time. While in jail, you cannot commit crimes.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-card border-blue-500/10">
                  <AlertTitle className="text-blue-400 flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Cooldowns
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1">
                    Each crime has a cooldown period before it can be repeated.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Crime Result Modal */}
      {showResultModal && crimeResult && selectedCrime && (
        <CrimeResultModal 
          result={crimeResult} 
          crimeName={selectedCrime.name}
          onClose={() => setShowResultModal(false)}
          onRepeat={
            !(selectedCrime.lastPerformed?.nextAvailableAt && 
              new Date(selectedCrime.lastPerformed.nextAvailableAt) > new Date())
              ? () => handleExecuteCrime(selectedCrime.id) 
              : undefined
          }
        />
      )}
    </>
  );
}
