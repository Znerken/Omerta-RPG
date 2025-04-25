import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, X, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Handle auto-dismiss
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  // Define colors and icons based on type
  const styles = {
    success: {
      bgColor: "bg-success bg-opacity-90",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    error: {
      bgColor: "bg-destructive bg-opacity-90",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    warning: {
      bgColor: "bg-yellow-600 bg-opacity-90",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    info: {
      bgColor: "bg-blue-600 bg-opacity-90",
      icon: <Info className="h-5 w-5" />,
    },
  };

  return (
    <div
      className={cn(
        "notification text-white p-3 rounded-lg shadow-lg flex items-start",
        styles[type].bgColor
      )}
    >
      <div className="text-2xl mr-2 flex-shrink-0">{styles[type].icon}</div>
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm">{message}</p>
      </div>
      <button className="text-white ml-2" onClick={handleClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function NotificationContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 w-80 z-50 space-y-2">
      {children}
    </div>
  );
}
