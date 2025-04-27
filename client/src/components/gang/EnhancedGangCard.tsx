import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  Clock, 
  LogOut, 
  Shield, 
  Skull, 
  Award, 
  Crown, 
  ExternalLink, 
  ShieldPlus,
  MapPin,
  ChevronUp,
  Swords,
  Briefcase,
  CheckCircle,
  Target,
  UserPlus,
  UserCheck,
  Home,
  BarChart,
  TrendingUp,
  Timer,
  DollarSign as CircleDollarSign,
  UserMinus,
  Folder,
  ListChecks,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gang } from "@shared/schema";
import { useNotification } from "@/hooks/use-notification";

interface GangCardProps {
  gang: Gang & { members?: { id: number; username: string; role: string; user?: any; contribution?: number }[] };
  isUserInGang: boolean;
  userRank?: string; // The user's role in the gang, keeping the name "userRank" for API compatibility
  userId: number;
}

export function EnhancedGangCard({ gang, isUserInGang, userRank, userId }: GangCardProps) {
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const canWithdraw = isUserInGang && (userRank === "Leader" || userRank === "Underboss");
  const isLeader = isUserInGang && userRank === "Leader";
  
  // Get user's member object - find by user ID
  const userMember = gang.members?.find(member => {
    if (member.user?.id === userId) return true;
    // If member has a userId property directly
    if (member.userId === userId) return true;
    return false;
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gang.id}/bank/deposit`, {
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Successful",
        description: `You've deposited ${formatCurrency(parseInt(depositAmount))} to the gang bank.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", gang.id] });
      setIsDepositDialogOpen(false);
      setDepositAmount("");
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "There was an error making your deposit.",
        variant: "destructive",
      });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/gangs/${gang.id}/bank/withdraw`, {
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Successful",
        description: `You've withdrawn ${formatCurrency(parseInt(withdrawAmount))} from the gang bank.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gangs", gang.id] });
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "There was an error making your withdrawal.",
        variant: "destructive",
      });
    }
  });
  
  const leaveGangMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gangs/${gang.id}/leave`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Left Gang",
        description: data.message || "You have successfully left the gang.",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Gang Membership Ended",
        message: `You have left ${gang.name} [${gang.tag}]`,
        type: "info",
        read: false,
        timestamp: new Date(),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/gangs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsLeaveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Leave Gang",
        description: error.message || "There was an error leaving the gang.",
        variant: "destructive",
      });
    }
  });

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };
  
  const handleLeaveGang = () => {
    leaveGangMutation.mutate();
  };

  // Calculate gang level progress
  const levelProgress = ((gang.experience || 0) % 1000) / 10;
  
  // Render gang badge/emblem with logo if available
  const GangEmblem = () => (
    <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-primary/90 to-purple-700/90 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white/30 rounded-md"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_70%)]"></div>
      </div>
      {gang.logo ? (
        <img 
          src={gang.logo} 
          alt={`${gang.name} logo`} 
          className="w-20 h-20 rounded-lg object-cover z-10"
        />
      ) : (
        <span className="font-heading text-4xl text-white drop-shadow-md relative z-10">{gang.tag}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Gang Card - Header with info */}
      <Card className="bg-dark-surface border-gray-800 overflow-hidden relative">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-600 to-blue-600"></div>
        
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <GangEmblem />
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-3xl font-heading">{gang.name}</CardTitle>
                  <Badge variant="outline" className="bg-gray-800/60 border-gray-700 font-mono text-primary-foreground">
                    {gang.tag}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-800/60 border-gray-700">
                    <Users className="h-3.5 w-3.5" /> 
                    {gang.members?.length || 0} Members
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-800/60 border-gray-700">
                    <Award className="h-3.5 w-3.5" /> 
                    Level {gang.level || 1}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-800/60 border-gray-700">
                    <Skull className="h-3.5 w-3.5" /> 
                    {gang.respect || 0} Respect
                  </Badge>
                </div>
                
                {isUserInGang && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Badge className={getRankColor(userRank || "Soldier").badge}>
                      {getRankIcon(userRank || "Soldier")}
                      {userRank || "Soldier"}
                    </Badge>
                    <span className="text-gray-400">• Member since {formatDate(userMember?.joinedAt || "")}</span>
                  </div>
                )}
              </div>
            </div>
            
            {isUserInGang && (
              <div className="flex flex-col gap-2 min-w-[180px]">
                <div className="rounded-md border border-gray-800 p-3 bg-gray-900/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Treasury</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(gang.bankBalance)}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-8 border-gray-700 bg-gray-800/50 text-xs"
                      onClick={() => setIsDepositDialogOpen(true)}
                    >
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      Deposit
                    </Button>
                    
                    {canWithdraw && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 border-gray-700 bg-gray-800/50 text-xs"
                        onClick={() => setIsWithdrawDialogOpen(true)}
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
                
                {isUserInGang && (
                  <div className="rounded-md border border-gray-800 p-2 bg-gray-900/50">
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-400">Gang Level Progress</span>
                      <span className="text-primary">{levelProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={levelProgress} className="h-2 bg-gray-800" indicatorClassName="bg-gradient-to-r from-primary to-purple-600" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {gang.description && (
            <CardDescription className="text-gray-300 mt-4 rounded-md bg-gray-800/50 p-3 border border-gray-800">
              "{gang.description}"
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pt-2">
          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="w-full mb-6 bg-gray-900/50 border border-gray-800 grid grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger 
                value="overview" 
                className="py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Home className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4" />
                <span>Members</span>
              </TabsTrigger>
              <TabsTrigger 
                value="operations" 
                className="py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ListChecks className="h-4 w-4" />
                <span>Operations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="territories" 
                className="py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MapPin className="h-4 w-4" />
                <span>Territory</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:col-span-1 col-span-2"
              >
                <Folder className="h-4 w-4" />
                <span>Management</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Strength"
                  value={gang.strength || 10}
                  icon={<ShieldPlus className="h-5 w-5 text-blue-400" />}
                  description="Gang's offensive power"
                  valueColor="text-blue-400"
                />
                <StatCard
                  title="Defense"
                  value={gang.defense || 10}
                  icon={<Shield className="h-5 w-5 text-emerald-400" />}
                  description="Gang's defensive capability"
                  valueColor="text-emerald-400"
                />
                <StatCard
                  title="Total Respect"
                  value={gang.respect || 0}
                  icon={<Award className="h-5 w-5 text-amber-400" />}
                  description="Reputation in the criminal world"
                  valueColor="text-amber-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gang Activity Feed */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3">
                      <ActivityItem
                        time="Just now"
                        title="Member Joined"
                        description="kukpetter joined the gang"
                        icon={<UserJoinIcon />}
                      />
                      <ActivityItem
                        time="2 hrs ago"
                        title="Bank Deposit"
                        description="Leader deposited $10,000"
                        icon={<BankDepositIcon />}
                      />
                      <ActivityItem
                        time="1 day ago"
                        title="Gang Created"
                        description="The Black Hand Mafia was established"
                        icon={<GangCreatedIcon />}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Member Contribution Leaderboard */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-gray-400" />
                      Top Contributors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3">
                      {gang.members && gang.members.length > 0 ? (
                        gang.members
                          .sort((a, b) => (b.contribution || 0) - (a.contribution || 0))
                          .slice(0, 3)
                          .map((member, index) => {
                            const username = member.user?.username || member.username || "Unknown";
                            return (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-800/40 rounded-md">
                                <div className="font-bold text-lg text-gray-500 w-6 text-center">
                                  #{index + 1}
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankColor(member.role).bg}`}>
                                  {member.user?.avatar ? (
                                    <img 
                                      src={member.user.avatar} 
                                      alt={username} 
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="text-xs text-white">{getInitials(username)}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{username}</div>
                                  <div className="text-xs text-gray-400">{member.role}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-primary">
                                    {formatCurrency(member.contribution || 0)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {getContributionRank(member.contribution || 0)}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No member contributions yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Your Contribution Card */}
              {isUserInGang && (
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      Your Gang Contribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <div className="bg-gray-900/50 rounded-md p-3 border border-gray-800">
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="text-gray-400">Total Contribution</span>
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-medium">
                                {userMember?.contribution ? formatCurrency(userMember.contribution) : "$0"}
                              </span>
                              <Badge variant="outline" className="bg-amber-950/20 border-amber-900/30 text-amber-500 text-[10px]">
                                {getContributionRank(userMember?.contribution || 0)}
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={getContributionPercent(userMember?.contribution || 0)} 
                            className="h-2.5 bg-gray-800" 
                            indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-300" 
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>$0</span>
                            <span>$25k</span>
                            <span>$50k</span>
                            <span>$75k</span>
                            <span>$100k+</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          <p>Contribute more to the gang treasury to increase your rank and earn perks.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <Button
                          onClick={() => setIsDepositDialogOpen(true)}
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Contribute Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Members Tab */}
            <TabsContent value="members" className="mt-0">
              <Card className="bg-gray-900/30 border-gray-800">
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      Gang Members ({gang.members?.length || 0})
                    </CardTitle>
                    {isUserInGang && (isLeader || userRank === "Underboss") && (
                      <Button size="sm" variant="outline" className="h-8">
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2">
                    {/* Leadership section - Leaders and Underbosses */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 text-primary/80">Leadership</h3>
                      <div className="space-y-2">
                        {gang.members?.filter(m => 
                          m.role === "Leader" || m.role === "Underboss"
                        ).map((member) => {
                          // Get username from user object if available, or directly from member
                          const username = member.user?.username || member.username || "Unknown";
                          // Get member ID from user object if available, or directly from member
                          const memberId = member.user?.id || member.userId;
                          return (
                            <div 
                              key={member.id} 
                              className={`flex justify-between items-center p-3 rounded-md ${memberId === userId ? 'bg-primary/10 border border-primary/20' : 'bg-gray-800/70 border border-gray-700/50'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(member.role).bg}`}>
                                  {member.user?.avatar ? (
                                    <img 
                                      src={member.user.avatar} 
                                      alt={username} 
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="text-xs text-white">{getInitials(username)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{username}</span>
                                    {memberId === userId && (
                                      <Badge variant="outline" className="text-xs h-5 px-1.5 bg-primary/20 border-primary/30 text-primary">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>Joined {formatDate(member.joinedAt || "")}</span>
                                    {member.contribution !== undefined && (
                                      <span className="text-primary/80">
                                        • {formatCurrency(member.contribution)} contributed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`${getRankColor(member.role).badge} py-1.5 px-2.5 flex items-center gap-1.5`}
                                >
                                  {getRankIcon(member.role)}
                                  {member.role}
                                </Badge>
                                
                                {/* Show management options for leaders/admins */}
                                {isLeader && memberId !== userId && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Regular members - Capos and Soldiers */}
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-gray-400">Members</h3>
                      <div className="space-y-2">
                        {gang.members?.filter(m => 
                          m.role !== "Leader" && m.role !== "Underboss"
                        ).map((member) => {
                          // Get username from user object if available, or directly from member
                          const username = member.user?.username || member.username || "Unknown";
                          // Get member ID from user object if available, or directly from member
                          const memberId = member.user?.id || member.userId;
                          return (
                            <div 
                              key={member.id} 
                              className={`flex justify-between items-center p-3 rounded-md ${memberId === userId ? 'bg-primary/10 border border-primary/20' : 'bg-gray-800/50 border border-gray-700/30'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(member.role).bg}`}>
                                  {member.user?.avatar ? (
                                    <img 
                                      src={member.user.avatar} 
                                      alt={username} 
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="text-xs text-white">{getInitials(username)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">{username}</span>
                                    {memberId === userId && (
                                      <Badge variant="outline" className="text-xs h-5 px-1.5 bg-primary/20 border-primary/30 text-primary">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>Joined {formatDate(member.joinedAt || "")}</span>
                                    {member.contribution !== undefined && (
                                      <span className="text-primary/80">
                                        • {formatCurrency(member.contribution)} contributed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`${getRankColor(member.role).badge} py-1.5 px-2.5 flex items-center gap-1.5`}
                                >
                                  {getRankIcon(member.role)}
                                  {member.role}
                                </Badge>
                                
                                {/* Show promote option for leaders/admins */}
                                {(isLeader || userRank === "Underboss") && memberId !== userId && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Empty state if no regular members */}
                        {gang.members?.filter(m => 
                          m.role !== "Leader" && m.role !== "Underboss"
                        ).length === 0 && (
                          <div className="text-center py-6 text-gray-500 bg-gray-800/30 rounded-md border border-gray-700/30">
                            No regular members yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Operations Tab */}
            <TabsContent value="operations" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Active Operations */}
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-400" />
                        Active Gang Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      {gang.activeMissions && gang.activeMissions.length > 0 ? (
                        <div className="space-y-3">
                          {gang.activeMissions.map((mission, idx) => (
                            <div key={idx} className="border border-gray-700/50 rounded-md p-3 bg-gray-800/60">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">Operation #{mission.id}</h4>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Started {formatDate(mission.startedAt || "")}
                                  </p>
                                </div>
                                <Badge className="bg-blue-900/30 text-blue-400 border-blue-700/30">
                                  In Progress
                                </Badge>
                              </div>
                              
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1 text-xs">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-blue-400">64%</span>
                                </div>
                                <Progress value={64} className="h-2 bg-gray-700" indicatorClassName="bg-blue-500" />
                              </div>
                              
                              <div className="flex justify-end mt-3">
                                <Button size="sm" variant="outline" className="h-7 text-xs bg-gray-800/70">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Check Status
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-gray-700/30 rounded-md p-6 bg-gray-800/30 text-center">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-gray-500" />
                          </div>
                          <h3 className="text-base font-medium mb-1">No Active Operations</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Your gang doesn't have any active operations at the moment.
                          </p>
                          <Button size="sm" className="mx-auto">
                            <BriefcaseBusiness className="h-4 w-4 mr-2" />
                            Start New Operation
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Available Operations */}
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-400" />
                        Available Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="border border-gray-700/30 rounded-md p-6 bg-gray-800/30 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
                          <FolderKanban className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-base font-medium mb-1">Operations Coming Soon</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Gang operations are still being established in the criminal underworld.
                        </p>
                        <Button size="sm" className="mx-auto" disabled>
                          <FolderKanban className="h-4 w-4 mr-2" />
                          Browse Operations
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Operations Stats */}
                <div className="space-y-6">
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-gray-400" />
                        Operation Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="space-y-4">
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Completed</span>
                            <span className="text-xl font-bold">0</span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Success Rate</span>
                            <span className="text-xl font-bold">0%</span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Total Earnings</span>
                            <span className="text-xl font-bold text-green-500">$0</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-gray-400" />
                        Operation Rewards
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          Complete operations to earn rewards for your gang
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="p-2 bg-gray-800 rounded-md border border-gray-700/30">
                            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <span className="text-xs text-gray-400 block">Cash</span>
                          </div>
                          <div className="p-2 bg-gray-800 rounded-md border border-gray-700/30">
                            <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                            <span className="text-xs text-gray-400 block">Respect</span>
                          </div>
                          <div className="p-2 bg-gray-800 rounded-md border border-gray-700/30">
                            <Shield className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <span className="text-xs text-gray-400 block">Strength</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Territories Tab */}
            <TabsContent value="territories" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Controlled Territories */}
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-400" />
                        Controlled Territories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      {gang.territories && gang.territories.length > 0 ? (
                        <div className="space-y-3">
                          {gang.territories.map((territory, idx) => (
                            <div key={idx} className="border border-gray-700/50 rounded-md p-3 bg-gray-800/60">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{territory.name}</h4>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {territory.description}
                                  </p>
                                </div>
                                <Badge className="bg-green-900/30 text-green-400 border-green-700/30">
                                  Controlled
                                </Badge>
                              </div>
                              
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="text-xs text-gray-400">
                                  <span className="block">Daily Income</span>
                                  <span className="text-green-400 font-medium">{formatCurrency(territory.income || 0)}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  <span className="block">Defense Bonus</span>
                                  <span className="text-blue-400 font-medium">+{territory.defenseBonus || 0}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-gray-700/30 rounded-md p-6 bg-gray-800/30 text-center">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
                            <MapPin className="h-6 w-6 text-gray-500" />
                          </div>
                          <h3 className="text-base font-medium mb-1">No Controlled Territories</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Your gang doesn't control any territories yet. Capture territories to gain income and bonuses.
                          </p>
                          <Button size="sm" className="mx-auto">
                            <Target className="h-4 w-4 mr-2" />
                            View Available Territories
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Active Wars */}
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Swords className="h-4 w-4 text-red-500" />
                        Active Gang Wars
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      {gang.activeWars && gang.activeWars.length > 0 ? (
                        <div className="space-y-3">
                          {gang.activeWars.map((war, idx) => (
                            <div key={idx} className="border border-red-900/30 rounded-md p-3 bg-red-950/10">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-red-400">War against {war.defenderName || war.attackerName}</h4>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Started {formatDate(war.startTime || "")}
                                  </p>
                                </div>
                                <Badge className="bg-red-900/30 text-red-400 border-red-700/30">
                                  <Swords className="h-3.5 w-3.5 mr-1.5" />
                                  Active War
                                </Badge>
                              </div>
                              
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1 text-xs">
                                  <span className="text-gray-400">War progress</span>
                                </div>
                                <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                                  <div className="flex h-full">
                                    <div 
                                      className="bg-red-600" 
                                      style={{ width: `${getWarProgressPercent(war.attackStrength || 0, war.defenseStrength || 0, true)}%` }}
                                    />
                                    <div 
                                      className="bg-blue-600" 
                                      style={{ width: `${getWarProgressPercent(war.attackStrength || 0, war.defenseStrength || 0, false)}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                  <span className="text-red-400">Attack: {war.attackStrength || 0}</span>
                                  <span className="text-blue-400">Defense: {war.defenseStrength || 0}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-end mt-3 gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs bg-gray-800/70">
                                  View Details
                                </Button>
                                <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700">
                                  <Swords className="h-3.5 w-3.5 mr-1.5" />
                                  Contribute
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-gray-700/30 rounded-md p-4 bg-gray-800/30 text-center">
                          <p className="text-sm text-gray-500">
                            No active gang wars at the moment
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Territory Stats */}
                <div className="space-y-6">
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-gray-400" />
                        Territory Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="space-y-4">
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Territories</span>
                            <span className="text-xl font-bold">{gang.territories?.length || 0}</span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Total Daily Income</span>
                            <span className="text-xl font-bold text-green-500">
                              {formatCurrency(getTotalTerritoryIncome(gang.territories || []))}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Defense Bonus</span>
                            <span className="text-xl font-bold text-blue-500">
                              +{getTotalDefenseBonus(gang.territories || [])}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Swords className="h-4 w-4 text-gray-400" />
                        War Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="space-y-4">
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Active Wars</span>
                            <span className="text-xl font-bold">{gang.activeWars?.length || 0}</span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Wars Won</span>
                            <span className="text-xl font-bold">0</span>
                          </div>
                        </div>
                        
                        <div className="border border-gray-700/30 rounded-md p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">Territories Captured</span>
                            <span className="text-xl font-bold">0</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gang Treasury */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-green-400" />
                      Gang Treasury
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700/50 mb-4">
                      <div className="text-center">
                        <h3 className="text-3xl font-bold text-primary">
                          {formatCurrency(gang.bankBalance)}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Current Treasury Balance</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => setIsDepositDialogOpen(true)}
                        className="w-full bg-green-700 hover:bg-green-800 text-white"
                      >
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Deposit
                      </Button>
                      
                      {canWithdraw ? (
                        <Button 
                          onClick={() => setIsWithdrawDialogOpen(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          variant="outline"
                          disabled
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                    
                    {!canWithdraw && (
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        Only Leaders and Underbosses can withdraw funds
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Gang Management */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      Gang Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3">
                      {isLeader && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          disabled
                        >
                          <Shield className="h-4 w-4 mr-2 text-gray-400" />
                          Edit Gang Details
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                        Gang Chat
                      </Button>
                      
                      {isUserInGang && !isLeader && (
                        <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start border-red-900/30 text-red-500 hover:text-red-400 hover:bg-red-950/20"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Leave Gang
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-dark-surface border-gray-800">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-heading text-red-500">Leave Gang</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to leave {gang.name} [{gang.tag}]? 
                                <p className="mt-2">This action cannot be undone.</p>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsLeaveDialogOpen(false)}
                                className="border-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={handleLeaveGang}
                                disabled={leaveGangMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {leaveGangMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Leave Gang
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {isLeader && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-red-900/50 text-red-500 hover:text-red-400 hover:bg-red-950/20"
                          disabled
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Transfer Leadership
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Deposit to Gang Treasury</DialogTitle>
            <DialogDescription>
              Contribute money to your gang's treasury. Your contribution increases your standing and helps the gang grow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="deposit-amount"
                  placeholder="Enter amount to deposit"
                  className="bg-gray-900/50 border-gray-700 pl-9"
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="border border-green-900/30 bg-green-950/10 rounded-md p-3 text-sm">
              <p className="text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your contribution increases your gang influence
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Depositing funds helps your gang expand its territory and operations.
                Higher contributions lead to better ranks within the organization.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDepositDialogOpen(false)} 
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeposit} 
              disabled={depositMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-primary hover:from-green-700 hover:to-primary/90"
            >
              {depositMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deposit Funds
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Withdraw from Gang Treasury</DialogTitle>
            <DialogDescription>
              As a {userRank}, you can withdraw funds from the gang treasury. Use this privilege responsibly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="withdraw-amount"
                  placeholder="Enter amount to withdraw"
                  className="bg-gray-900/50 border-gray-700 pl-9"
                  type="number"
                  min="1"
                  max={gang.bankBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Maximum withdrawal: {formatCurrency(gang.bankBalance)}
              </p>
            </div>
            
            <div className="border border-amber-900/30 bg-amber-950/10 rounded-md p-3 text-sm">
              <p className="text-amber-400 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Leadership Responsibility
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Withdrawals reduce the gang's resources. Use this function for emergency 
                situations or to fund important gang operations.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsWithdrawDialogOpen(false)} 
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for initials
function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

// Helper for rank colors and styles
function getRankColor(rank: string) {
  const rankLower = rank.toLowerCase();
  
  if (rankLower === "leader") {
    return {
      bg: "bg-gradient-to-br from-amber-500 to-yellow-700",
      badge: "bg-amber-950/30 border-amber-700/50 text-amber-400"
    };
  } else if (rankLower === "underboss") {
    return {
      bg: "bg-gradient-to-br from-red-600 to-red-800",
      badge: "bg-red-950/30 border-red-700/50 text-red-400"
    };
  } else if (rankLower === "capo") {
    return {
      bg: "bg-gradient-to-br from-blue-600 to-blue-800",
      badge: "bg-blue-950/30 border-blue-700/50 text-blue-400"
    };
  } else {
    return {
      bg: "bg-gradient-to-br from-gray-600 to-gray-800",
      badge: "bg-gray-950/30 border-gray-700 text-gray-400"
    };
  }
}

// Helper to get rank icon
function getRankIcon(rank: string) {
  const rankLower = rank.toLowerCase();
  
  if (rankLower === "leader") {
    return <Crown className="h-4 w-4 mr-1" />;
  } else if (rankLower === "underboss") {
    return <Skull className="h-4 w-4 mr-1" />;
  } else if (rankLower === "capo") {
    return <Shield className="h-4 w-4 mr-1" />;
  } else {
    return <Users className="h-4 w-4 mr-1" />;
  }
}

// Helper for contribution rank
function getContributionRank(amount: number): string {
  if (amount >= 100000) return "Diamond";
  if (amount >= 50000) return "Platinum";
  if (amount >= 25000) return "Gold";
  if (amount >= 10000) return "Silver";
  if (amount >= 5000) return "Bronze";
  return "Recruit";
}

// Helper for contribution percentage (for progress bar)
function getContributionPercent(amount: number): number {
  const max = 100000;
  return Math.min(100, (amount / max) * 100);
}

// Helper for war progress percentage
function getWarProgressPercent(attackStrength: number, defenseStrength: number, isAttacker: boolean): number {
  const total = attackStrength + defenseStrength;
  if (total === 0) return 50; // Equal if both are 0
  
  if (isAttacker) {
    return Math.round((attackStrength / total) * 100);
  } else {
    return Math.round((defenseStrength / total) * 100);
  }
}

// Helper to get total territory income
function getTotalTerritoryIncome(territories: any[]): number {
  return territories.reduce((total, territory) => total + (territory.income || 0), 0);
}

// Helper to get total territory defense bonus
function getTotalDefenseBonus(territories: any[]): number {
  return territories.reduce((total, territory) => total + (territory.defenseBonus || 0), 0);
}

// Format date for displaying
function formatDate(dateString: string): string {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";
  
  // If less than 24 hours ago
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // For older dates
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${month} ${day}`;
}

// Activity item component
function ActivityItem({ 
  icon, 
  title, 
  description, 
  time 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  time: string; 
}) {
  return (
    <div className="flex items-start gap-3 p-2 hover:bg-gray-800/30 rounded-md transition-colors">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  valueColor = "text-white"
}: { 
  title: string; 
  value: number; 
  description: string; 
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="border border-gray-800 rounded-md p-4 bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}

// Custom activity icons for better visual distinction
function UserJoinIcon() {
  return (
    <div className="p-1 bg-green-900/30 rounded-full border border-green-900/50">
      <UserCheck className="h-5 w-5 text-green-400" />
    </div>
  );
}

function BankDepositIcon() {
  return (
    <div className="p-1 bg-blue-900/30 rounded-full border border-blue-900/50">
      <DollarSign className="h-5 w-5 text-blue-400" />
    </div>
  );
}

function GangCreatedIcon() {
  return (
    <div className="p-1 bg-purple-900/30 rounded-full border border-purple-900/50">
      <Crown className="h-5 w-5 text-purple-400" />
    </div>
  );
}