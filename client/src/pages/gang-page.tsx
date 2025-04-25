import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GangCard } from "@/components/gang/GangCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { 
  Loader2, 
  Users, 
  Plus, 
  Skull, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  Award, 
  Crown, 
  UserCheck,
  Trophy,
  ExternalLink,
  ArrowRight,
  Info
} from "lucide-react";

// Gang creation form schema
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

  // Fetch current user data
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch all gangs for the leaderboard
  const { data: gangsList, isLoading: gangsLoading, isError: gangsError } = useQuery({
    queryKey: ["/api/gangs"],
  });
  
  // Fetch the gang member information directly from backend
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });
  
  // Log the profile data to debug more extensively
  useEffect(() => {
    if (userProfile) {
      console.log("User Profile Data:", userProfile);
      console.log("Gang Member Data:", userProfile.gangMember);
      console.log("Gang Data:", userProfile.gang);
      console.log("In Gang?", userProfile.inGang);
      console.log("Gang Rank:", userProfile.gangRank);
      
      // Also log our derived values
      console.log("Derived Gang ID:", gang?.id);
      console.log("Is In Gang (derived):", isInGang);
    }
  }, [userProfile]);
  
  // Get gang membership information from multiple fields to be resilient
  const gangMember = userProfile?.gangMember;
  const inGang = userProfile?.inGang || false;
  const gang = userProfile?.gang;
  const gangRank = userProfile?.gangRank || "Member";
  
  // Fetch gang details if user is in a gang
  const userGangId = gang?.id;
  const { data: gangDetails, isLoading: gangDetailsLoading } = useQuery({
    queryKey: ["/api/gangs", userGangId],
    enabled: !!userGangId, // Only run this query if user has a gang
  });

  // Create form for gang creation
  const form = useForm<CreateGangValues>({
    resolver: zodResolver(createGangSchema),
    defaultValues: {
      name: "",
      tag: "",
      description: "",
    },
  });

  // Create gang mutation
  const createGangMutation = useMutation({
    mutationFn: async (data: CreateGangValues) => {
      const res = await apiRequest("POST", "/api/gangs", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gang Created",
        description: "Your gang has been successfully created!",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Gang",
        description: error.message || "There was an error creating your gang. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join gang mutation
  const joinGangMutation = useMutation({
    mutationFn: async (gangId: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gangId}/join`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gang Joined",
        description: data.message || "You've successfully joined the gang.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Gang",
        description: error.message || "There was an error joining the gang. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for gang creation
  const onCreateGangSubmit = (data: CreateGangValues) => {
    createGangMutation.mutate(data);
  };

  // Handle joining a gang
  const handleJoinGang = (gangId: number) => {
    joinGangMutation.mutate(gangId);
  };

  // Check if user is in a gang (using the direct property from server)
  const isInGang = inGang;
  
  // Get user's gang rank if they're in a gang
  const userGangRank = gangRank;
  
  // Use either the detailed gang info or the basic info from user's profile
  const userGang = gangDetails || gang || null;
  
  // Check if still loading
  const isLoading = userLoading || gangsLoading || profileLoading;
  
  // If still loading, show loading state
  if (isLoading) {
    return (
      <>
        <PageHeader 
          title="Gangs" 
          icon={<Users className="h-5 w-5" />}
          description="Join forces with other criminals"
        />
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-gray-400">Loading gang data...</p>
          </div>
        </div>
      </>
    );
  }
  
  // If error loading data, show error state
  if (userError || gangsError) {
    return (
      <>
        <PageHeader 
          title="Gangs" 
          icon={<Users className="h-5 w-5" />}
          description="Join forces with other criminals"
        />
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load gang data. Please try again later.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Gangs" 
        icon={<Users className="h-5 w-5" />}
        description={isInGang 
          ? `Member of ${userGang?.name || "a gang"}` 
          : "Join forces with other criminals"
        }
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left Column - Main Gang Content */}
        <div className="lg:col-span-5">
          {isInGang && userGang ? (
            // If user is in a gang, show the gang card with details
            <GangCard 
              gang={userGang} 
              isUserInGang={true} 
              userRank={userGangRank}
              userId={user?.id} 
            />
          ) : (
            // If user is not in a gang, show create/join options
            <Card className="bg-dark-surface border-gray-800 overflow-hidden relative mb-6">
              {/* Gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
              
              <CardHeader>
                <CardTitle className="flex items-center text-2xl gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Join the Criminal Underworld
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gangs offer protection, resources, and opportunities in the criminal world. 
                  Join an existing gang or start your own criminal empire.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Create Gang Card */}
                  <Card className="bg-gray-900/50 border border-gray-800 hover:border-primary/50 hover:bg-gray-900/80 transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Create a Gang
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-400">
                      Form your own criminal organization and lead it to power and glory.
                    </CardContent>
                    <CardFooter>
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Gang
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-dark-surface border-gray-800">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-heading">Create a New Gang</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Form your own criminal organization and build your empire.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onCreateGangSubmit)} className="space-y-4">
                              {/* Gang Name Field */}
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gang Name</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter your gang name" 
                                        className="bg-gray-900/50 border-gray-700" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Gang Tag Field */}
                              <FormField
                                control={form.control}
                                name="tag"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gang Tag (2-5 characters)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="ABC" 
                                        maxLength={5}
                                        className="bg-gray-900/50 border-gray-700" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Description Field */}
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Tell us about your gang" 
                                        className="bg-gray-900/50 border-gray-700" 
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
                                  className="border-gray-700"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90"
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
                    </CardFooter>
                  </Card>
                  
                  {/* Join Gang Card */}
                  <Card className="bg-gray-900/50 border border-gray-800 hover:border-primary/50 hover:bg-gray-900/80 transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-500" />
                        Join a Gang
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-400">
                      Team up with established criminals and climb the ranks of an existing organization.
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700"
                        asChild
                      >
                        <a href="#gangs-list">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Browse Gangs
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Benefits Card */}
                  <Card className="bg-gray-900/50 border border-gray-800 hover:border-primary/50 hover:bg-gray-900/80 transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Gang Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-400">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Protection from rival criminals</li>
                        <li>Access to exclusive missions</li>
                        <li>Territory control and income</li>
                        <li>Gang bank for shared resources</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full border-amber-800/50 text-amber-500 hover:bg-amber-950/20"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                {/* Info Alert */}
                <Alert className="bg-gray-900/50 border-gray-800">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-500">Looking for members?</AlertTitle>
                  <AlertDescription className="text-gray-400">
                    Once you create or join a gang, you'll be able to invite other players, participate in gang wars, and control territories.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Gang Leaderboard */}
          <div id="gangs-list">
            <Card className="bg-dark-surface border-gray-800 overflow-hidden relative mt-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600"></div>
              
              <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2">
                  <Skull className="h-5 w-5 text-amber-500" />
                  Gang Leaderboard
                </CardTitle>
                <CardDescription>
                  The most powerful criminal organizations in the city
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Table>
                  <TableHeader className="bg-gray-900/50">
                    <TableRow>
                      <TableHead className="text-left text-sm font-medium text-gray-400">Rank</TableHead>
                      <TableHead className="text-left text-sm font-medium text-gray-400">Gang</TableHead>
                      <TableHead className="text-left text-sm font-medium text-gray-400">Respect</TableHead>
                      <TableHead className="text-left text-sm font-medium text-gray-400">Bank</TableHead>
                      {!isInGang && <TableHead className="text-right text-sm font-medium text-gray-400">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-800">
                    {gangsList && gangsList.length > 0 ? (
                      gangsList.map((gang: any, index: number) => (
                        <TableRow key={gang.id} className="hover:bg-gray-900/50">
                          <TableCell className="py-3 px-4 font-mono font-bold text-amber-500">#{index + 1}</TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center mr-3">
                                <span className="text-sm font-heading text-white">{gang.tag}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{gang.name}</div>
                                <div className="text-xs text-gray-500">Level {gang.level || 1}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="bg-gray-900/50 text-amber-400 border-amber-800/30">
                              <Trophy className="h-3 w-3 mr-1" /> {gang.respect || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="bg-gray-900/50 text-green-400 border-green-800/30">
                              <DollarSign className="h-3 w-3 mr-1" /> {formatCurrency(gang.bankBalance)}
                            </Badge>
                          </TableCell>
                          {!isInGang && (
                            <TableCell className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary/30 hover:bg-primary/10 hover:text-white text-primary"
                                onClick={() => handleJoinGang(gang.id)}
                                disabled={joinGangMutation.isPending && joinGangMutation.variables === gang.id}
                              >
                                {joinGangMutation.isPending && joinGangMutation.variables === gang.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Join
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isInGang ? 4 : 5} className="text-center py-6 text-gray-500">
                          No gangs found. Be the first to create one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right Column - Sidebar Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gang Info Card */}
          <Card className="bg-dark-surface border-gray-800 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
            
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Shield className="h-5 w-5 mr-2 text-blue-500" />
                Gang System
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400">
                <p className="mb-2">
                  Gangs are powerful criminal organizations that compete for territory, respect, and wealth.
                </p>
              </div>
              
              <Separator className="bg-gray-800 my-4" />
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-amber-500" /> 
                  Gang Hierarchy
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-gray-900/30 rounded p-2">
                    <div className="flex items-center">
                      <Badge className="bg-amber-900/20 border-amber-800/30 text-amber-400 mr-2">Leader</Badge>
                    </div>
                    <span className="text-gray-400">Full control of gang</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-900/30 rounded p-2">
                    <div className="flex items-center">
                      <Badge className="bg-purple-900/20 border-purple-800/30 text-purple-400 mr-2">Underboss</Badge>
                    </div>
                    <span className="text-gray-400">Access to bank & wars</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-900/30 rounded p-2">
                    <div className="flex items-center">
                      <Badge className="bg-blue-900/20 border-blue-800/30 text-blue-400 mr-2">Capo</Badge>
                    </div>
                    <span className="text-gray-400">Can lead missions</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-900/30 rounded p-2">
                    <div className="flex items-center">
                      <Badge className="bg-gray-800/50 border-gray-700/30 text-gray-400 mr-2">Member</Badge>
                    </div>
                    <span className="text-gray-400">Basic privileges</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" variant="outline" asChild>
                <a href="https://mafia-noir.netlify.app/wiki/gangs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Gang System Wiki
                </a>
              </Button>
            </CardContent>
          </Card>
          
          {/* Territories Info Card (if user in gang) */}
          {isInGang && (
            <Card className="bg-dark-surface border-gray-800 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-500"></div>
              
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Award className="h-5 w-5 mr-2 text-red-500" />
                  Gang Status
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Your Rank</div>
                    <Badge className={getRankColorClass(userGangRank)}>
                      {getRankIcon(userGangRank)}
                      {userGangRank}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Gang Level</div>
                    <span className="text-amber-500 font-medium">{userGang?.level || 1}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Territories</div>
                    <span className="text-gray-300 font-medium">0 / 10</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Active Wars</div>
                    <span className="text-gray-300 font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Bank Balance</div>
                    <span className="text-green-500 font-medium">{formatCurrency(userGang?.bankBalance || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// Helper functions
function getRankColorClass(rank: string): string {
  switch (rank) {
    case "Leader":
      return "bg-amber-900/20 border-amber-800/30 text-amber-400";
    case "Underboss":
      return "bg-purple-900/20 border-purple-800/30 text-purple-400";
    case "Capo":
      return "bg-blue-900/20 border-blue-800/30 text-blue-400";
    default:
      return "bg-gray-800/50 border-gray-700/30 text-gray-400";
  }
}

function getRankIcon(rank: string) {
  switch (rank) {
    case "Leader":
      return <Crown className="h-3.5 w-3.5 mr-1.5" />;
    case "Underboss":
      return <Shield className="h-3.5 w-3.5 mr-1.5" />;
    case "Capo":
      return <Award className="h-3.5 w-3.5 mr-1.5" />;
    default:
      return <Users className="h-3.5 w-3.5 mr-1.5" />;
  }
}