import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  UserMinus, 
  MessageSquare, 
  Search, 
  Users, 
  UserPlus,
  Clock,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Friend } from "@/types";

export function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for friends
  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["/api/social/friends"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/social/friends");
      return await response.json() as Friend[];
    }
  });
  
  // Query for friend requests
  const { data: friendRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/social/friends/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/social/friends/requests");
      return await response.json() as Friend[];
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
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
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
    mutationFn: async (requestId: number) => {
      return apiRequest("PUT", `/api/social/friends/request/${requestId}`, { status: "rejected" });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The request has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject friend request",
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive"
      });
    }
  });
  
  // Filter friends by search query
  const filteredFriends = friends?.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="friends" className="flex-1">
              My Friends
              {friends && friends.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {friends.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              Requests
              {friendRequests && friendRequests.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search friends"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            
            {isLoadingFriends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !friends || friends.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No friends yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the "Find Friends" tab to start adding friends
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-1">
                  {filteredFriends?.map(friend => (
                    <React.Fragment key={friend.id}>
                      <FriendIndicator friend={friend} />
                      <Separator />
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="requests">
            {isLoadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !friendRequests || friendRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No pending requests</p>
                <p className="text-sm text-muted-foreground">
                  When someone sends you a friend request, it will appear here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {friendRequests.map(request => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={request.avatar || undefined} />
                            <AvatarFallback>{request.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{request.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Wants to be your friend
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                            onClick={() => request.friendRequest && acceptRequestMutation.mutate(request.friendRequest.id)}
                            disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            onClick={() => request.friendRequest && rejectRequestMutation.mutate(request.friendRequest.id)}
                            disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}