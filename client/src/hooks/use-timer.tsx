import { useState, useEffect, useCallback } from 'react';

interface UseTimerProps {
  expiryTimestamp: Date;
  onExpire?: () => void;
  autoStart?: boolean;
}

interface TimerReturn {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: (newExpiryTimestamp: Date) => void;
  totalSeconds: number;
  formattedTime: string;
  percentageRemaining: number;
}

export function useTimer({ expiryTimestamp, onExpire, autoStart = true }: UseTimerProps): TimerReturn {
  const [expiryTime, setExpiryTime] = useState(expiryTimestamp);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    Math.max(0, Math.floor((expiryTime.getTime() - new Date().getTime()) / 1000))
  );
  const [isRunning, setIsRunning] = useState(autoStart);
  const [totalDuration, setTotalDuration] = useState<number>(timeRemaining);

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const difference = expiryTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(difference / 1000));
  }, [expiryTime]);

  // Handle time updates
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        onExpire && onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, calculateTimeRemaining, onExpire]);

  // Update total duration when expiry changes
  useEffect(() => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    setTotalDuration(remaining);
  }, [expiryTime, calculateTimeRemaining]);

  // Convert seconds to time units
  const days = Math.floor(timeRemaining / (24 * 60 * 60));
  const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
  const seconds = Math.floor(timeRemaining % 60);

  // Format time as MM:SS or HH:MM:SS
  const formattedTime = timeRemaining > 3600
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate percentage of time remaining
  const percentageRemaining = totalDuration > 0
    ? Math.floor((timeRemaining / totalDuration) * 100)
    : 0;

  // Timer controls
  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const resume = () => setIsRunning(true);
  
  const restart = (newExpiryTimestamp: Date) => {
    setExpiryTime(newExpiryTimestamp);
    setIsRunning(true);
  };

  return {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
    totalSeconds: timeRemaining,
    formattedTime,
    percentageRemaining,
  };
}
