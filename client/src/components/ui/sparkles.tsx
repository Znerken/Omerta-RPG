import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  sparkleColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

interface Sparkle {
  id: string;
  size: number;
  style: React.CSSProperties;
}

const DEFAULT_COLOR = "rgb(255, 215, 0)";

export const Sparkles = ({
  className,
  sparkleColor = DEFAULT_COLOR,
  intensity = 'medium',
  children
}: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const intensityMap = {
    low: 2,
    medium: 4,
    high: 8
  };

  const maxSparkles = intensityMap[intensity];

  const generateSparkle = (): Sparkle => {
    return {
      id: Math.random().toString(36).slice(2),
      size: Math.random() * 10 + 5,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        backgroundColor: sparkleColor,
        boxShadow: `0 0 8px ${sparkleColor}`,
        opacity: Math.random(),
        animationDuration: `${Math.random() * 1.5 + 0.5}s`,
      },
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (sparkles.length < maxSparkles) {
        setSparkles(sparkles => [...sparkles, generateSparkle()]);
      } else {
        setSparkles(sparkles => {
          // Remove oldest sparkle
          const [_, ...rest] = sparkles;
          return [...rest, generateSparkle()];
        });
      }
    }, 400);

    return () => clearInterval(interval);
  }, [sparkles, maxSparkles]);

  return (
    <div className={cn("relative inline-block", className)}>
      {sparkles.map(sparkle => (
        <span
          key={sparkle.id}
          className="absolute inline-block rounded-full animate-ping pointer-events-none"
          style={{
            ...sparkle.style,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
          }}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
};