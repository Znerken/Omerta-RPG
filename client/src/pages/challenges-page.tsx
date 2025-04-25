import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Trophy, 
  Coins, 
  Zap, 
  Heart, 
  Package 
} from "lucide-react";
import { formatDistanceToNow, format, isAfter, isPast, isFuture } from "date-fns";

// Types for challenges
interface Challenge {
  id: number;
  name: string;
  description: string;
  type: string;
  targetValue: number;
  startDate: string;
  endDate: string | null;
  cashReward: number;
  xpReward: number;
  respectReward: number;
  itemReward: number | null;
}

interface ChallengeProgress {
  userId: number;
  challengeId: number;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
}

interface ChallengeWithProgress extends Challenge {
  progress?: ChallengeProgress;
}

export default function ChallengesPage() {
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithProgress | null>(null);

  // Fetch challenges with progress
  const { data: challenges, isLoading, error } = useQuery<ChallengeWithProgress[]>({
    queryKey: ["/api/challenges"],
    onError: (err: Error) => {
      toast({
        title: "Error fetching challenges",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update challenge progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, data }: { challengeId: number, data: any }) => {
      const res = await apiRequest(
        "POST", 
        `/api/challenges/${challengeId}/progress`, 
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to update challenge",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/challenges/${challengeId}/progress`, 
        { claimed: true }
      );
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reward claimed!",
        description: "You have successfully claimed your reward.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to claim reward",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to determine if a challenge is active
  const isChallengeActive = (challenge: Challenge) => {
    const start = new Date(challenge.startDate);
    const end = challenge.endDate ? new Date(challenge.endDate) : null;
    const now = new Date();
    
    if (isFuture(start)) return false;
    if (end && isPast(end)) return false;
    
    return true;
  };

  // Helper function to get the time remaining for a challenge
  const getRemainingTime = (challenge: Challenge) => {
    if (!challenge.endDate) return "No end date";
    
    const endDate = new Date(challenge.endDate);
    if (isPast(endDate)) return "Expired";
    
    return formatDistanceToNow(endDate, { addSuffix: true });
  };

  // Function to get the progress percentage for a challenge
  const getProgressPercentage = (challenge: ChallengeWithProgress) => {
    if (!challenge.progress) return 0;
    const percentage = (challenge.progress.currentValue / challenge.targetValue) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-gold-gradient">Weekly Challenges</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded-md mb-4 w-3/4"></div>
              <div className="h-4 bg-muted rounded-md mb-2 w-full"></div>
              <div className="h-4 bg-muted rounded-md mb-4 w-5/6"></div>
              <div className="h-4 bg-muted rounded-md mb-4 w-1/2"></div>
              <div className="h-8 bg-muted rounded-md w-1/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-gold-gradient">Weekly Challenges</h1>
        <Card className="p-6 border-destructive">
          <div className="text-destructive font-semibold">Error loading challenges</div>
          <p className="text-muted-foreground">Please try again later</p>
        </Card>
      </div>
    );
  }

  // Filter challenges to show only active ones
  const activeOrCompletedChallenges = challenges?.filter(challenge => 
    isChallengeActive(challenge) || (challenge.progress?.completed)
  ) || [];
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gold-gradient">Weekly Challenges</h1>
      </div>
      
      {activeOrCompletedChallenges.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">No active challenges</h3>
          <p className="text-muted-foreground">Check back soon for new weekly challenges</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeOrCompletedChallenges.map((challenge) => (
            <Card 
              key={challenge.id} 
              className={`game-card p-6 relative overflow-hidden group transition-all hover:shadow-lg ${
                challenge.progress?.completed ? 'border-success border-2' : ''
              }`}
            >
              {/* Challenge header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{challenge.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {challenge.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {challenge.progress?.completed && (
                    <span className="bg-success/20 text-success text-xs p-1 px-2 rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </span>
                  )}
                  {challenge.progress?.claimed && (
                    <span className="bg-primary/20 text-primary text-xs p-1 px-2 rounded-full flex items-center">
                      <Trophy className="h-3 w-3 mr-1" />
                      Claimed
                    </span>
                  )}
                </div>
              </div>
              
              {/* Challenge description */}
              <p className="mb-4">{challenge.description}</p>
              
              {/* Challenge progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>
                    {challenge.progress?.currentValue || 0} / {challenge.targetValue}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(challenge)}
                  className="h-2 mt-1"
                />
              </div>
              
              {/* Challenge time remaining */}
              <div className="text-sm text-muted-foreground mb-6 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {getRemainingTime(challenge)}
              </div>
              
              {/* Challenge rewards */}
              <div className="flex flex-wrap gap-3 mb-6">
                {challenge.cashReward > 0 && (
                  <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">${challenge.cashReward.toLocaleString()}</span>
                  </div>
                )}
                
                {challenge.xpReward > 0 && (
                  <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{challenge.xpReward.toLocaleString()} XP</span>
                  </div>
                )}
                
                {challenge.respectReward > 0 && (
                  <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{challenge.respectReward.toLocaleString()} Respect</span>
                  </div>
                )}
                
                {challenge.itemReward > 0 && (
                  <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Item Reward</span>
                  </div>
                )}
              </div>
              
              {/* Challenge actions */}
              <div className="flex justify-between">
                {challenge.progress?.completed && !challenge.progress?.claimed ? (
                  <Button 
                    onClick={() => claimRewardMutation.mutate(challenge.id)}
                    className="w-full bg-success hover:bg-success/90 text-success-foreground"
                    disabled={claimRewardMutation.isPending}
                  >
                    {claimRewardMutation.isPending ? "Claiming..." : "Claim Rewards"}
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedChallenge(challenge)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                )}
              </div>
              
              {/* Glow effect for completed challenges */}
              {challenge.progress?.completed && !challenge.progress?.claimed && (
                <div className="absolute inset-0 bg-success/5 pointer-events-none" />
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Challenge details modal would go here */}
      {/* 
      You can add a modal component here to show more details when a challenge is selected
      */}
    </div>
  );
}