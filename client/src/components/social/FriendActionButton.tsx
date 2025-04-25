import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { 
  UserPlus, 
  UserMinus, 
  User, 
  Loader2, 
  MessageSquare,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FriendActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  userId: number;
  friendStatus?: string;
  friendRequest?: {
    id: number;
    senderId: number;
    receiverId: number;
    status: string;
  } | null;
  onActionComplete?: () => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function FriendActionButton({ 
  userId,
  friendStatus,
  friendRequest,
  onActionComplete,
  className,
  size = 'default',
  variant = 'outline',
  ...props
}: FriendActionButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      return apiRequest("POST", "/api/social/friends/request", { receiverId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "They'll be notified of your request"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests/sent"] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "You are now friends with this user"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests/pending"] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "rejected" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The request has been rejected"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests/pending"] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Cancel friend request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("DELETE", `/api/social/friends/request/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request cancelled",
        description: "Your request has been cancelled"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests/sent"] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Determine loading state
  const isLoading = 
    sendRequestMutation.isPending || 
    acceptRequestMutation.isPending || 
    rejectRequestMutation.isPending || 
    cancelRequestMutation.isPending || 
    removeFriendMutation.isPending;

  // Render different button based on friend status
  if (friendStatus === "friends") {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("text-red-500 border-red-500/20 hover:bg-red-500/10", className)}
        onClick={() => removeFriendMutation.mutate(userId)}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserMinus className="mr-2 h-4 w-4" />
        )}
        Remove Friend
      </Button>
    );
  }

  if (friendStatus === "sent") {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("text-red-500 border-red-500/20 hover:bg-red-500/10", className)}
        onClick={() => friendRequest && cancelRequestMutation.mutate(friendRequest.id)}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <X className="mr-2 h-4 w-4" />
        )}
        Cancel Request
      </Button>
    );
  }

  if (friendStatus === "received") {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={size}
          className={cn("text-green-500 border-green-500/20 hover:bg-green-500/10", className)}
          onClick={() => friendRequest && acceptRequestMutation.mutate(friendRequest.id)}
          disabled={isLoading}
          {...props}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size={size}
          className={cn("text-red-500 border-red-500/20 hover:bg-red-500/10", className)}
          onClick={() => friendRequest && rejectRequestMutation.mutate(friendRequest.id)}
          disabled={isLoading}
          {...props}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Reject
        </Button>
      </div>
    );
  }

  // Default = not friends
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={() => sendRequestMutation.mutate(userId)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      Add Friend
    </Button>
  );
}