import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Check, DollarSign, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MafiaAlertType = "success" | "error" | "warning" | "money" | "xp" | "info";

interface MafiaAlertProps {
  type?: MafiaAlertType;
  title: string;
  message: string;
  amount?: number;
  duration?: number;
  className?: string;
  onClose?: () => void;
  autoClose?: boolean;
}

export function MafiaAlert({
  type = "info",
  title,
  message,
  amount,
  duration = 5000,
  className,
  onClose,
  autoClose = true,
}: MafiaAlertProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Automatically close alert after duration
  useEffect(() => {
    if (!autoClose) return;
    
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);
    
    const closeTimer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 500);
  };

  if (!visible) return null;

  const icons = {
    success: <Check className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    money: <DollarSign className="h-5 w-5 text-green-500" />,
    xp: <Zap className="h-5 w-5 text-blue-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  const colors = {
    success: "border-l-4 border-l-green-500 bg-green-500/10",
    error: "border-l-4 border-l-red-500 bg-red-500/10",
    warning: "border-l-4 border-l-yellow-500 bg-yellow-500/10",
    money: "border-l-4 border-l-green-500 bg-green-500/10",
    xp: "border-l-4 border-l-blue-500 bg-blue-500/10",
    info: "border-l-4 border-l-blue-500 bg-blue-500/10",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 max-w-md z-50 shadow-dramatic rounded-sm transition-all duration-500",
        colors[type],
        fadeOut ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
        className
      )}
    >
      <div className="relative p-4 paper-texture overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold">{title}</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="mt-1 text-sm text-muted-foreground">{message}</div>
            
            {(type === "money" || type === "xp") && amount !== undefined && (
              <div className="mt-2 font-typewriter font-bold text-sm">
                {type === "money" && (
                  <span className="text-green-500">+${amount.toLocaleString()}</span>
                )}
                {type === "xp" && (
                  <span className="text-blue-500">+{amount.toLocaleString()} XP</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Animation for the shimmer effect
const shimmerAnimation = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

// Add the shimmer animation to the global styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = shimmerAnimation;
  document.head.appendChild(style);
}