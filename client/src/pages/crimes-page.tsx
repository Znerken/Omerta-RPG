import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { MafiaAlert } from "@/components/ui/mafia-alert";
import { CrimeCard } from "@/components/ui/crime-card";
import { CrimeResultModal } from "@/components/crime/CrimeResultModal";
import { apiRequest } from "@/lib/queryClient";
import { useNotification } from "@/hooks/use-notification";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  Speech
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CrimesPage() {
  const [showResultModal, setShowResultModal] = useState(false);
  const [crimeResult, setCrimeResult] = useState<any>(null);
  const [selectedCrime, setSelectedCrime] = useState<any>(null);
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: crimes, isLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Group crimes by difficulty
  const easyCrimes = crimes?.filter((crime: any) => 
    crime.minCashReward < 200
  );
  
  const mediumCrimes = crimes?.filter((crime: any) => 
    crime.minCashReward >= 200 && crime.minCashReward < 1000
  );
  
  const hardCrimes = crimes?.filter((crime: any) => 
    crime.minCashReward >= 1000
  );

  // Convert crime history to activity items format
  const crimeActivities = crimes?.filter((crime: any) => crime.lastPerformed).map((crime: any) => ({
    id: crime.lastPerformed.id,
    type: 'crime',
    title: crime.name,
    result: crime.lastPerformed.success ? 'success' : crime.lastPerformed.jailed ? 'jailed' : 'failed',
    reward: crime.lastPerformed.success ? {
      cash: crime.lastPerformed.cashReward,
      xp: crime.lastPerformed.xpReward,
    } : undefined,
    timestamp: new Date(crime.lastPerformed.timestamp),
  })).sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());

  const executeCrime = useMutation({
    mutationFn: async (crimeId: number) => {
      const res = await apiRequest("POST", `/api/crimes/${crimeId}/execute`);
      return await res.json();
    },
    onSuccess: (data, crimeId) => {
      const crime = crimes?.find((c: any) => c.id === crimeId);
      if (!crime) return;
      
      setSelectedCrime(crime);
      setCrimeResult(data);
      setShowResultModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/crimes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Show toast notification
      if (data.success) {
        const title = "Crime Successful!";
        const message = `You earned ${formatCurrency(data.cashReward)} and ${data.xpReward} XP from ${crime.name}.`;
        
        // Add to notification system
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
        const message = `You were caught attempting ${crime.name} and sent to jail for ${data.jailTime || 0} minutes.`;
        
        // Add to notification system
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
        
        // Add to notification system
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteCrime = (crimeId: number) => {
    executeCrime.mutate(crimeId);
  };

  // Function to transform crime data for our new CrimeCard component
  const transformCrimeData = (crime: any) => {
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
      cooldown: isCooldown ? new Date(crime.lastPerformed.nextAvailableAt) : undefined,
      isOnCooldown: isCooldown,
      strengthWeight: crime.strengthWeight || 0,
      stealthWeight: crime.stealthWeight || 0,
      charismaWeight: crime.charismaWeight || 0,
      intelligenceWeight: crime.intelligenceWeight || 0,
      userStats: userProfile?.stats,
      onExecute: handleExecuteCrime,
      disabled: executeCrime.isPending,
    };
  };

  return (
    <>
      <PageHeader 
        title="Criminal Activities" 
        icon={<Briefcase className="h-5 w-5" />}
        description="Commit crimes to earn cash and respect in the criminal underworld"
        className="text-shadow"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="card-mafia paper-texture mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Available Crimes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Crimes</TabsTrigger>
                  <TabsTrigger value="easy">Easy</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="hard">Hard</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
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
                  ) : crimes?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {crimes.map((crime: any) => (
                        <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      No criminal opportunities available at the moment
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="easy">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {easyCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="medium">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediumCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="hard">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hardCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} {...transformCrimeData(crime)} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="card-mafia paper-texture film-grain">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Criminal Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable 
                activities={crimeActivities || []} 
                loading={isLoading} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Alert className="spotlight">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Crime Information</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground mt-2">
              Crimes are a primary way to earn cash and XP in the game. The success chance depends on your stats and can be improved by training and equipment.
            </AlertDescription>
          </Alert>

          <Card className="card-mafia paper-texture">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center">
                <ChevronRight className="h-5 w-5 mr-2" />
                Your Criminal Skills
              </CardTitle>
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
                <Progress value={userProfile?.stats?.strength || 0} className="h-1.5 progress-bar-animated" />
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
                <Progress value={userProfile?.stats?.stealth || 0} className="h-1.5 progress-bar-animated" />
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
                <Progress value={userProfile?.stats?.intelligence || 0} className="h-1.5 progress-bar-animated" />
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
                <Progress value={userProfile?.stats?.charisma || 0} className="h-1.5 progress-bar-animated" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-mafia paper-texture">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Crime Consequences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-2 rounded-sm transition-colors hover:bg-card/80">
                  <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <div className="font-medium">Cash Rewards</div>
                    <p className="text-sm text-muted-foreground">
                      Earn cash based on crime difficulty and success
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-sm transition-colors hover:bg-card/80">
                  <Award className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <div className="font-medium">XP Gains</div>
                    <p className="text-sm text-muted-foreground">
                      Gain XP to level up and improve your character
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-sm transition-colors hover:bg-card/80">
                  <AlertCircle className="h-5 w-5 mr-3 text-yellow-500" />
                  <div>
                    <div className="font-medium">Jail Risk</div>
                    <p className="text-sm text-muted-foreground">
                      Failed crimes may result in jail time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-sm transition-colors hover:bg-card/80">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Cooldowns</div>
                    <p className="text-sm text-muted-foreground">
                      Each crime has a cooldown period before it can be repeated
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
