import React from "react";
import { UserPlus, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FriendRequestNotificationProps {
  requestId: number;
  userId: number;
  username: string;
  avatar?: string | null;
  onDismiss: () => void;
}

export function FriendRequestNotification({
  requestId,
  userId,
  username,
  avatar,
  onDismiss
}: FriendRequestNotificationProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${username}!`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
      onDismiss();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "rejected" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: `You have rejected the friend request from ${username}`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
      onDismiss();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="w-full p-4 bg-background rounded-lg border shadow-md mb-2">
      <div className="flex items-center space-x-2 mb-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Friend Request</h4>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-muted-foreground">wants to be your friend</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full" 
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            <UserCheck className="h-4 w-4 text-green-500" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => rejectMutation.mutate()}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            <UserX className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FriendStatusNotificationProps {
  userId: number;
  username: string;
  avatar?: string | null;
  status: string;
  onDismiss: () => void;
}

export function FriendStatusNotification({
  userId,
  username,
  avatar,
  status,
  onDismiss
}: FriendStatusNotificationProps) {
  const statusColor = 
    status === "online" ? "bg-green-500" :
    status === "away" ? "bg-yellow-500" :
    status === "busy" ? "bg-red-500" :
    "bg-gray-400";

  return (
    <div className="w-full p-4 bg-background rounded-lg border shadow-md mb-2">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
        <h4 className="text-sm font-medium">Friend Status</h4>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-muted-foreground">
              is now <span className="capitalize">{status}</span>
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}