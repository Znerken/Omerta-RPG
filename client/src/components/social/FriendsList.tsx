import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserPlus, X, Check, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Friend = {
  id: number;
  username: string;
  avatar: string | null;
  status: {
    status: string;
    lastActive: string;
  };
  isFriend: boolean;
  friendStatus: string;
  friendRequest: {
    id: number;
    status: string;
  } | null;
};

export function FriendsList() {
  const { toast } = useToast();

  const {
    data: friends,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/social/friends"],
    queryFn: async () => {
      const response = await fetch("/api/social/friends");
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      return response.json();
    }
  });

  const acceptFriendRequest = async (requestId: number) => {
    try {
      await apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "accepted" });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    }
  };

  const rejectFriendRequest = async (requestId: number) => {
    try {
      await apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "rejected" });
      toast({
        title: "Friend request rejected",
        description: "Friend request has been rejected"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive"
      });
    }
  };

  const removeFriend = async (friendId: number) => {
    try {
      await apiRequest("DELETE", `/api/social/friends/${friendId}`);
      toast({
        title: "Friend removed",
        description: "You are no longer friends"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-destructive">
        <p>Error loading friends</p>
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>You don't have any friends yet.</p>
      </div>
    );
  }

  // Group friends by status
  const pendingRequests = friends.filter((friend: Friend) => friend.friendStatus === "pending");
  const acceptedFriends = friends.filter((friend: Friend) => friend.friendStatus === "accepted");

  return (
    <div className="space-y-4">
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((friend: Friend) => (
              <Card key={friend.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar || undefined} />
                        <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{friend.username}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full p-2 h-8 w-8" 
                        onClick={() => acceptFriendRequest(friend.friendRequest?.id || 0)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full p-2 h-8 w-8" 
                        onClick={() => rejectFriendRequest(friend.friendRequest?.id || 0)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Friends ({acceptedFriends.length})</h3>
        <div className="space-y-2">
          {acceptedFriends.map((friend: Friend) => (
            <Card key={friend.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{friend.username}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          friend.status?.status === "online" 
                            ? "bg-green-500" 
                            : friend.status?.status === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}></span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {friend.status?.status || "offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => removeFriend(friend.id)}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}