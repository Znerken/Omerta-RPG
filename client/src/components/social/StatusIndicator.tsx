import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type StatusOption = {
  id: string;
  label: string;
  color: string;
};

const statusOptions: StatusOption[] = [
  { id: "online", label: "Online", color: "bg-green-500" },
  { id: "away", label: "Away", color: "bg-yellow-500" },
  { id: "busy", label: "Busy", color: "bg-red-500" },
  { id: "offline", label: "Offline", color: "bg-gray-400" },
];

export function StatusIndicator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Get current page path for lastLocation
  useEffect(() => {
    setCurrentLocation(window.location.pathname);
  }, []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, lastLocation }: { status: string; lastLocation: string }) => {
      return apiRequest("POST", "/api/social/status", { status, lastLocation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status, lastLocation: currentLocation });
  };

  // Find current status from user object or default to offline
  const currentStatus = user?.status?.status || "offline";
  const statusOption = statusOptions.find((option) => option.id === currentStatus) || statusOptions[3];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 border border-input px-3"
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${statusOption.color}`}></span>
          )}
          <span className="capitalize">{statusOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Set Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleStatusChange(option.id)}
          >
            <span className={`w-2 h-2 rounded-full ${option.color}`}></span>
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}