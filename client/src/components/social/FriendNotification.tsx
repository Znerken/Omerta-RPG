import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, UserMinus } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";

interface FriendRequestNotificationProps {
  requestId: number;
  userId: number;
  username: string;
  avatar: string | null;
  onDismiss: () => void;
}

export const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
  requestId,
  userId,
  username,
  avatar,
  onDismiss
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${username}`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
      onDismiss();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive"
      });
    }
  });
  
  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "rejected" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The request has been rejected"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
      onDismiss();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject friend request",
        variant: "destructive"
      });
    }
  });
  
  return (
    <Card className="mb-2 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-muted-foreground">Sent you a friend request</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
            onClick={() => acceptRequestMutation.mutate()}
            disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
          >
            {acceptRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Accept
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
            onClick={() => rejectRequestMutation.mutate()}
            disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
          >
            {rejectRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserMinus className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface FriendStatusNotificationProps {
  userId: number;
  username: string;
  avatar: string | null;
  status: string;
  onDismiss: () => void;
}

export const FriendStatusNotification: React.FC<FriendStatusNotificationProps> = ({
  userId,
  username,
  avatar,
  status,
  onDismiss
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "is now online";
      case "offline":
        return "has gone offline";
      case "away":
        return "is now away";
      case "busy":
        return "is busy";
      default:
        return `is now ${status}`;
    }
  };
  
  return (
    <Card className="mb-2 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StatusIndicator status={status} size="md">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </StatusIndicator>
            <div>
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">{getStatusText(status)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-2"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};