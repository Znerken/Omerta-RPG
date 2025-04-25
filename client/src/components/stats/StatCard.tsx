import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressCountdown } from "@/components/ui/progress-countdown";
import { Dumbbell, Footprints, BookOpen, SmilePlus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";

interface StatCardProps {
  name: "strength" | "stealth" | "charisma" | "intelligence";
  value: number;
  maxValue: number;
  cooldownTime?: Date | null;
  icon?: React.ReactNode;
  progressColor?: string;
}

export function StatCard({
  name,
  value,
  maxValue,
  cooldownTime,
  progressColor,
}: StatCardProps) {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const [isTraining, setIsTraining] = useState(false);
  
  const isCooldown = cooldownTime && new Date(cooldownTime) > new Date();
  const percentage = Math.min(100, Math.round((value / maxValue) * 100));

  const getIcon = () => {
    switch (name) {
      case "strength":
        return <Dumbbell className="h-4 w-4 mr-1" />;
      case "stealth":
        return <Footprints className="h-4 w-4 mr-1" />;
      case "charisma":
        return <SmilePlus className="h-4 w-4 mr-1" />;
      case "intelligence":
        return <BookOpen className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getColorClass = () => {
    if (progressColor) return progressColor;
    
    switch (name) {
      case "strength":
        return "bg-red-600";
      case "stealth":
        return "bg-green-600";
      case "charisma":
        return "bg-blue-600";
      case "intelligence":
        return "bg-yellow-600";
      default:
        return "bg-primary";
    }
  };

  const trainMutation = useMutation({
    mutationFn: async () => {
      setIsTraining(true);
      const res = await apiRequest("POST", `/api/stats/train/${name}`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsTraining(false);
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      const title = "Training Complete";
      const message = data.message || `${name.charAt(0).toUpperCase() + name.slice(1)} increased by ${data.increase || 1} point!`;
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "success",
        read: false,
        timestamp: new Date(),
        data: { 
          stat: name, 
          increase: data.increase || 1,
          newValue: data.newValue || (value + 1)
        }
      });
      
      toast({
        title: title,
        description: message,
      });
    },
    onError: (error) => {
      setIsTraining(false);
      toast({
        title: "Training Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTrain = () => {
    trainMutation.mutate();
  };

  const formatName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <Card className="bg-dark-surface rounded-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-gray-400">{formatName}</h4>
          <span className="text-lg font-mono">{value}/{maxValue}</span>
        </div>
        <div className="w-full bg-dark rounded-full h-2 mb-2">
          <div className={`${getColorClass()} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
        </div>
        
        {isCooldown ? (
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full mt-2 bg-dark-lighter text-gray-400 cursor-not-allowed"
              disabled={true}
            >
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Training (Cooldown)
            </Button>
            <ProgressCountdown
              expiryTimestamp={new Date(cooldownTime)}
              onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/stats"] })}
              className="mt-2"
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full mt-2 bg-dark-lighter hover:bg-opacity-80"
            onClick={handleTrain}
            disabled={isTraining || value >= maxValue}
          >
            {isTraining ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Training...
              </>
            ) : (
              <>
                {getIcon()} Train
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
