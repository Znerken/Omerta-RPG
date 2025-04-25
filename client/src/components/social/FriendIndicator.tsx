import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusIndicator } from "./StatusIndicator";
import { Friend } from "@/types/social";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MessageSquare, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FriendIndicatorProps {
  friend: Friend;
  showActions?: boolean;
  compact?: boolean;
}

export const FriendIndicator: React.FC<FriendIndicatorProps> = ({ 
  friend, 
  showActions = true,
  compact = false 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("DELETE", `/api/social/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "This user has been removed from your friends list"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive"
      });
    }
  });
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "away":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "busy":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <StatusIndicator status={friend.status?.status || "offline"} size="sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={friend.avatar || undefined} />
            <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </StatusIndicator>
        <span className="text-sm font-medium">{friend.username}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <StatusIndicator status={friend.status?.status || "offline"}>
            <Avatar>
              <AvatarImage src={friend.avatar || undefined} />
              <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </StatusIndicator>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{friend.username}</p>
            <Badge 
              variant="outline" 
              className={`text-xs px-1.5 py-0 ${getStatusColor(friend.status?.status || "offline")}`}
            >
              {friend.status?.status || "offline"}
            </Badge>
          </div>
          {friend.status?.lastLocation && (
            <p className="text-xs text-muted-foreground">
              Last seen: {friend.status.lastLocation}
            </p>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => {
              window.location.href = `/messages?userId=${friend.id}`;
            }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50/10"
            onClick={() => removeFriendMutation.mutate(friend.id)}
            disabled={removeFriendMutation.isPending}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};