import { useEffect, useState } from "react";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

interface ProgressCountdownProps {
  expiryTimestamp: Date;
  onComplete?: () => void;
  className?: string;
  showText?: boolean;
}

export function ProgressCountdown({
  expiryTimestamp,
  onComplete,
  className,
  showText = true,
}: ProgressCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(100);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryTimestamp.getTime() - now.getTime();
      return Math.max(0, Math.floor(difference / 1000));
    };
    
    // Calculate total duration once
    const initialTimeLeft = calculateTimeLeft();
    if (totalDuration === 0 && initialTimeLeft > 0) {
      setTotalDuration(initialTimeLeft);
    }
    
    // Initial update
    const timeRemaining = calculateTimeLeft();
    setTimeLeft(timeRemaining);
    
    if (totalDuration > 0) {
      setPercentage(Math.min(100, (timeRemaining / totalDuration) * 100));
    }
    
    // Set up interval
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (totalDuration > 0) {
        setPercentage(Math.min(100, (remaining / totalDuration) * 100));
      }
      
      if (remaining <= 0) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiryTimestamp, onComplete, totalDuration]);
  
  // Format the time left
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <Progress value={percentage} className="h-2" />
      {showText && (
        <div className="text-xs text-gray-400 mt-1 text-right">
          {formatTime(timeLeft)}
        </div>
      )}
    </div>
  );
}
