import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  Trophy, 
  Coins, 
  Zap, 
  Heart, 
  Package,
  Star,
  TrendingUp,
  Dumbbell,
  Pill,
  Briefcase,
  Flame,
  ArrowRight,
  Lock,
  Calendar,
  AlertTriangle,
  Play,
  Medal
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, isPast, isFuture, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Types for challenges (matching DB structure)
interface Challenge {
  id: number;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  start_date: string;
  end_date: string | null;
  cash_reward: number;
  xp_reward: number;
  respect_reward: number;
  special_item_id: number | null;
  requirement_type: string;
  requirement_value: number;
  requirement_target: string;
  active: boolean;
  time_limit: number | null;
  image_url: string | null;
}

interface ChallengeProgress {
  id: number;
  user_id: number;
  challenge_id: number;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
  created_at: string;
}

interface ChallengeWithProgress extends Challenge {
  progress?: ChallengeProgress;
  // Added for convenience in UI
  targetValue?: number; 
  startDate?: string;
  endDate?: string | null;
  cashReward?: number;
  xpReward?: number;
  respectReward?: number;
  itemReward?: number | null;
}

// Define the example challenges with improved formatting and visuals
const EXAMPLE_CHALLENGES = [
  {
    id: 1,
    name: "Drug Kingpin",
    description: "Manufacture different types of drugs in your lab. Become the supplier that keeps the city running.",
    type: "drugs",
    difficulty: "medium",
    start_date: new Date().toISOString(),
    end_date: addWeeks(new Date(), 1).toISOString(),
    cash_reward: 5000,
    xp_reward: 250,
    respect_reward: 20,
    special_item_id: null,
    requirement_type: "count",
    requirement_value: 10,
    requirement_target: "drug_production",
    active: true,
    time_limit: null,
    image_url: null,
    progress: {
      id: 1,
      user_id: 1,
      challenge_id: 1,
      current_value: 3,
      completed: false,
      completed_at: null,
      claimed: false,
      created_at: new Date().toISOString()
    }
  },
  {
    id: 2,
    name: "Shadow Enforcer",
    description: "Successfully complete stealth-based crimes without getting caught. Show them why you're the best in the business.",
    type: "crime",
    difficulty: "hard",
    start_date: new Date().toISOString(),
    end_date: addWeeks(new Date(), 1).toISOString(),
    cash_reward: 7500,
    xp_reward: 350,
    respect_reward: 40,
    special_item_id: null,
    requirement_type: "count",
    requirement_value: 15,
    requirement_target: "stealth_crime",
    active: true,
    time_limit: null,
    image_url: null,
    progress: {
      id: 2,
      user_id: 1,
      challenge_id: 2,
      current_value: 7,
      completed: false,
      completed_at: null,
      claimed: false,
      created_at: new Date().toISOString()
    }
  },
  {
    id: 3,
    name: "Iron Discipline",
    description: "Train your strength regularly and build your physical prowess. Become a force to be reckoned with.",
    type: "training",
    difficulty: "easy",
    start_date: new Date().toISOString(),
    end_date: addWeeks(new Date(), 1).toISOString(),
    cash_reward: 3000,
    xp_reward: 200,
    respect_reward: 10,
    special_item_id: null,
    requirement_type: "count",
    requirement_value: 20,
    requirement_target: "strength_training",
    active: true,
    time_limit: null,
    image_url: null,
    progress: {
      id: 3,
      user_id: 1,
      challenge_id: 3,
      current_value: 12,
      completed: false,
      completed_at: null,
      claimed: false,
      created_at: new Date().toISOString()
    }
  },
  {
    id: 4,
    name: "Master Chemist",
    description: "Create the highest quality drugs in your lab. Quality over quantity - your customers deserve the best.",
    type: "drugs",
    difficulty: "boss",
    start_date: new Date().toISOString(),
    end_date: addWeeks(new Date(), 2).toISOString(),
    cash_reward: 10000,
    xp_reward: 500,
    respect_reward: 80,
    special_item_id: 1,
    requirement_type: "specific",
    requirement_value: 100,
    requirement_target: "pure_product",
    active: true,
    time_limit: null,
    image_url: null,
    progress: {
      id: 4,
      user_id: 1,
      challenge_id: 4,
      current_value: 35,
      completed: false,
      completed_at: null,
      claimed: false,
      created_at: new Date().toISOString()
    }
  },
  {
    id: 5,
    name: "Big Score",
    description: "Execute a complex, high-reward crime. It's time to make your mark on the city.",
    type: "crime",
    difficulty: "medium",
    start_date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    end_date: addWeeks(new Date(), 1).toISOString(),
    cash_reward: 8000,
    xp_reward: 400,
    respect_reward: 60,
    special_item_id: null,
    requirement_type: "specific",
    requirement_value: 5,
    requirement_target: "bank_heist",
    active: true,
    time_limit: null,
    image_url: null,
    progress: {
      id: 5,
      user_id: 1,
      challenge_id: 5,
      current_value: 5,
      completed: true,
      completed_at: new Date().toISOString(),
      claimed: false,
      created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
    }
  }
];

// Type guard to check if challenges exist and have a filter method
const isValidChallenges = (challenges: any): challenges is ChallengeWithProgress[] => {
  return Array.isArray(challenges);
};

export default function ChallengesPage() {
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithProgress | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [tabValue, setTabValue] = useState("current");
  
  // Animation refs for bubble effects
  const bubbleRefs = useRef<(HTMLSpanElement | null)[]>([]);

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
      toast({
        title: "Progress updated",
        description: "Your challenge progress has been updated.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to update challenge",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Claim reward mutation with animation
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
      // Close modal if open
      setIsPreviewModalOpen(false);
      
      // Show success animation and message
      toast({
        title: "Reward claimed!",
        description: "You have successfully claimed your reward.",
        variant: "default",
      });
      
      // Refresh data
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
    const start = new Date(challenge.start_date);
    const end = challenge.end_date ? new Date(challenge.end_date) : null;
    const now = new Date();
    
    if (isFuture(start)) return false;
    if (end && isPast(end)) return false;
    
    return true;
  };

  // Helper function to get the time remaining for a challenge
  const getRemainingTime = (challenge: Challenge) => {
    if (!challenge.end_date) return "No end date";
    
    const endDate = new Date(challenge.end_date);
    if (isPast(endDate)) return "Expired";
    
    return formatDistanceToNow(endDate, { addSuffix: true });
  };

  // Function to get the progress percentage for a challenge
  const getProgressPercentage = (challenge: ChallengeWithProgress) => {
    if (!challenge.progress) return 0;
    const percentage = (challenge.progress.current_value / challenge.requirement_value) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Function to get the icon for a challenge type
  const getChallengeTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'crime':
        return <Briefcase className="h-6 w-6 text-red-500" />;
      case 'drugs':
        return <Pill className="h-6 w-6 text-green-500" />;
      case 'training':
        return <Dumbbell className="h-6 w-6 text-blue-500" />;
      case 'gang':
        return <Flame className="h-6 w-6 text-orange-500" />;
      default:
        return <Flame className="h-6 w-6 text-primary" />;
    }
  };

  // Function to get difficulty stars
  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return <div className="flex items-center"><Star className="h-4 w-4 text-secondary" fill="currentColor" /></div>;
      case 'medium':
        return <div className="flex items-center">
          <Star className="h-4 w-4 text-secondary" fill="currentColor" />
          <Star className="h-4 w-4 text-secondary" fill="currentColor" />
        </div>;
      case 'hard':
        return <div className="flex items-center">
          <Star className="h-4 w-4 text-secondary" fill="currentColor" />
          <Star className="h-4 w-4 text-secondary" fill="currentColor" />
          <Star className="h-4 w-4 text-secondary" fill="currentColor" />
        </div>;
      case 'boss':
        return <div className="flex items-center">
          <Star className="h-4 w-4 text-gold" fill="currentColor" />
          <Star className="h-4 w-4 text-gold" fill="currentColor" />
          <Star className="h-4 w-4 text-gold" fill="currentColor" />
          <Star className="h-4 w-4 text-gold" fill="currentColor" />
        </div>;
      default:
        return <div className="flex items-center"><Star className="h-4 w-4 text-secondary" fill="currentColor" /></div>;
    }
  };

  // Generate random bubbles for animations
  const generateRandomBubbles = (count: number, challengeId: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 10 + 5;
      const left = Math.random() * 80 + 10;
      const delay = Math.random() * 1.5;
      
      return (
        <span
          key={`bubble-${challengeId}-${i}`}
          ref={el => {
            if (bubbleRefs.current.length <= i) {
              bubbleRefs.current.push(el);
            } else {
              bubbleRefs.current[i] = el;
            }
          }}
          className="animate-bubble-rise absolute bottom-0 bg-white/10 rounded-full pointer-events-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
          }}
        />
      );
    });
  };

  // If we have no real challenges, use our example challenges for display
  const allChallenges = (challenges && challenges.length > 0) ? challenges : EXAMPLE_CHALLENGES as unknown as ChallengeWithProgress[];
  
  // Filter challenges based on status and type
  const currentChallenges = allChallenges?.filter(c => isChallengeActive(c) && !c.progress?.completed) || [];
  const completedChallenges = allChallenges?.filter(c => c.progress?.completed) || [];
  
  const filteredCurrentChallenges = filter === 'all' 
    ? currentChallenges 
    : currentChallenges.filter(c => c.type.toLowerCase() === filter.toLowerCase());
  
  const filteredCompletedChallenges = filter === 'all'
    ? completedChallenges
    : completedChallenges.filter(c => c.type.toLowerCase() === filter.toLowerCase());

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-heading tracking-tight text-gold-gradient drop-shadow-md mb-1">
              WEEKLY CHALLENGES
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Complete special tasks for significant rewards and respect
            </p>
          </div>
        </div>
        
        <div className="card-omerta-premium p-6 relative overflow-hidden">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted/30 rounded-md w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-background/50 rounded-md p-6 h-32 flex flex-col justify-between">
                  <div className="h-5 bg-muted/50 rounded-md w-3/4"></div>
                  <div className="h-3 bg-muted/50 rounded-md w-full"></div>
                  <div className="h-4 bg-muted/50 rounded-md w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-heading tracking-tight text-gold-gradient drop-shadow-md mb-1">
              WEEKLY CHALLENGES
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Complete special tasks for significant rewards and respect
            </p>
          </div>
        </div>
        
        <Card className="p-8 border-destructive text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Error Loading Challenges</h3>
          <p className="text-muted-foreground mb-4">We couldn't retrieve your challenges at this time. Please try again later.</p>
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/challenges"] })}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="flex flex-col space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              className="text-4xl font-heading tracking-tight text-gold-gradient drop-shadow-md mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              WEEKLY CHALLENGES
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-sm md:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Complete special tasks for significant rewards and respect
            </motion.p>
          </div>
          
          <motion.div 
            className="flex flex-wrap md:flex-nowrap gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={filter === 'crime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('crime')}
              className="rounded-full flex items-center gap-1"
            >
              <Briefcase className="h-3.5 w-3.5" /> Crime
            </Button>
            <Button 
              variant={filter === 'drugs' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('drugs')}
              className="rounded-full flex items-center gap-1"
            >
              <Pill className="h-3.5 w-3.5" /> Drugs
            </Button>
            <Button 
              variant={filter === 'training' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('training')}
              className="rounded-full flex items-center gap-1"
            >
              <Dumbbell className="h-3.5 w-3.5" /> Training
            </Button>
          </motion.div>
        </div>
        
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card-omerta-premium p-6 relative overflow-hidden"
        >
          <Tabs defaultValue="current" value={tabValue} onValueChange={setTabValue} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="current" className="text-sm">Active Challenges</TabsTrigger>
              <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-6">
              {filteredCurrentChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No active challenges in this category</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Check back soon for new challenges or try a different category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCurrentChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-secondary/5 rounded-lg blur-xl group-hover:bg-secondary/10 transition-all duration-700"></div>
                      <Card 
                        className="paper-texture border border-border/50 overflow-hidden relative z-10 group-hover:border-secondary/20 transition-all duration-300"
                      >
                        {/* Progress indicator overlay */}
                        <div 
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary/40 via-secondary/60 to-secondary/40 z-20 transition-all duration-1000"
                          style={{ width: `${getProgressPercentage(challenge)}%` }}
                        />
                        
                        {/* Random bubbles for animated effect */}
                        {generateRandomBubbles(4, challenge.id)}
                        
                        <div className="p-5">
                          {/* Challenge header with type, difficulty and name */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50">
                                {getChallengeTypeIcon(challenge.type)}
                              </div>
                              <div>
                                <Badge variant="outline" className="px-2 py-0 text-xs font-normal mb-1">
                                  {getDifficultyStars(challenge.difficulty)}
                                </Badge>
                                <h3 className="text-lg font-medium">{challenge.name}</h3>
                              </div>
                            </div>
                          </div>
                          
                          {/* Challenge description */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{challenge.description}</p>
                          
                          {/* Challenge timeline */}
                          <div className="mb-4 text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires {getRemainingTime(challenge)}
                          </div>
                          
                          {/* Challenge progress */}
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-medium">Progress</span>
                              <span className="text-xs font-bold">
                                {challenge.progress?.current_value || 0} / {challenge.requirement_value}
                              </span>
                            </div>
                            <div className="relative h-2 w-full bg-background/70 rounded-full overflow-hidden">
                              <motion.div 
                                className="absolute top-0 left-0 h-full progress-bar-animated bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50"
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage(challenge)}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                              />
                            </div>
                          </div>
                          
                          {/* Challenge rewards preview */}
                          <div className="flex items-center gap-2 mb-5">
                            {challenge.cash_reward > 0 && (
                              <div className="bg-card/50 border border-border/30 rounded-md px-2 py-1 flex items-center gap-1">
                                <Coins className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-medium">${challenge.cash_reward.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {challenge.xp_reward > 0 && (
                              <div className="bg-card/50 border border-border/30 rounded-md px-2 py-1 flex items-center gap-1">
                                <Zap className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium">{challenge.xp_reward}XP</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Challenge action button */}
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="w-full group-hover:bg-secondary/20 transition-all duration-300"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setIsPreviewModalOpen(true);
                            }}
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-4 w-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform duration-200" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-6">
              {filteredCompletedChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No completed challenges yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Complete challenges to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompletedChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 rounded-lg blur-xl group-hover:bg-success/5 transition-all duration-700"></div>
                      <Card 
                        className={cn(
                          "paper-texture overflow-hidden relative z-10 group-hover:border-success/20 transition-all duration-300",
                          challenge.progress?.claimed 
                            ? "border-border/50" 
                            : "border-success/30"
                        )}
                      >
                        {/* Completed status overlay */}
                        {!challenge.progress?.claimed && (
                          <div className="absolute top-2 right-2 z-20 flex items-center">
                            <Badge variant="outline" className="bg-success/10 border-success/30 text-success font-normal">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        )}
                        
                        {/* Claimed status overlay */}
                        {challenge.progress?.claimed && (
                          <div className="absolute top-2 right-2 z-20 flex items-center">
                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary font-normal">
                              <Trophy className="h-3 w-3 mr-1" />
                              Claimed
                            </Badge>
                          </div>
                        )}
                        
                        <div className="p-5">
                          {/* Challenge header with type and name */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50">
                              {getChallengeTypeIcon(challenge.type)}
                            </div>
                            <div>
                              <Badge variant="outline" className="px-2 py-0 text-xs font-normal mb-1">
                                {getDifficultyStars(challenge.difficulty)}
                              </Badge>
                              <h3 className="text-lg font-medium">{challenge.name}</h3>
                            </div>
                          </div>
                          
                          {/* Challenge completion status */}
                          <div className="mb-4">
                            <Progress 
                              value={100}
                              className="h-2 bg-muted/30"
                            />
                          </div>
                          
                          {/* Challenge rewards */}
                          <div className="flex items-center gap-2 mb-5">
                            {challenge.cash_reward > 0 && (
                              <div className="bg-card/50 border border-border/30 rounded-md px-2 py-1 flex items-center gap-1">
                                <Coins className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-medium">${challenge.cash_reward.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {challenge.xp_reward > 0 && (
                              <div className="bg-card/50 border border-border/30 rounded-md px-2 py-1 flex items-center gap-1">
                                <Zap className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium">{challenge.xp_reward}XP</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Challenge action button */}
                          {challenge.progress?.completed && !challenge.progress?.claimed ? (
                            <Button 
                              variant="default"
                              size="sm"
                              className="w-full bg-success hover:bg-success/90 text-white"
                              onClick={() => claimRewardMutation.mutate(challenge.id)}
                              disabled={claimRewardMutation.isPending}
                            >
                              {claimRewardMutation.isPending ? "Claiming..." : "Claim Rewards"}
                              <Trophy className="h-4 w-4 ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              variant={challenge.progress?.claimed ? "outline" : "secondary"}
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedChallenge(challenge);
                                setIsPreviewModalOpen(true);
                              }}
                            >
                              View Details
                              <ArrowRight className="h-4 w-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform duration-200" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      
      {/* Challenge detail modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="paper-texture max-w-3xl">
          {selectedChallenge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-heading">
                  {getChallengeTypeIcon(selectedChallenge.type)}
                  {selectedChallenge.name}
                  {selectedChallenge.progress?.completed && (
                    <CheckCircle className="h-5 w-5 text-success ml-2" />
                  )}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 my-2">
                    <Badge variant="outline" className="font-normal">
                      {selectedChallenge.type.charAt(0).toUpperCase() + selectedChallenge.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {getDifficultyStars(selectedChallenge.difficulty)}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {getRemainingTime(selectedChallenge)}
                    </Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-6">
                {/* Challenge description */}
                <p className="text-muted-foreground">{selectedChallenge.description}</p>
                
                {/* Challenge requirements */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Objective
                  </h4>
                  <div className="bg-card/50 border border-border/30 rounded-md p-4">
                    <p className="mb-2">
                      {selectedChallenge.requirement_type === 'count' 
                        ? `Complete ${selectedChallenge.requirement_value} ${selectedChallenge.requirement_target.replace('_', ' ')}`
                        : `Reach ${selectedChallenge.requirement_value} in ${selectedChallenge.requirement_target.replace('_', ' ')}`
                      }
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mb-1 mt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium">Your Progress</span>
                        <span className="text-sm font-bold">
                          {selectedChallenge.progress?.current_value || 0} / {selectedChallenge.requirement_value}
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full bg-background rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full progress-bar-animated bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50"
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage(selectedChallenge)}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Challenge rewards section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Rewards
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedChallenge.cash_reward > 0 && (
                      <div className="bg-card/50 border border-border/30 rounded-md p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Coins className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">${selectedChallenge.cash_reward.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Cash</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChallenge.xp_reward > 0 && (
                      <div className="bg-card/50 border border-border/30 rounded-md p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{selectedChallenge.xp_reward.toLocaleString()} XP</p>
                          <p className="text-xs text-muted-foreground">Experience</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChallenge.respect_reward > 0 && (
                      <div className="bg-card/50 border border-border/30 rounded-md p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{selectedChallenge.respect_reward.toLocaleString()} Respect</p>
                          <p className="text-xs text-muted-foreground">Street Cred</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChallenge.special_item_id && (
                      <div className="bg-card/50 border border-border/30 rounded-md p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Special Item</p>
                          <p className="text-xs text-muted-foreground">Rare Collectible</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Challenge completion tips */}
                {!selectedChallenge.progress?.completed && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Tips for Completion
                    </h4>
                    <div className="bg-card/50 border border-border/30 rounded-md p-4">
                      <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                        {selectedChallenge.type === 'crime' && (
                          <>
                            <li>Visit the Crimes page to see available criminal activities</li>
                            <li>Higher risk crimes give better rewards but have a higher chance of failure</li>
                            <li>Your Stealth attribute affects your success rate</li>
                          </>
                        )}
                        
                        {selectedChallenge.type === 'drugs' && (
                          <>
                            <li>Establish a drug lab in a safe neighborhood</li>
                            <li>Invest in better equipment for higher quality drugs</li>
                            <li>Manage your ingredient supply carefully</li>
                          </>
                        )}
                        
                        {selectedChallenge.type === 'training' && (
                          <>
                            <li>Visit the Training page to improve your attributes</li>
                            <li>Training regularly gives you steady progress</li>
                            <li>Higher attributes increase your effectiveness in crimes and other activities</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {selectedChallenge.progress?.completed && !selectedChallenge.progress.claimed && (
                  <Button
                    variant="default"
                    onClick={() => claimRewardMutation.mutate(selectedChallenge.id)}
                    disabled={claimRewardMutation.isPending}
                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {claimRewardMutation.isPending ? "Claiming..." : "Claim Rewards"}
                    <Trophy className="h-4 w-4 ml-2" />
                  </Button>
                )}
                
                {!selectedChallenge.progress?.completed && (
                  <Button 
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      // Redirect to the appropriate page based on challenge type
                      const path = selectedChallenge.type === 'crime' 
                        ? '/crimes' 
                        : selectedChallenge.type === 'drugs' 
                          ? '/drugs'
                          : '/training';
                      
                      window.location.href = path;
                    }}
                  >
                    Start Now
                    <Play className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}