import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressCountdown } from "@/components/ui/progress-countdown";
import { CrimeWithHistory } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { TimerIcon, Briefcase, Award, AlertTriangle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CrimeResultModal } from "./CrimeResultModal";

interface CrimeCardProps {
  crime: CrimeWithHistory;
}

export function CrimeCard({ crime }: CrimeCardProps) {
  const [showResultModal, setShowResultModal] = useState(false);
  const [crimeResult, setCrimeResult] = useState<any>(null);
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const isCooldown = crime.lastPerformed?.nextAvailableAt && 
    new Date(crime.lastPerformed.nextAvailableAt) > new Date();

  const executeCrime = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/crimes/${crime.id}/execute`);
      return await res.json();
    },
    onSuccess: (data) => {
      setCrimeResult(data);
      setShowResultModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/crimes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Show toast notification
      if (data.success) {
        const title = "Crime Successful!";
        const message = `You earned ${formatCurrency(data.cashReward)} and ${data.xpReward} XP from ${crime.name}.`;
        
        // Add to notification system
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "success",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id, reward: data.cashReward }
        });
        
        toast({
          title: title,
          description: message,
          variant: "default",
        });
      } else if (data.caught) {
        const title = "Busted!";
        const message = `You were caught attempting ${crime.name} and sent to jail for ${data.jailTime || 0} minutes.`;
        
        // Add to notification system
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "error",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id, jailTime: data.jailTime }
        });
        
        toast({
          title: title,
          description: "You were caught and sent to jail.",
          variant: "destructive",
        });
      } else {
        const title = "Crime Failed";
        const message = `You failed to execute ${crime.name} but managed to escape arrest.`;
        
        // Add to notification system
        addNotification({
          id: Date.now().toString(),
          title: title,
          message: message,
          type: "warning",
          read: false,
          timestamp: new Date(),
          data: { crimeId: crime.id }
        });
        
        toast({
          title: title,
          description: "You failed but managed to escape arrest.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteCrime = () => {
    executeCrime.mutate();
  };

  return (
    <>
      <Card className="crime-card transform transition-all duration-300 border border-transparent hover:border-primary/30 bg-dark-surface">
        <CardHeader>
          <CardTitle>{crime.name}</CardTitle>
          <CardDescription>{crime.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm">{formatCurrency(crime.minCashReward)}-{formatCurrency(crime.maxCashReward)}</span>
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm">{crime.minXpReward}-{crime.maxXpReward} XP</span>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm">{crime.jailRisk}% Jail Risk</span>
            </div>
            <div className="flex items-center">
              <TimerIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm">{crime.cooldown / 60}m Cooldown</span>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-400 mb-2">
            <span>Success chance:</span>
            <div className="flex-1 mx-2">
              <Progress 
                value={crime.successChance}
                className="h-1.5"
                indicatorClassName={
                  crime.successChance > 70 
                    ? "bg-success" 
                    : crime.successChance > 40 
                    ? "bg-warning" 
                    : "bg-danger"
                }
              />
            </div>
            <span className="font-medium">{crime.successChance}%</span>
          </div>
        </CardContent>
        <CardFooter>
          {isCooldown ? (
            <div className="w-full">
              <Button 
                className="w-full bg-dark-lighter text-gray-400 cursor-not-allowed" 
                disabled={true}
              >
                <TimerIcon className="h-4 w-4 mr-2" /> On Cooldown
              </Button>
              <ProgressCountdown 
                expiryTimestamp={new Date(crime.lastPerformed!.nextAvailableAt!)} 
                onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/crimes"] })}
                className="mt-2"
              />
            </div>
          ) : (
            <Button 
              className="w-full bg-primary hover:bg-primary/80 text-white" 
              onClick={handleExecuteCrime}
              disabled={executeCrime.isPending}
            >
              <Briefcase className="h-4 w-4 mr-2" /> 
              {executeCrime.isPending ? "Executing..." : "Execute Crime"}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {showResultModal && crimeResult && (
        <CrimeResultModal 
          result={crimeResult} 
          crimeName={crime.name}
          onClose={() => setShowResultModal(false)}
          onRepeat={!isCooldown ? handleExecuteCrime : undefined}
        />
      )}
    </>
  );
}
