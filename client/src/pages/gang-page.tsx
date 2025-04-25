import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GangCard } from "@/components/gang/GangCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getInitials, formatDate } from "@/lib/utils";
import { Loader2, Users, Plus, Skull, DollarSign, MapPin, Shield, Swords, Target, Medal, Briefcase, Award, ArrowUp } from "lucide-react";

const createGangSchema = z.object({
  name: z.string().min(3, "Gang name must be at least 3 characters").max(20, "Gang name must be at most 20 characters"),
  tag: z.string().min(2, "Gang tag must be at least 2 characters").max(5, "Gang tag must be at most 5 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
});

type CreateGangValues = z.infer<typeof createGangSchema>;

export default function GangPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: gangsList, isLoading: gangsLoading } = useQuery({
    queryKey: ["/api/gangs"],
  });
  
  // Check if user has a gang 
  const userGangId = userProfile?.gangMembership?.gangId;
  const userGang = userProfile?.gangMembership?.gang;
  const userGangRank = userProfile?.gangMembership?.rank;
  const isInGang = !!userGangId;
  
  // For users in a gang, fetch detailed data with territories, wars, and missions
  const { data: gangDetails, isLoading: gangDetailsLoading } = useQuery({
    queryKey: ["/api/gangs", userGangId],
    enabled: !!userGangId,
  });
  
  const { data: gangTerritories, isLoading: territoriesLoading } = useQuery({
    queryKey: ["/api/gangs/territories"],
    enabled: !!userGangId,
  });
  
  const { data: activeWars, isLoading: warsLoading } = useQuery({
    queryKey: ["/api/gangs/wars/active"],
    enabled: !!userGangId,
  });
  
  const { data: activeMissions, isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/gangs/missions/active"],
    enabled: !!userGangId,
  });

  const form = useForm<CreateGangValues>({
    resolver: zodResolver(createGangSchema),
    defaultValues: {
      name: "",
      tag: "",
      description: "",
    },
  });

  const createGangMutation = useMutation({
    mutationFn: async (data: CreateGangValues) => {
      const res = await apiRequest("POST", "/api/gangs", data);
      return await res.json();
    },
    onSuccess: (data) => {
      const title = "Gang Created";
      const message = "Your gang has been successfully created!";
      
      // Add to notification system
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "success",
        read: false,
        timestamp: new Date(),
        data: {
          gangId: data?.id,
          gangName: data?.name,
          gangTag: data?.tag,
          isOwner: true,
          action: "create"
        }
      });
      
      toast({
        title: title,
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      const title = "Failed to Create Gang";
      const message = error.message || "There was an error creating your gang. Please try again.";
      
      // Add error notification
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "error",
        read: false,
        timestamp: new Date()
      });
      
      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const joinGangMutation = useMutation({
    mutationFn: async (gangId: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gangId}/join`);
      return await res.json();
    },
    onSuccess: (data) => {
      const title = "Gang Joined";
      const message = data.message || "You've successfully joined the gang.";
      
      // Add success notification
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "success",
        read: false,
        timestamp: new Date(),
        data: {
          gangId: data?.gangId,
          gangName: data?.gangName || "Unknown gang",
          gangTag: data?.gangTag,
          isOwner: false,
          action: "join"
        }
      });
      
      toast({
        title: title,
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error) => {
      const title = "Failed to Join Gang";
      const message = error.message || "There was an error joining the gang. Please try again.";
      
      // Add error notification
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "error",
        read: false,
        timestamp: new Date()
      });
      
      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const onCreateGangSubmit = (data: CreateGangValues) => {
    createGangMutation.mutate(data);
  };

  const handleJoinGang = (gangId: number) => {
    joinGangMutation.mutate(gangId);
  };
  
  // Handlers for territory control and gang wars
  const startTerritoryAttack = (territoryId: number) => {
    // Implement attack on territory
    toast({
      title: "Territory Attack",
      description: "Your gang is preparing to attack this territory...",
    });
  };
  
  const startGangWar = (enemyGangId: number) => {
    // Implement gang war
    toast({
      title: "Gang War Initiated",
      description: "Your gang has declared war! Prepare for battle...",
    });
  };
  
  const acceptMission = (missionId: number) => {
    // Accept mission
    toast({
      title: "Mission Accepted",
      description: "Your gang has accepted this mission. Good luck!",
    });
  };

  if (profileLoading || gangsLoading) {
    return (
      <>
        <PageHeader 
          title="Gangs" 
          icon={<Users className="h-5 w-5" />}
          description="Join forces with other criminals"
        />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // Variables already defined above

  return (
    <>
      <PageHeader 
        title="Gangs" 
        icon={<Users className="h-5 w-5" />}
        description={isInGang ? `Member of ${userGang?.name || "a gang"}` : "Join forces with other criminals"}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isInGang ? (
            // User is in a gang
            <GangCard 
              gang={userGang} 
              isUserInGang={true} 
              userRank={userGangRank} 
            />
          ) : (
            // User is not in any gang
            <Card className="bg-dark-surface mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Join or Create a Gang
                </CardTitle>
                <CardDescription>
                  Gangs offer protection, resources, and community. Join an existing gang or start your own.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/80">
                        <Plus className="h-4 w-4 mr-2" />
                        Create a Gang
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-dark-surface border-gray-700">
                      <DialogHeader>
                        <DialogTitle>Create a New Gang</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Form your own criminal organization and build your empire.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onCreateGangSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gang Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your gang name" 
                                    className="bg-dark-lighter border-gray-700" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="tag"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gang Tag (2-5 characters)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="RS" 
                                    maxLength={5}
                                    className="bg-dark-lighter border-gray-700" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us about your gang" 
                                    className="bg-dark-lighter border-gray-700" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter className="pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCreateDialogOpen(false)}
                              className="bg-dark-lighter"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary hover:bg-primary/80"
                              disabled={createGangMutation.isPending}
                            >
                              {createGangMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                </>
                              ) : (
                                "Create Gang"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-dark-surface mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skull className="h-5 w-5 mr-2" />
                Gang Leaderboard
              </CardTitle>
              <CardDescription>
                The most powerful criminal organizations in the city
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-dark-lighter">
                  <TableRow>
                    <TableHead className="text-left text-sm font-medium text-gray-400">Rank</TableHead>
                    <TableHead className="text-left text-sm font-medium text-gray-400">Gang</TableHead>
                    <TableHead className="text-left text-sm font-medium text-gray-400">Members</TableHead>
                    <TableHead className="text-left text-sm font-medium text-gray-400">Bank</TableHead>
                    {!isInGang && <TableHead className="text-right text-sm font-medium text-gray-400">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-800">
                  {gangsList && gangsList.map((gang: any, index: number) => (
                    <TableRow key={gang.id} className="hover:bg-dark-lighter">
                      <TableCell className="py-3 px-4 font-mono font-bold text-secondary">#{index + 1}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-2">
                            <span className="text-sm font-heading">{gang.tag}</span>
                          </div>
                          <span>{gang.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant="outline" className="bg-dark-lighter">
                          {/* This would be populated with actual data in a real app */}
                          {Math.floor(Math.random() * 10) + 1} Members
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-mono">{formatCurrency(gang.bankBalance)}</TableCell>
                      {!isInGang && (
                        <TableCell className="py-3 px-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-dark-lighter hover:bg-dark-lighter/80"
                            onClick={() => handleJoinGang(gang.id)}
                            disabled={joinGangMutation.isPending}
                          >
                            {joinGangMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Join"
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Gang Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Shared Resources</h3>
                <p className="text-sm text-gray-400">
                  Gang members can pool money in the gang bank for shared investments.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Protection</h3>
                <p className="text-sm text-gray-400">
                  Gang members can help each other and provide backup during conflicts.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Reputation</h3>
                <p className="text-sm text-gray-400">
                  Being part of a feared gang increases your street respect.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Gang Hideout</h3>
                <p className="text-sm text-gray-400">
                  Access to secure locations and special gang-only features.
                </p>
              </div>
            </CardContent>
          </Card>

          {isInGang && (
            <Card className="bg-dark-surface">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gang Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {/* This would be populated with actual data in a real app */}
                  {[
                    { id: 1, username: "DonBosco", rank: "Leader" },
                    { id: 2, username: "LuckyJoe", rank: "Officer" },
                    { id: 3, username: "ShadowHunter", rank: "Member" },
                    { id: 4, username: "BigBoss", rank: "Member" },
                    { id: 5, username: "NightRider", rank: "Member" }
                  ].map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-dark-lighter p-2 rounded-lg">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2 bg-primary">
                          <AvatarFallback>{getInitials(member.username)}</AvatarFallback>
                        </Avatar>
                        <span>{member.username}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${member.rank === 'Leader' 
                            ? 'bg-primary bg-opacity-20 text-primary' 
                            : member.rank === 'Officer'
                            ? 'bg-blue-600 bg-opacity-20 text-blue-400'
                            : 'bg-gray-600 bg-opacity-20 text-gray-400'
                          }
                        `}
                      >
                        {member.rank}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              {userGangRank === "Leader" && (
                <CardFooter>
                  <Button variant="outline" className="w-full bg-dark-lighter hover:bg-dark-lighter/80">
                    Manage Members
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
