import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Info,
  Building2,
  Target,
  Swords,
  BriefcaseBusiness,
  HandCoins,
  LogOut,
  ArrowUp,
  ArrowDown,
  Bomb,
  Hourglass,
  Check
} from "lucide-react";

// Gang creation form schema
const createGangSchema = z.object({
  name: z.string().min(3, "Gang name must be at least 3 characters").max(20, "Gang name must be at most 20 characters"),
  tag: z.string().min(2, "Gang tag must be at least 2 characters").max(5, "Gang tag must be at most 5 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
});

// Bank transaction schema
const bankTransactionSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1").max(999999999, "Amount is too large"),
});

type CreateGangValues = z.infer<typeof createGangSchema>;
type BankTransactionValues = z.infer<typeof bankTransactionSchema>;

// Helper function to get color for rank
function getRankColor(rank: string) {
  switch (rank.toLowerCase()) {
    case 'leader':
      return 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white font-bold';
    case 'underboss':
      return 'bg-gradient-to-r from-red-600 to-red-800 text-white font-bold';
    case 'capo':
      return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
    case 'soldier':
      return 'bg-gradient-to-r from-zinc-600 to-zinc-800 text-white';
    default:
      return 'bg-gray-700 text-white';
  }
}

// Helper function to get icon for rank
function getRankIcon(rank: string) {
  switch (rank.toLowerCase()) {
    case 'leader':
      return <Crown className="h-4 w-4" />;
    case 'underboss':
      return <Skull className="h-4 w-4" />;
    case 'capo':
      return <Shield className="h-4 w-4" />;
    case 'soldier':
      return <Swords className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

export default function NewGangPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [bankAction, setBankAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch all gangs for the leaderboard
  const { data: gangsList, isLoading: gangsLoading, isError: gangsError } = useQuery({
    queryKey: ["/api/gangs"],
  });
  
  // Fetch user profile with gang membership information
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });
  
  // Determine gang membership information
  const gangMember = userProfile?.gangMember;
  
  // Check if user is in a gang
  const inGang = !!userProfile?.inGang || 
                 !!userProfile?.gangId || 
                 !!userProfile?.gang || 
                 !!gangMember ||
                 false;
                 
  const gang = userProfile?.gang;
  const gangRank = userProfile?.gangRank || gangMember?.rank || "Member";
  
  // Get user's gang ID
  const userGangId = gang?.id || userProfile?.gangId || gangMember?.gangId;
  
  // Fetch detailed gang info if user is in a gang
  const { data: gangDetails, isLoading: gangDetailsLoading } = useQuery({
    queryKey: ["/api/gangs", userGangId],
    enabled: !!userGangId, // Only run this query if user has a gang ID
  });

  // Use either the detailed gang info or the basic info from user's profile
  const userGang = gangDetails || gang || null;
  
  // Fetch territories
  const { data: territories, isLoading: territoriesLoading } = useQuery({
    queryKey: ["/api/gangs/territories"],
  });
  
  // Fetch missions
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/gangs/missions"],
    enabled: inGang, // Only fetch missions if user is in a gang
  });
  
  // Fetch active wars
  const { data: activeWars, isLoading: warsLoading } = useQuery({
    queryKey: ["/api/gangs/wars/active"],
  });

  // Create form for gang creation
  const createGangForm = useForm<CreateGangValues>({
    resolver: zodResolver(createGangSchema),
    defaultValues: {
      name: "",
      tag: "",
      description: "",
    },
  });

  // Create form for bank transactions
  const bankForm = useForm<BankTransactionValues>({
    resolver: zodResolver(bankTransactionSchema),
    defaultValues: {
      amount: 1000,
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
        description: `${data.name} has been successfully established!`,
      });
      
      addNotification({
        title: "Gang Established",
        message: `You are now the leader of ${data.name}!`,
        type: "success",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      createGangForm.reset();
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
      
      addNotification({
        title: "Gang Joined",
        message: "Welcome to your new crime family!",
        type: "success",
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
  
  // Leave gang mutation
  const leaveGangMutation = useMutation({
    mutationFn: async (gangId: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gangId}/leave`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gang Left",
        description: data.message || "You've successfully left the gang.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Leave Gang",
        description: error.message || "There was an error leaving the gang. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Bank transaction mutation
  const bankTransactionMutation = useMutation({
    mutationFn: async ({ action, amount, gangId }: { action: 'deposit' | 'withdraw', amount: number, gangId: number }) => {
      const res = await apiRequest("POST", `/api/gangs/${gangId}/bank/${action}`, { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: bankAction === 'deposit' ? "Deposit Successful" : "Withdrawal Successful",
        description: bankAction === 'deposit' 
          ? `You've deposited ${formatCurrency(data.contribution - (gangMember?.contribution || 0))} to your gang's bank.`
          : `You've withdrawn ${formatCurrency(data.userCash - (user?.cash || 0))} from your gang's bank.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", userGangId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Close dialog and reset form
      setIsBankDialogOpen(false);
      bankForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "There was an error processing your transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Territory attack mutation
  const attackTerritoryMutation = useMutation({
    mutationFn: async (territoryId: number) => {
      const res = await apiRequest("POST", `/api/gangs/territories/${territoryId}/attack`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.war) {
        toast({
          title: "War Declared",
          description: `You've initiated a gang war for control of this territory!`,
        });
        
        addNotification({
          title: "Gang War Started",
          message: "Your gang is now at war! Contribute to the war effort to secure victory.",
          type: "warning",
        });
        
        // Set the active tab to wars
        setActiveTab("wars");
      } else {
        toast({
          title: "Territory Claimed",
          description: `Your gang now controls this territory!`,
        });
        
        addNotification({
          title: "Territory Acquired",
          message: `Your gang now controls a new territory that generates ${formatCurrency(data.territory.income)} daily!`,
          type: "success",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/territories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", userGangId] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/wars/active"] });
    },
    onError: (error) => {
      toast({
        title: "Attack Failed",
        description: error.message || "There was an error attacking this territory. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // War contribution mutation
  const contributeToWarMutation = useMutation({
    mutationFn: async ({ warId, amount }: { warId: number, amount: number }) => {
      const res = await apiRequest("POST", `/api/gangs/wars/${warId}/contribute`, { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contribution Successful",
        description: data.message || "You've contributed to the war effort!",
      });
      
      if (data.warStatus === "completed") {
        addNotification({
          title: "War Ended",
          message: "The gang war has ended due to overwhelming force!",
          type: "success",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/wars/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Contribution Failed",
        description: error.message || "There was an error contributing to the war. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Join war mutation
  const joinWarMutation = useMutation({
    mutationFn: async (warId: number) => {
      const res = await apiRequest("POST", `/api/gangs/wars/${warId}/join`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "War Joined",
        description: "You've joined the gang war!",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/wars/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Join War",
        description: error.message || "There was an error joining the war. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Start mission mutation
  const startMissionMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const res = await apiRequest("POST", `/api/gangs/missions/${missionId}/start`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mission Started",
        description: `The mission has been started and will complete in ${Math.round(
          (new Date(data.completesAt).getTime() - new Date().getTime()) / 60000
        )} minutes.`,
      });
      
      addNotification({
        title: "Gang Mission Underway",
        message: "Your gang has started a new mission. Check back when it's complete to collect rewards!",
        type: "info",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", userGangId] });
      
      // Reset selected mission
      setSelectedMissionId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Mission",
        description: error.message || "There was an error starting the mission. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Collect mission rewards mutation
  const collectMissionRewardsMutation = useMutation({
    mutationFn: async (attemptId: number) => {
      const res = await apiRequest("POST", `/api/gangs/missions/attempts/${attemptId}/collect`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rewards Collected",
        description: `Your gang has received ${formatCurrency(data.rewards.cash)} in cash and gained ${data.rewards.experience} experience and ${data.rewards.respect} respect!`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", userGangId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Collect Rewards",
        description: error.message || "There was an error collecting the mission rewards. Please try again.",
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
  
  // Handle leaving a gang
  const handleLeaveGang = (gangId: number) => {
    if (confirm("Are you sure you want to leave this gang? This action cannot be undone.")) {
      leaveGangMutation.mutate(gangId);
    }
  };
  
  // Handle bank transactions
  const handleBankTransaction = (data: BankTransactionValues) => {
    if (!userGangId) return;
    
    bankTransactionMutation.mutate({
      action: bankAction,
      amount: data.amount,
      gangId: userGangId
    });
  };
  
  // Handle attacking a territory
  const handleAttackTerritory = (territoryId: number) => {
    if (confirm("Are you sure you want to attack this territory? This might start a gang war!")) {
      attackTerritoryMutation.mutate(territoryId);
    }
  };
  
  // Handle contributing to a war
  const handleWarContribution = (warId: number, amount: number) => {
    if (amount <= 0 || amount > (user?.cash || 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to contribute.",
        variant: "destructive",
      });
      return;
    }
    
    contributeToWarMutation.mutate({ warId, amount });
  };
  
  // Handle joining a war
  const handleJoinWar = (warId: number) => {
    joinWarMutation.mutate(warId);
  };
  
  // Handle starting a mission
  const handleStartMission = (missionId: number) => {
    startMissionMutation.mutate(missionId);
  };
  
  // Handle collecting mission rewards
  const handleCollectMissionRewards = (attemptId: number) => {
    collectMissionRewardsMutation.mutate(attemptId);
  };

  // Check if still loading
  const isLoading = userLoading || gangsLoading || profileLoading || gangDetailsLoading;

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading gang data...</p>
        </div>
      </div>
    );
  }

  // Show error if user data couldn't be loaded
  if (userError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load user data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Show main content
  return (
    <div className="container py-6 space-y-8">
      <PageHeader
        title="Gang Operations"
        description="Join a criminal organization or start your own criminal empire"
        icon={<Users className="h-6 w-6" />}
      />

      {/* Gang Status Section */}
      {inGang && userGang ? (
        // User is in a gang - show gang details
        <Card className="border-2 border-primary/20 bg-black/50">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">
                  <span className="mr-2">{userGang.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {userGang.tag}
                  </Badge>
                </CardTitle>
                <CardDescription>{userGang.description || "No description available."}</CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge className={`${getRankColor(gangRank)} flex items-center gap-1`}>
                  {getRankIcon(gangRank)} {gangRank}
                </Badge>
                
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> 
                    {formatCurrency(userGang.bankBalance || 0)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> 
                    {userGang.memberCount || '1'} Members
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="territories">Territories</TabsTrigger>
                <TabsTrigger value="wars">Gang Wars</TabsTrigger>
                <TabsTrigger value="missions">Missions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gang Stats */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Gang Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Level</span>
                            <span className="font-medium">{userGang.level}</span>
                          </div>
                          <Progress value={(userGang.experience || 0) / (userGang.level * 1000) * 100} className="h-2 mt-1" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Respect</span>
                          <span className="text-sm font-medium">{userGang.respect || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Strength</span>
                          <span className="text-sm font-medium">{userGang.strength || 10}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Defense</span>
                          <span className="text-sm font-medium">{userGang.defense || 10}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Bank Balance</span>
                          <span className="text-sm font-medium">{formatCurrency(userGang.bankBalance || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Your Contribution</span>
                          <span className="text-sm font-medium">{formatCurrency(gangMember?.contribution || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Gang Bank Operations */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Gang Bank</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Contribute to your gang's bank to help fund operations and boost your gang's standing.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBankAction('deposit');
                            setIsBankDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <ArrowUp className="h-4 w-4" /> Deposit
                        </Button>
                        
                        {(gangRank === 'Leader' || gangRank === 'Underboss') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setBankAction('withdraw');
                              setIsBankDialogOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <ArrowDown className="h-4 w-4" /> Withdraw
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Gang Status Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Gang Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 p-4 rounded-md flex items-center gap-3">
                        <Building2 className="h-10 w-10 text-primary/80" />
                        <div>
                          <p className="text-lg font-medium">
                            {territories?.filter(t => t.controlledBy === userGangId)?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Territories Controlled</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 p-4 rounded-md flex items-center gap-3">
                        <Swords className="h-10 w-10 text-red-500/80" />
                        <div>
                          <p className="text-lg font-medium">
                            {activeWars?.filter(w => 
                              w.attackerId === userGangId || w.defenderId === userGangId
                            )?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Active Gang Wars</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 p-4 rounded-md flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-amber-500/80" />
                        <div>
                          <p className="text-lg font-medium">
                            {userGang.activeMissions?.length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Active Missions</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="members" className="space-y-4">
                {/* Members Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Gang Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userGang.members && userGang.members.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead>Contribution</TableHead>
                            <TableHead>Joined</TableHead>
                            {gangRank === 'Leader' && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userGang.members.map((member) => (
                            <TableRow key={member.userId}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {member.user.avatar && (
                                    <img 
                                      src={member.user.avatar} 
                                      alt={member.user.username}
                                      className="h-6 w-6 rounded-full"
                                    />
                                  )}
                                  {member.user.username}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getRankColor(member.rank)} flex items-center gap-1`}>
                                  {getRankIcon(member.rank)} {member.rank}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(member.contribution || 0)}</TableCell>
                              <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                              {gangRank === 'Leader' && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {member.rank !== 'Leader' && member.rank !== 'Underboss' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => {
                                          // Promote member logic
                                        }}
                                      >
                                        <ArrowUp className="h-3 w-3 mr-1" /> Promote
                                      </Button>
                                    )}
                                    {member.rank !== 'Leader' && member.rank !== 'Soldier' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => {
                                          // Demote member logic
                                        }}
                                      >
                                        <ArrowDown className="h-3 w-3 mr-1" /> Demote
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No members found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="territories" className="space-y-4">
                {/* Territories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {territories && territories.map((territory) => (
                    <Card key={territory.id} className={territory.controlledBy === userGangId ? "border-2 border-primary/50" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                          <span>{territory.name}</span>
                          {territory.controlledBy && (
                            <Badge variant="outline">
                              {gangsList?.find(g => g.id === territory.controlledBy)?.name || "Unknown Gang"}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{territory.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/20 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Daily Income</p>
                            <p className="font-medium">{formatCurrency(territory.income || 0)}</p>
                          </div>
                          <div className="bg-black/20 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Defense Bonus</p>
                            <p className="font-medium">+{territory.defenseBonus || 0}%</p>
                          </div>
                        </div>
                        
                        {territory.controlledBy === userGangId ? (
                          <Alert className="bg-primary/10 border-primary/30">
                            <Shield className="h-4 w-4" />
                            <AlertTitle>Under Your Control</AlertTitle>
                            <AlertDescription className="text-xs">
                              Your gang controls this territory and earns {formatCurrency(territory.income || 0)} per day.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="pt-2">
                            {inGang && (gangRank === 'Leader' || gangRank === 'Underboss') && (
                              <Button 
                                onClick={() => handleAttackTerritory(territory.id)}
                                className="w-full flex items-center gap-2"
                                disabled={
                                  territory.attackCooldown && new Date(territory.attackCooldown) > new Date() ||
                                  attackTerritoryMutation.isPending
                                }
                              >
                                {attackTerritoryMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Target className="h-4 w-4" />
                                )}
                                Attack Territory
                              </Button>
                            )}
                            
                            {territory.attackCooldown && new Date(territory.attackCooldown) > new Date() && (
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                Available in {Math.ceil((new Date(territory.attackCooldown).getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!territories || territories.length === 0) && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No territories found.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="wars" className="space-y-4">
                {/* Gang Wars Section */}
                {activeWars && activeWars.length > 0 ? (
                  <div className="space-y-4">
                    {activeWars
                      .filter(w => w.attackerId === userGangId || w.defenderId === userGangId)
                      .map((war) => {
                        const isAttacker = war.attackerId === userGangId;
                        const attackerName = gangsList?.find(g => g.id === war.attackerId)?.name || "Unknown Gang";
                        const defenderName = gangsList?.find(g => g.id === war.defenderId)?.name || "Unknown Gang";
                        const territory = territories?.find(t => t.id === war.territoryId);
                        
                        return (
                          <Card key={war.id} className="border-2 border-red-900/50">
                            <CardHeader className="pb-2 bg-gradient-to-r from-red-950/50 to-black/20">
                              <CardTitle className="text-lg">
                                Gang War: {attackerName} vs {defenderName}
                              </CardTitle>
                              <CardDescription>
                                {isAttacker ? "You are attacking" : "You are defending"} {territory ? `for control of ${territory.name}` : ""}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="bg-black/30 p-4 rounded-md">
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">{attackerName}</span>
                                  <span className="text-sm font-medium">{defenderName}</span>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-red-600 to-amber-500"
                                    style={{ 
                                      width: `${(war.attackStrength / (war.attackStrength + war.defenseStrength || 1)) * 100}%` 
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                  <span>Attack: {formatCurrency(war.attackStrength)}</span>
                                  <span>Defense: {formatCurrency(war.defenseStrength)}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Input 
                                  type="number" 
                                  placeholder="Contribution amount" 
                                  id={`war-contribution-${war.id}`}
                                  min={100}
                                  max={user?.cash || 0}
                                  defaultValue={Math.min(1000, user?.cash || 0)}
                                />
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById(`war-contribution-${war.id}`) as HTMLInputElement;
                                    const amount = parseInt(input.value);
                                    handleWarContribution(war.id, amount);
                                  }}
                                  disabled={contributeToWarMutation.isPending}
                                  className="shrink-0"
                                >
                                  {contributeToWarMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <HandCoins className="h-4 w-4 mr-1" />
                                  )}
                                  Contribute
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                    {/* Other Active Wars */}
                    {activeWars
                      .filter(w => w.attackerId !== userGangId && w.defenderId !== userGangId)
                      .length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Other Active Wars</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Attacker</TableHead>
                                  <TableHead>Defender</TableHead>
                                  <TableHead>Territory</TableHead>
                                  <TableHead>Progress</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {activeWars
                                  .filter(w => w.attackerId !== userGangId && w.defenderId !== userGangId)
                                  .map((war) => {
                                    const attackerName = gangsList?.find(g => g.id === war.attackerId)?.name || "Unknown Gang";
                                    const defenderName = gangsList?.find(g => g.id === war.defenderId)?.name || "Unknown Gang";
                                    const territory = territories?.find(t => t.id === war.territoryId);
                                    
                                    return (
                                      <TableRow key={war.id}>
                                        <TableCell>{attackerName}</TableCell>
                                        <TableCell>{defenderName}</TableCell>
                                        <TableCell>{territory?.name || "Unknown"}</TableCell>
                                        <TableCell>
                                          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-red-600"
                                              style={{ 
                                                width: `${(war.attackStrength / (war.attackStrength + war.defenseStrength || 1)) * 100}%` 
                                              }}
                                            />
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Swords className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No active gang wars found.</p>
                    <p className="text-sm mt-2">Gang wars start when a gang attacks a territory controlled by another gang.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="missions" className="space-y-4">
                {/* Gang Missions Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Active Missions */}
                  {userGang.activeMissions && userGang.activeMissions.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Active Missions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {userGang.activeMissions.map((mission) => {
                            const isComplete = mission.attempt.status === "completed" || 
                              (mission.attempt.completedAt && new Date(mission.attempt.completedAt) <= new Date());
                            const progress = isComplete ? 100 : Math.min(
                              100,
                              ((new Date().getTime() - new Date(mission.attempt.startedAt).getTime()) /
                              (new Date(mission.attempt.completedAt).getTime() - new Date(mission.attempt.startedAt).getTime())) * 100
                            );
                            
                            return (
                              <Card key={mission.attempt.id} className="border-primary/20">
                                <CardHeader className="pb-1">
                                  <CardTitle className="text-base">{mission.name}</CardTitle>
                                  <CardDescription>{mission.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <Progress value={progress} className="h-2" />
                                  
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Started: {new Date(mission.attempt.startedAt).toLocaleTimeString()}</span>
                                    <span>
                                      {isComplete ? 
                                        "Completed" : 
                                        `Completes: ${new Date(mission.attempt.completedAt).toLocaleTimeString()}`}
                                    </span>
                                  </div>
                                  
                                  <div className="pt-2">
                                    {isComplete && mission.attempt.status === "completed" && (
                                      gangRank === "Leader" || gangRank === "Underboss" ? (
                                        <Button
                                          className="w-full flex items-center gap-2"
                                          onClick={() => handleCollectMissionRewards(mission.attempt.id)}
                                          disabled={collectMissionRewardsMutation.isPending}
                                        >
                                          {collectMissionRewardsMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <HandCoins className="h-4 w-4" />
                                          )}
                                          Collect Rewards
                                        </Button>
                                      ) : (
                                        <Alert>
                                          <Info className="h-4 w-4" />
                                          <AlertTitle>Ready for Collection</AlertTitle>
                                          <AlertDescription className="text-xs">
                                            Ask your gang leader or underboss to collect the mission rewards.
                                          </AlertDescription>
                                        </Alert>
                                      )
                                    )}
                                    
                                    {!isComplete && (
                                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-black/20 p-2 rounded">
                                          <p className="text-muted-foreground">Cash</p>
                                          <p className="font-medium">{formatCurrency(mission.cashReward)}</p>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded">
                                          <p className="text-muted-foreground">Respect</p>
                                          <p className="font-medium">+{mission.respectReward}</p>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded">
                                          <p className="text-muted-foreground">XP</p>
                                          <p className="font-medium">+{mission.experienceReward}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                
                  {/* Available Missions */}
                  {missions && missions.length > 0 ? (
                    missions.map((mission) => (
                      <Card key={mission.id} className={selectedMissionId === mission.id ? "border-primary" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">{mission.name}</CardTitle>
                            <Badge>
                              {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
                            </Badge>
                          </div>
                          <CardDescription>{mission.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-black/20 p-2 rounded">
                              <p className="text-muted-foreground">Cash</p>
                              <p className="font-medium">{formatCurrency(mission.cashReward)}</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded">
                              <p className="text-muted-foreground">Respect</p>
                              <p className="font-medium">+{mission.respectReward}</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded">
                              <p className="text-muted-foreground">XP</p>
                              <p className="font-medium">+{mission.experienceReward}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Duration: {mission.duration} min</span>
                            <span>Members: {mission.requiredMembers}+</span>
                            <span>Cooldown: {mission.cooldown} min</span>
                          </div>
                          
                          <div className="pt-2">
                            <Button
                              variant={selectedMissionId === mission.id ? "default" : "outline"}
                              className="w-full flex items-center gap-2"
                              onClick={() => setSelectedMissionId(mission.id)}
                              disabled={!mission.canAttempt}
                            >
                              {mission.canAttempt ? (
                                <><Target className="h-4 w-4" /> Select Mission</>
                              ) : (
                                mission.onCooldown ? (
                                  <><Hourglass className="h-4 w-4" /> On Cooldown</>
                                ) : (
                                  <><AlertTriangle className="h-4 w-4" /> Not Enough Members</>
                                )
                              )}
                            </Button>
                            
                            {mission.onCooldown && mission.cooldownEnds && (
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                Available in {Math.ceil((new Date(mission.cooldownEnds).getTime() - new Date().getTime()) / (1000 * 60))} minutes
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      <BriefcaseBusiness className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No missions available.</p>
                    </div>
                  )}
                </div>
                
                {/* Mission Action Bar */}
                {selectedMissionId && (
                  <div className="sticky bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-primary/20 rounded-t-lg">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                      <div>
                        <p className="font-medium">
                          {missions?.find(m => m.id === selectedMissionId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(missions?.find(m => m.id === selectedMissionId)?.cashReward || 0)} reward
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMissionId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (selectedMissionId) {
                              handleStartMission(selectedMissionId);
                            }
                          }}
                          disabled={startMissionMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {startMissionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <BriefcaseBusiness className="h-4 w-4 mr-1" />
                          )}
                          Start Mission
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              Founded on {new Date(userGang.createdAt).toLocaleDateString()}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={() => handleLeaveGang(userGangId)}
              disabled={leaveGangMutation.isPending}
            >
              {leaveGangMutation.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <LogOut className="h-3 w-3 mr-1" />
              )}
              Leave Gang
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // User is not in a gang - show list of gangs to join or create a new one
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available Gangs</h2>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create Gang
            </Button>
          </div>

          {gangsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load gangs. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Display list of gangs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gangsList && gangsList.length > 0 ? (
              gangsList.map((gang) => (
                <Card key={gang.id} className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        {gang.name}
                        <Badge variant="outline" className="text-xs">
                          {gang.tag}
                        </Badge>
                      </CardTitle>
                      <Badge className="ml-auto">
                        {gang.memberCount} {gang.memberCount === 1 ? "Member" : "Members"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {gang.description || "No description available."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bank Balance:</span>
                        <span>{formatCurrency(gang.bankBalance || 0)}</span>
                      </div>
                      
                      <Button
                        className="w-full mt-2"
                        onClick={() => handleJoinGang(gang.id)}
                        disabled={joinGangMutation.isPending}
                      >
                        {joinGangMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Join Gang
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 border border-dashed rounded-lg">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">No Gangs Available</h3>
                <p className="text-muted-foreground">
                  Be the first to create a gang and establish your criminal empire!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Gang Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Gang</DialogTitle>
            <DialogDescription>
              Form your own criminal organization and recruit other players to join your cause.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createGangForm}>
            <form onSubmit={createGangForm.handleSubmit(onCreateGangSubmit)} className="space-y-4">
              <FormField
                control={createGangForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gang Name</FormLabel>
                    <FormControl>
                      <Input placeholder="The Untouchables" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGangForm.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gang Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="TUT" maxLength={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createGangForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of your gang..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert className="bg-amber-900/20 border-amber-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Creation Cost</AlertTitle>
                <AlertDescription className="text-xs">
                  Creating a gang costs {formatCurrency(10000)}. This fee is non-refundable.
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createGangMutation.isPending || (user?.cash || 0) < 10000}
                >
                  {createGangMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Gang
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Bank Transaction Dialog */}
      <Dialog
        open={isBankDialogOpen}
        onOpenChange={setIsBankDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bankAction === 'deposit' ? 'Deposit to Gang Bank' : 'Withdraw from Gang Bank'}
            </DialogTitle>
            <DialogDescription>
              {bankAction === 'deposit'
                ? 'Contribute money to your gang to help fund operations.'
                : 'Withdraw money from your gang bank for operational expenses.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bankForm}>
            <form onSubmit={bankForm.handleSubmit(handleBankTransaction)} className="space-y-4">
              <FormField
                control={bankForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        {...field} 
                        min={1}
                        max={bankAction === 'deposit' ? user?.cash : userGang?.bankBalance}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bankAction === 'deposit'
                        ? `Available cash: ${formatCurrency(user?.cash || 0)}`
                        : `Bank balance: ${formatCurrency(userGang?.bankBalance || 0)}`}
                    </p>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBankDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    bankTransactionMutation.isPending || 
                    (bankAction === 'deposit' && (user?.cash || 0) < (bankForm.getValues().amount || 0)) ||
                    (bankAction === 'withdraw' && (userGang?.bankBalance || 0) < (bankForm.getValues().amount || 0))
                  }
                >
                  {bankTransactionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    bankAction === 'deposit' ? (
                      <ArrowUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-2" />
                    )
                  )}
                  {bankAction === 'deposit' ? 'Deposit' : 'Withdraw'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}