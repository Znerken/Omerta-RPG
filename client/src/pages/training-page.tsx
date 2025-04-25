import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/stats/StatCard";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Footprints, BookOpen, SmilePlus, Info, TrendingUp, Clock } from "lucide-react";

export default function TrainingPage() {
  const { data: userStats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Create sample training activities
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
    },
    {
      id: 10003,
      type: 'training',
      title: 'Trained Intelligence',
      result: 'completed',
      reward: { stat: 'Intelligence', statValue: 1 },
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    },
    {
      id: 10004,
      type: 'training',
      title: 'Trained Charisma',
      result: 'completed',
      reward: { stat: 'Charisma', statValue: 2 },
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
    },
    {
      id: 10005,
      type: 'training',
      title: 'Trained Strength',
      result: 'completed',
      reward: { stat: 'Strength', statValue: 1 },
      timestamp: new Date(Date.now() - 18000000), // 5 hours ago
    }
  ];

  // Training facility details
  const trainingFacilities = [
    {
      id: 1,
      name: "Street Gym",
      description: "A basic setup for strength training",
      stat: "strength",
      boost: 1,
      price: 0,
      unlocked: true
    },
    {
      id: 2,
      name: "Parkour Academy",
      description: "Learn moves to improve your stealth",
      stat: "stealth",
      boost: 1,
      price: 0,
      unlocked: true
    },
    {
      id: 3,
      name: "Local Library",
      description: "Study to increase your intelligence",
      stat: "intelligence",
      boost: 1,
      price: 0,
      unlocked: true
    },
    {
      id: 4,
      name: "Dive Bar",
      description: "Practice your social skills to boost charisma",
      stat: "charisma",
      boost: 1,
      price: 0,
      unlocked: true
    },
    {
      id: 5,
      name: "Pro Fitness Center",
      description: "Premium equipment for better strength gains",
      stat: "strength",
      boost: 2,
      price: 5000,
      unlocked: false
    },
    {
      id: 6,
      name: "Urban Ninja Camp",
      description: "Advanced stealth training techniques",
      stat: "stealth",
      boost: 2,
      price: 5000,
      unlocked: false
    }
  ];

  return (
    <MainLayout title="Training Facility">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2" />
                Train Your Stats
              </CardTitle>
              <CardDescription>
                Improve your character's abilities through training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                  name="strength" 
                  value={userStats?.strength || 0} 
                  maxValue={100} 
                  cooldownTime={userStats?.strengthTrainingCooldown ? new Date(userStats.strengthTrainingCooldown) : null}
                  progressColor="bg-red-600"
                />
                <StatCard 
                  name="stealth" 
                  value={userStats?.stealth || 0} 
                  maxValue={100} 
                  cooldownTime={userStats?.stealthTrainingCooldown ? new Date(userStats.stealthTrainingCooldown) : null}
                  progressColor="bg-green-600"
                />
                <StatCard 
                  name="charisma" 
                  value={userStats?.charisma || 0} 
                  maxValue={100} 
                  cooldownTime={userStats?.charismaTrainingCooldown ? new Date(userStats.charismaTrainingCooldown) : null}
                  progressColor="bg-blue-600"
                />
                <StatCard 
                  name="intelligence" 
                  value={userStats?.intelligence || 0} 
                  maxValue={100} 
                  cooldownTime={userStats?.intelligenceTrainingCooldown ? new Date(userStats.intelligenceTrainingCooldown) : null}
                  progressColor="bg-yellow-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Training Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable activities={trainingActivities} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Alert className="bg-dark-surface border-primary">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Training Information</AlertTitle>
            <AlertDescription className="text-sm text-gray-400 mt-2">
              Training your stats will improve your success chances in various activities. Each stat affects different aspects of gameplay.
            </AlertDescription>
          </Alert>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Training Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center mr-3">
                  <Dumbbell className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="font-medium">Strength</div>
                  <p className="text-sm text-gray-400">
                    Increases success in physical crimes and improves combat abilities
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center mr-3">
                  <Footprints className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-medium">Stealth</div>
                  <p className="text-sm text-gray-400">
                    Helps with sneaking, theft, and avoiding detection during crimes
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center mr-3">
                  <SmilePlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Charisma</div>
                  <p className="text-sm text-gray-400">
                    Improves social interactions, bribes, and negotiation effectiveness
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <div className="font-medium">Intelligence</div>
                  <p className="text-sm text-gray-400">
                    Enhances planning, hacking, and complex crime success rates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2" />
                Training Facilities
              </CardTitle>
              <CardDescription>
                Train at different locations for various benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="strength">
                <TabsList className="mb-4 bg-dark-lighter">
                  <TabsTrigger value="strength">Strength</TabsTrigger>
                  <TabsTrigger value="stealth">Stealth</TabsTrigger>
                  <TabsTrigger value="charisma">Charisma</TabsTrigger>
                  <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                </TabsList>
                
                {["strength", "stealth", "charisma", "intelligence"].map(statType => (
                  <TabsContent key={statType} value={statType}>
                    <div className="space-y-3">
                      {trainingFacilities
                        .filter(facility => facility.stat === statType)
                        .map(facility => (
                          <Card key={facility.id} className={`bg-dark-lighter ${!facility.unlocked ? 'opacity-60' : ''}`}>
                            <CardContent className="p-3">
                              <div className="flex justify-between mb-1">
                                <h4 className="font-medium">{facility.name}</h4>
                                <span className="text-xs bg-dark-surface px-2 py-0.5 rounded">
                                  +{facility.boost} {statType.charAt(0).toUpperCase() + statType.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{facility.description}</p>
                              {!facility.unlocked && facility.price > 0 && (
                                <div className="text-xs text-secondary">
                                  Unlock for ${facility.price.toLocaleString()}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
