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
  BriefcaseBusiness,
  CheckCircle,
  Target 
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gang } from "@shared/schema";
import { useNotification } from "@/hooks/use-notification";

interface GangCardProps {
  gang: Gang & { members?: { id: number; username: string; rank: string; contribution?: number }[] };
  isUserInGang: boolean;
  userRank?: string;
  userId: number;
}

export function GangCard({ gang, isUserInGang, userRank, userId }: GangCardProps) {
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const canWithdraw = isUserInGang && (userRank === "Leader" || userRank === "Underboss");
  const isLeader = isUserInGang && userRank === "Leader";
  
  // Get user's member object
  const userMember = gang.members?.find(member => member.id === userId);

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
      setIsDepositDialogOpen(false);
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
  
  // Render a styled gang emblem with tag
  const GangEmblem = () => (
    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white/30 rounded-md"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_70%)]"></div>
      </div>
      <span className="font-heading text-3xl text-white drop-shadow-md relative z-10">{gang.tag}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-dark-surface border-gray-800 overflow-hidden relative">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-600 to-blue-600"></div>
        
        <CardHeader>
          <div className="flex items-center mb-4 gap-6">
            <GangEmblem />
            <div className="flex-1">
              <CardTitle className="text-2xl font-heading mb-1">{gang.name}</CardTitle>
              <CardDescription className="text-gray-400 text-sm mb-3">
                <div className="flex flex-wrap gap-3 mb-2">
                  <Badge variant="outline" className="flex items-center bg-gray-900/50 border-gray-700">
                    <Users className="h-3.5 w-3.5 mr-1" /> 
                    {gang.members?.length || 0} Members
                  </Badge>
                  <Badge variant="outline" className="flex items-center bg-gray-900/50 border-gray-700">
                    <DollarSign className="h-3.5 w-3.5 mr-1" /> 
                    {formatCurrency(gang.bankBalance)} Bank
                  </Badge>
                  <Badge variant="outline" className="flex items-center bg-gray-900/50 border-gray-700">
                    <Award className="h-3.5 w-3.5 mr-1" /> 
                    Level {gang.level || 1}
                  </Badge>
                  <Badge variant="outline" className="flex items-center bg-gray-900/50 border-gray-700">
                    <Skull className="h-3.5 w-3.5 mr-1" /> 
                    {gang.respect || 0} Respect
                  </Badge>
                </div>
                {isUserInGang && (
                  <div className="bg-gray-900/50 rounded-md p-2 border border-gray-800">
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-400">Gang Level Progress</span>
                      <span className="text-primary">{levelProgress}%</span>
                    </div>
                    <Progress value={levelProgress} className="h-2 bg-gray-800" indicatorClassName="bg-gradient-to-r from-primary to-purple-600" />
                  </div>
                )}
              </CardDescription>
              {gang.description && (
                <div className="text-sm text-gray-300 rounded-md bg-gray-900/50 p-3 border border-gray-800">
                  "{gang.description}"
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full mb-6 bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="members" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="h-4 w-4 mr-2" />
                Activities
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="mt-0">
              <div className="space-y-1">
                {/* User is highlighted in the member list if they're in the gang */}
                {gang.members?.map((member) => (
                  <div 
                    key={member.id} 
                    className={`flex justify-between items-center p-3 rounded-md ${member.id === userId ? 'bg-primary/10 border border-primary/20' : 'bg-gray-900/70 border border-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankColor(member.rank).bg}`}>
                        <span className="text-xs text-white">{getInitials(member.username)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{member.username}</span>
                          {member.id === userId && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5 bg-primary/20 border-primary/30 text-primary">
                              You
                            </Badge>
                          )}
                        </div>
                        {member.contribution !== undefined && (
                          <span className="text-xs text-gray-400">
                            Contribution: {formatCurrency(member.contribution)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getRankColor(member.rank).badge} py-1`}
                    >
                      {getRankIcon(member.rank)}
                      {member.rank}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  title="Strength"
                  value={gang.strength || 10}
                  icon={<ShieldPlus className="h-4 w-4 text-blue-400" />}
                  description="Gang's attack power"
                />
                <StatCard
                  title="Defense"
                  value={gang.defense || 10}
                  icon={<Shield className="h-4 w-4 text-emerald-400" />}
                  description="Gang's defensive capability"
                />
                <StatCard
                  title="Territories"
                  value={0}
                  icon={<MapPin className="h-4 w-4 text-red-400" />}
                  description="Controlled territories"
                />
                <StatCard
                  title="Wars Won"
                  value={0}
                  icon={<Swords className="h-4 w-4 text-amber-400" />}
                  description="Victory count"
                />
              </div>
              
              {isUserInGang && (
                <div className="mt-4 border border-gray-800 rounded-md p-4 bg-gray-900/50">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-400" />
                    Your Contribution
                  </h3>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-semibold inline-block text-primary">
                          {userMember?.contribution ? formatCurrency(userMember.contribution) : "$0"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-gray-400">
                          Rank: {getContributionRank(userMember?.contribution || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <Progress 
                          value={getContributionPercent(userMember?.contribution || 0)} 
                          className="h-2 bg-gray-800" 
                          indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-300" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activities" className="mt-0">
              <div className="space-y-3 bg-gray-900/50 p-3 rounded-md border border-gray-800">
                <ActivityItem
                  time="Just now"
                  title="Member Joined"
                  description={`${gang.members?.[0]?.username || "A member"} joined the gang`}
                  icon={<Users className="h-4 w-4 text-blue-400" />}
                />
                
                <Separator className="bg-gray-800" />
                
                <ActivityItem
                  time="2 hours ago"
                  title="Bank Deposit"
                  description={`A deposit of ${formatCurrency(1000)} was made to the gang bank`}
                  icon={<DollarSign className="h-4 w-4 text-green-400" />}
                />
                
                <Separator className="bg-gray-800" />
                
                <ActivityItem
                  time="1 day ago"
                  title="Gang Created"
                  description={`${gang.members?.find(m => m.rank === "Leader")?.username || "Leader"} founded the gang`}
                  icon={<Award className="h-4 w-4 text-amber-400" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {isUserInGang && (
          <CardFooter className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-900/30 border-t border-gray-800 px-6 py-4">
            <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-medium">
                  <DollarSign className="h-4 w-4 mr-2" /> Gang Bank
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-dark-surface border-gray-800">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" /> 
                    Gang Bank
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Current balance: {formatCurrency(gang.bankBalance)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit Amount</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="deposit"
                        type="number"
                        placeholder="Amount to deposit"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="1"
                        className="bg-gray-900/50 border-gray-700"
                      />
                      <Button 
                        onClick={handleDeposit} 
                        disabled={depositMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {depositMutation.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Depositing...
                          </>
                        ) : "Deposit"}
                      </Button>
                    </div>
                  </div>
                  
                  {canWithdraw && (
                    <>
                      <Separator className="bg-gray-700" />
                      <div className="space-y-2">
                        <Label htmlFor="withdraw">Withdraw Amount</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="withdraw"
                            type="number"
                            placeholder="Amount to withdraw"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min="1"
                            max={gang.bankBalance.toString()}
                            className="bg-gray-900/50 border-gray-700"
                          />
                          <Button 
                            onClick={handleWithdraw} 
                            disabled={withdrawMutation.isPending}
                            className="bg-primary hover:bg-primary/80"
                          >
                            {withdrawMutation.isPending ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Withdrawing...
                              </>
                            ) : "Withdraw"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400">Only Leaders and Underbosses can withdraw funds</p>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDepositDialogOpen(false)}
                    className="border-gray-700"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className="font-medium">
              <Target className="h-4 w-4 mr-2" /> Missions
            </Button>
            
            <Button variant="outline" className="font-medium">
              <MessageSquare className="h-4 w-4 mr-2" /> Gang Chat
            </Button>
            
            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="font-medium bg-red-900 hover:bg-red-800">
                  <LogOut className="h-4 w-4 mr-2" /> Leave Gang
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-dark-surface border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-red-500">Leave Gang</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Are you sure you want to leave {gang.name}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="bg-red-900/20 text-red-400 border border-red-900/30 rounded-md p-4 text-sm">
                    <p>Leaving the gang will:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Remove your membership immediately</li>
                      <li>Forfeit any contribution rank</li>
                      <li>Remove access to gang resources</li>
                      {isLeader && <li className="font-bold">As leader, you must promote someone else before leaving</li>}
                    </ul>
                  </div>
                </div>
                
                <DialogFooter>
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
                    disabled={leaveGangMutation.isPending || isLeader}
                  >
                    {leaveGangMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Leaving...
                      </>
                    ) : "Leave Gang"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Helper function to get rank colors
function getRankColor(rank: string) {
  switch (rank) {
    case "Leader":
      return {
        bg: "bg-gradient-to-br from-amber-500 to-amber-700",
        badge: "bg-amber-900/30 border-amber-700/30 text-amber-400"
      };
    case "Underboss":
      return {
        bg: "bg-gradient-to-br from-purple-500 to-purple-700", 
        badge: "bg-purple-900/30 border-purple-700/30 text-purple-400"
      };
    case "Capo":
      return {
        bg: "bg-gradient-to-br from-blue-500 to-blue-700",
        badge: "bg-blue-900/30 border-blue-700/30 text-blue-400" 
      };
    default:
      return {
        bg: "bg-gradient-to-br from-gray-500 to-gray-700",
        badge: "bg-gray-900/30 border-gray-700/30 text-gray-400"
      };
  }
}

// Helper function to get rank icons
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

// Helper function to get initials from username
function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// Helper function to calculate contribution rank
function getContributionRank(contribution: number): string {
  if (contribution >= 1000000) return "Legendary";
  if (contribution >= 500000) return "Elite";
  if (contribution >= 250000) return "Master";
  if (contribution >= 100000) return "Expert";
  if (contribution >= 50000) return "Veteran";
  if (contribution >= 25000) return "Professional";
  if (contribution >= 10000) return "Experienced";
  if (contribution >= 5000) return "Skilled";
  if (contribution >= 1000) return "Rookie";
  return "Newbie";
}

// Helper function to calculate contribution percentage for progress bar
function getContributionPercent(contribution: number): number {
  // Cap at 100%
  if (contribution >= 1000000) return 100;
  
  // Calculate percentage toward next rank
  if (contribution >= 500000) return 50 + (contribution - 500000) / 10000;
  if (contribution >= 250000) return 50 + (contribution - 250000) / 5000;
  if (contribution >= 100000) return 50 + (contribution - 100000) / 3000;
  if (contribution >= 50000) return 50 + (contribution - 50000) / 1000;
  if (contribution >= 25000) return 50 + (contribution - 25000) / 500;
  if (contribution >= 10000) return 50 + (contribution - 10000) / 300;
  if (contribution >= 5000) return 50 + (contribution - 5000) / 100;
  if (contribution >= 1000) return 50 + (contribution - 1000) / 80;
  
  // For newbies
  return contribution / 20;
}

// Stat Card component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-heading text-white">{value}</p>
        <ChevronUp className="h-4 w-4 text-green-500 ml-2" />
      </div>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

// Activity Item component
interface ActivityItemProps {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function ActivityItem({ time, title, description, icon }: ActivityItemProps) {
  return (
    <div className="flex items-start">
      <div className="bg-gray-800 rounded-full p-2 mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
