import React, { useState } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  Clock, 
  HelpCircle, 
  UserCheck,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FriendActionButtonProps {
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
  size = 'default',
  variant = 'default' 
}: FriendActionButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to determine what to display based on status
  const getActionInfo = () => {
    if (friendStatus === 'friends') {
      return {
        label: 'Friends',
        icon: <UserCheck className="mr-2 h-4 w-4" />,
      };
    } else if (friendStatus === 'sent') {
      return {
        label: 'Pending',
        icon: <Clock className="mr-2 h-4 w-4" />,
      };
    } else if (friendStatus === 'received') {
      return {
        label: 'Respond',
        icon: <HelpCircle className="mr-2 h-4 w-4" />,
      };
    } else {
      return {
        label: 'Add Friend',
        icon: <UserPlus className="mr-2 h-4 w-4" />,
      };
    }
  };

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/social/friends/request', { receiverId: userId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/users', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async () => {
      if (!friendRequest) throw new Error('No friend request found');
      const response = await apiRequest('PUT', `/api/social/friends/request/${friendRequest.id}`, { status: 'accepted' });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Friend request accepted',
        description: 'You are now friends!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/users', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends/requests/pending'] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to accept friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async () => {
      if (!friendRequest) throw new Error('No friend request found');
      const response = await apiRequest('PUT', `/api/social/friends/request/${friendRequest.id}`, { status: 'rejected' });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Friend request rejected',
        description: 'The friend request has been rejected.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/users', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends/requests/pending'] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reject friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/social/friends/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove friend');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Friend removed',
        description: 'You are no longer friends with this user.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/users', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove friend',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Cancel friend request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async () => {
      if (!friendRequest) throw new Error('No friend request found');
      const response = await apiRequest('DELETE', `/api/social/friends/request/${friendRequest.id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Friend request canceled',
        description: 'Your friend request has been canceled.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/users', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/friends/requests/sent'] });
      if (onActionComplete) onActionComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to cancel friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleButtonClick = () => {
    if (friendStatus === 'friends') {
      // If friends, show dropdown menu
      setIsDropdownOpen(true);
    } else if (friendStatus === 'sent') {
      // If request sent, cancel the request
      cancelRequestMutation.mutate();
    } else if (friendStatus === 'received') {
      // If request received, show dropdown for accept/reject
      setIsDropdownOpen(true);
    } else {
      // If not friends, send friend request
      sendRequestMutation.mutate();
    }
  };

  const { label, icon } = getActionInfo();
  const isLoading = 
    sendRequestMutation.isPending || 
    acceptRequestMutation.isPending || 
    rejectRequestMutation.isPending || 
    removeFriendMutation.isPending ||
    cancelRequestMutation.isPending;

  // For existing friends, show dropdown with option to remove friend
  if (friendStatus === 'friends') {
    return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
          >
            {icon} {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            onClick={() => removeFriendMutation.mutate()}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remove Friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For received requests, show dropdown with accept/reject options
  if (friendStatus === 'received') {
    return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
          >
            {icon} {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => acceptRequestMutation.mutate()}>
            <Check className="mr-2 h-4 w-4" />
            Accept
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => rejectRequestMutation.mutate()}
            className="text-destructive focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For other statuses (sent or none), just show the button
  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading}
      onClick={handleButtonClick}
    >
      {isLoading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        icon
      )}
      {label}
    </Button>
  );
}