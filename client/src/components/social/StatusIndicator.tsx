import React, { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  online: "bg-green-500 border-green-400",
  away: "bg-yellow-500 border-yellow-400",
  busy: "bg-red-500 border-red-400",
  offline: "bg-gray-400 border-gray-400",
} as const;

const statusVariants = cva("absolute border rounded-full", {
  variants: {
    size: {
      sm: "w-2 h-2 right-0 bottom-0",
      md: "w-3 h-3 right-0 bottom-0",
      lg: "w-4 h-4 right-0 bottom-0",
    },
    status: {
      online: statusColors.online,
      away: statusColors.away,
      busy: statusColors.busy,
      offline: statusColors.offline,
    },
  },
  defaultVariants: {
    size: "md",
    status: "offline",
  },
});

export interface StatusIndicatorProps
  extends VariantProps<typeof statusVariants> {
  children: ReactNode;
  status: string;
  isEditable?: boolean;
  userId?: number;
}

export function StatusIndicator({
  children,
  status = "offline",
  size,
  isEditable = false,
  userId,
}: StatusIndicatorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const statusClass = statusVariants({ size, status: status as any });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest("PUT", "/api/social/status", { status: newStatus });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `Your status is now set to ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });
  
  // Status labels for tooltip and menu
  const statusLabels: Record<string, string> = {
    online: "Online",
    away: "Away",
    busy: "Busy",
    offline: "Offline",
  };
  
  // If not editable, just show with tooltip
  if (!isEditable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              {children}
              <span className={statusClass}></span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">{statusLabels[status] || status}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If editable, show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative inline-block cursor-pointer">
          {children}
          <span className={statusClass}></span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => updateStatusMutation.mutate("online")}
        >
          <span className={`w-2 h-2 rounded-full ${statusColors.online}`}></span>
          <span>Online</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => updateStatusMutation.mutate("away")}
        >
          <span className={`w-2 h-2 rounded-full ${statusColors.away}`}></span>
          <span>Away</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => updateStatusMutation.mutate("busy")}
        >
          <span className={`w-2 h-2 rounded-full ${statusColors.busy}`}></span>
          <span>Busy</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => updateStatusMutation.mutate("offline")}
        >
          <span className={`w-2 h-2 rounded-full ${statusColors.offline}`}></span>
          <span>Offline</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}