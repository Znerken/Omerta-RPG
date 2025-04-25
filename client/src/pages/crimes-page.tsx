import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrimeCard } from "@/components/crime/CrimeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { Briefcase, AlertCircle, ChevronRight, Clock, DollarSign, Info, Award, Loader2 } from "lucide-react";

export default function CrimesPage() {
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

  return (
    <>
      <PageHeader 
        title="Crimes" 
        icon={<Briefcase className="h-5 w-5" />}
        description="Commit crimes to earn cash and respect in the criminal underworld"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Available Crimes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-dark-lighter">
                  <TabsTrigger value="all">All Crimes</TabsTrigger>
                  <TabsTrigger value="easy">Easy</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="hard">Hard</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : crimes?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {crimes.map((crime: any) => (
                        <CrimeCard key={crime.id} crime={crime} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No crimes available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="easy">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {easyCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} crime={crime} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="medium">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediumCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} crime={crime} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="hard">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hardCrimes?.map((crime: any) => (
                      <CrimeCard key={crime.id} crime={crime} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Crime History
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
          <Alert className="bg-dark-surface border-primary">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Crime Information</AlertTitle>
            <AlertDescription className="text-sm text-gray-400 mt-2">
              Crimes are a primary way to earn cash and XP in the game. The success chance depends on your stats and can be improved by training and equipment.
            </AlertDescription>
          </Alert>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ChevronRight className="h-5 w-5 mr-2" />
                Crime Success Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary mr-2">Stealth</Badge>
                    <span className="text-sm">Affects pickpocketing, theft</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.stealth || 0}/100</span>
                </div>
                <Progress value={userProfile?.stats?.stealth || 0} className="h-1.5" indicatorClassName="bg-green-600" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary mr-2">Strength</Badge>
                    <span className="text-sm">Affects robbery, intimidation</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.strength || 0}/100</span>
                </div>
                <Progress value={userProfile?.stats?.strength || 0} className="h-1.5" indicatorClassName="bg-red-600" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary mr-2">Intelligence</Badge>
                    <span className="text-sm">Affects hacking, scams</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.intelligence || 0}/100</span>
                </div>
                <Progress value={userProfile?.stats?.intelligence || 0} className="h-1.5" indicatorClassName="bg-yellow-600" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary mr-2">Charisma</Badge>
                    <span className="text-sm">Affects con artistry, bribes</span>
                  </div>
                  <span className="text-sm font-mono">{userProfile?.stats?.charisma || 0}/100</span>
                </div>
                <Progress value={userProfile?.stats?.charisma || 0} className="h-1.5" indicatorClassName="bg-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Crime Consequences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <div className="font-medium">Cash Rewards</div>
                    <p className="text-sm text-gray-400">
                      Earn cash based on crime difficulty and success
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <div className="font-medium">XP Gains</div>
                    <p className="text-sm text-gray-400">
                      Gain XP to level up and improve your character
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-3 text-yellow-500" />
                  <div>
                    <div className="font-medium">Jail Risk</div>
                    <p className="text-sm text-gray-400">
                      Failed crimes may result in jail time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Cooldowns</div>
                    <p className="text-sm text-gray-400">
                      Each crime has a cooldown period before it can be repeated
                    </p>
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
