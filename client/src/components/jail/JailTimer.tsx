import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface JailTimerProps {
  releaseTime: Date;
  onRelease: () => void;
}

export function JailTimer({ releaseTime, onRelease }: JailTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(100);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = releaseTime.getTime() - now.getTime();
      return Math.max(0, Math.floor(difference / 1000));
    };
    
    // Calculate initial time left
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    
    // Calculate total duration once (this is for the progress bar)
    if (totalDuration === 0) {
      const now = new Date();
      // Estimate the total duration based on the time remaining
      // In a real app, we would have the original sentence duration
      const estimatedTotal = Math.max(120, Math.floor((releaseTime.getTime() - now.getTime()) / 1000));
      setTotalDuration(estimatedTotal);
    }
    
    // Update progress percentage
    setPercentage(Math.min(100, (calculateTimeLeft() / totalDuration) * 100));
    
    // Set up interval to update timer
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      // Update progress percentage
      if (totalDuration > 0) {
        setPercentage(Math.min(100, (remaining / totalDuration) * 100));
      }
      
      // Check if released
      if (remaining <= 0) {
        clearInterval(interval);
        // Auto-release through API
        fetch('/api/jail/auto-release', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          console.log('Auto-release check completed:', data);
          // Notify parent component
          onRelease();
        })
        .catch(error => {
          console.error('Error during auto-release:', error);
          // Still notify parent in case of error
          onRelease();
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [releaseTime, onRelease, totalDuration]);
  
  // Format the time left into hours, minutes, seconds
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Released";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let formattedTime = "";
    
    if (hours > 0) {
      formattedTime += `${hours}h `;
    }
    
    formattedTime += `${minutes}m ${remainingSeconds}s`;
    
    return formattedTime;
  };
  
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="text-2xl font-mono mb-3 flex items-center justify-center">
        <Clock className="h-5 w-5 mr-2 text-red-500" />
        {formatTime(timeLeft)}
      </div>
      
      <Progress value={percentage} className="h-3 bg-dark" indicatorClassName="bg-red-600" />
      
      <div className="mt-4 flex justify-between text-sm text-gray-400">
        <span>Current time</span>
        <span>Release: {releaseTime.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
