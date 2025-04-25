import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: number;
  username: string;
  avatar: string | null;
  isFriend: boolean;
  friendStatus?: string;
};

export function AddFriend() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // In a real implementation, this would be an API call to search users
      // For now, we'll simulate with a placeholder API endpoint
      const response = await apiRequest(
        "GET", 
        `/api/social/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(await response.json());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for users",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("POST", "/api/social/friends/request", { friendId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  });

  const handleSendRequest = (friendId: number) => {
    sendFriendRequestMutation.mutate(friendId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            onClick={handleSearch} 
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
          {searching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!searching && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found with that username</p>
            </div>
          )}

          {!searching && searchResults.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.username}</div>
                  </div>
                  <div>
                    {user.isFriend ? (
                      <Button variant="outline" size="sm" disabled>
                        {user.friendStatus === "pending" ? "Pending" : "Already Friends"}
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleSendRequest(user.id)}
                        disabled={sendFriendRequestMutation.isPending}
                      >
                        {sendFriendRequestMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        Add Friend
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button 
            variant="secondary" 
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}