import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Search, UserCheck, Clock, X, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "@/lib/utils";
import { Link } from "wouter";

import { UserWithStatus } from "@/types";

export function AddFriend() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set up debounced search
  const debouncedSearch = React.useMemo(
    () =>
      debounce((query: string) => {
        if (query.trim().length >= 3) {
          setDebouncedQuery(query);
        }
      }, 500),
    []
  );
  
  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };
  
  // Query for search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/social/users/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) return [];
      
      const response = await apiRequest("GET", `/api/social/users/search?q=${encodeURIComponent(debouncedQuery)}`);
      return await response.json() as UserWithStatus[];
    },
    enabled: debouncedQuery.length >= 3,
  });
  
  // Mutation for sending friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", "/api/social/friends/request", { friendId: userId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "They will be notified of your request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/users/search", debouncedQuery] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
    }
  });
  
  // Render user search result item
  const renderUserItem = (user: UserWithStatus) => {
    let actionButton;
    
    if (user.isFriend) {
      // Already friends
      actionButton = (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-500 border-green-500/20">
          <UserCheck className="h-3 w-3" />
          Friends
        </Badge>
      );
    } else if (user.friendStatus === "pending") {
      // Request already sent
      actionButton = (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    } else {
      // Can send request
      actionButton = (
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0 rounded-full"
          disabled={sendFriendRequestMutation.isPending}
          onClick={() => sendFriendRequestMutation.mutate(user.id)}
        >
          {sendFriendRequestMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </Button>
      );
    }
    
    return (
      <div key={user.id} className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${user.id}`} className="flex items-center hover:opacity-80 transition-opacity">
            <Avatar>
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium flex items-center">
                {user.username}
                <User className="h-3 w-3 ml-1 text-muted-foreground" />
              </p>
            </div>
          </Link>
        </div>
        {actionButton}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by username"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-sm text-muted-foreground mb-4">
            Type at least 3 characters to search
          </p>
        )}
        
        {isLoading && debouncedQuery.length >= 3 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {!isLoading && searchResults && searchResults.length === 0 && debouncedQuery.length >= 3 && (
          <div className="text-center py-4">
            <X className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
        
        {!isLoading && searchResults && searchResults.length > 0 && (
          <ScrollArea className="h-[250px]">
            <div className="space-y-1">
              {searchResults.map((user) => (
                <React.Fragment key={user.id}>
                  {renderUserItem(user)}
                  <Separator className="my-1" />
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}