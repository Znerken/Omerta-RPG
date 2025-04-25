import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChallengeWithProgress } from "@shared/schema";

export default function ChallengesPage() {
  const { toast } = useToast();
  
  const { data: challenges, isLoading, error } = useQuery<ChallengeWithProgress[]>({
    queryKey: ['/api/challenges'],
    staleTime: 60 * 1000, // 1 minute
  });

  const claimReward = async (challengeId: number) => {
    try {
      const response = await apiRequest("POST", `/api/challenges/${challengeId}/progress`, {
        claimed: true
      });
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Reward Claimed!",
          description: `You've received ${result.reward.cashReward} cash and ${result.reward.xpReward} XP.`,
        });
        
        // Invalidate relevant queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to claim reward",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while claiming reward",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load challenges. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-muted/30 backdrop-blur border border-border">
          <CardHeader className="pb-3">
            <CardTitle>Weekly Challenges</CardTitle>
            <CardDescription>Complete special missions to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-muted-foreground">
              No active challenges at the moment. Check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Weekly Challenges</h1>
        <p className="text-muted-foreground">Complete special missions to earn valuable rewards</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((challenge) => (
          <Card 
            key={challenge.id} 
            className={`game-card border backdrop-blur ${
              challenge.completed ? "border-success" : "border-border"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{challenge.name}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </div>
                
                <Badge 
                  variant={challenge.completed ? "outline" : "secondary"} 
                  className={challenge.completed ? "border-success text-success" : ""}
                >
                  {challenge.completed ? "Completed" : "In Progress"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm font-medium">
                    {challenge.currentValue} / {challenge.targetValue}
                  </span>
                </div>
                
                <Progress 
                  value={(challenge.currentValue / challenge.targetValue) * 100} 
                  className="h-2"
                />
                
                <div className="pt-3">
                  <h4 className="text-sm font-semibold mb-2">Rewards:</h4>
                  <ul className="space-y-1 text-sm">
                    {challenge.cashReward > 0 && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-5 h-5 rounded-full bg-success/20 text-success text-xs flex items-center justify-center">$</span>
                        <span>{challenge.cashReward.toLocaleString()} cash</span>
                      </li>
                    )}
                    {challenge.xpReward > 0 && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">XP</span>
                        <span>{challenge.xpReward.toLocaleString()} experience</span>
                      </li>
                    )}
                    {challenge.respectReward > 0 && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-5 h-5 rounded-full bg-warning/20 text-warning text-xs flex items-center justify-center">R</span>
                        <span>{challenge.respectReward.toLocaleString()} respect</span>
                      </li>
                    )}
                    {challenge.itemReward > 0 && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-5 h-5 rounded-full bg-card text-card-foreground text-xs flex items-center justify-center">I</span>
                        <span>Special item</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant={challenge.completed && !challenge.claimed ? "default" : "outline"}
                size="sm"
                className={`w-full ${challenge.completed && !challenge.claimed ? "animate-pulse" : ""}`}
                disabled={!challenge.completed || challenge.claimed}
                onClick={() => claimReward(challenge.id)}
              >
                {challenge.claimed ? "Reward Claimed" : "Claim Reward"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}