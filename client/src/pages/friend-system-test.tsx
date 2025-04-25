import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, UserPlus, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt?: string;
  sender?: User;
  receiver?: User;
}

interface Friend extends User {
  status?: {
    status: string;
    lastActive: string;
  };
  friendStatus?: string;
}

export default function FriendSystemTestPage() {
  const [loading, setLoading] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFriendId, setNewFriendId] = useState("");
  const [testUsers, setTestUsers] = useState<User[]>([]);
  const [selectedTestUser, setSelectedTestUser] = useState<string>("");
  const [databaseStatus, setDatabaseStatus] = useState<{table: string, exists: boolean}[]>([]);
  
  const { toast } = useToast();

  // Load current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiRequest("GET", "/api/user");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Check database table status
  const checkDatabaseTables = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/dev/check-social-tables");
      const data = await response.json();
      setDatabaseStatus(data);
    } catch (error) {
      console.error("Error checking database tables:", error);
      toast({
        title: "Database Check Failed",
        description: "Unable to check database table status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create test tables if needed
  const createTestTables = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/dev/create-social-tables");
      const data = await response.json();
      toast({
        title: "Tables Created",
        description: data.message,
      });
      // Refresh table status
      await checkDatabaseTables();
    } catch (error) {
      console.error("Error creating tables:", error);
      toast({
        title: "Failed to Create Tables",
        description: "See console for details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load test users
  const loadTestUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/dev/test-users");
      const data = await response.json();
      setTestUsers(data);
    } catch (error) {
      console.error("Error loading test users:", error);
      toast({
        title: "Failed to Load Test Users",
        description: "See console for details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create test relationships
  const createTestRelationships = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/dev/create-test-relationships");
      const data = await response.json();
      toast({
        title: "Test Data Created",
        description: data.message,
      });
      // Refresh data
      await loadFriendData();
    } catch (error) {
      console.error("Error creating test relationships:", error);
      toast({
        title: "Failed to Create Test Data",
        description: "See console for details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load friend data
  const loadFriendData = async () => {
    if (!user) return;
    
    setFriendLoading(true);
    try {
      // Load friends
      const friendsRes = await apiRequest("GET", "/api/social/friends");
      const friendsData = await friendsRes.json();
      setFriends(friendsData);

      // Load pending requests
      const pendingRes = await apiRequest("GET", "/api/social/friends/requests/pending");
      const pendingData = await pendingRes.json();
      setPendingRequests(pendingData);

      // Load sent requests
      const sentRes = await apiRequest("GET", "/api/social/friends/requests/sent");
      const sentData = await sentRes.json();
      setSentRequests(sentData);
    } catch (error) {
      console.error("Error loading friend data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load friend data. See console for details.",
        variant: "destructive",
      });
    } finally {
      setFriendLoading(false);
    }
  };

  // Load friend data when user changes
  useEffect(() => {
    if (user) {
      loadFriendData();
    }
  }, [user]);

  // Search users
  const searchUsers = async () => {
    if (searchQuery.length < 3) {
      toast({
        title: "Search Query Too Short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("GET", `/api/social/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (receiverId: number) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/social/friends/request", {
        receiverId,
      });
      
      const data = await response.json();
      toast({
        title: "Request Sent",
        description: "Friend request sent successfully",
      });
      
      // Refresh data
      await loadFriendData();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Request Failed",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Accept friend request
  const handleFriendRequest = async (requestId: number, status: string) => {
    setLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/social/friends/request/${requestId}`, {
        status,
      });
      
      const data = await response.json();
      toast({
        title: status === "accepted" ? "Request Accepted" : "Request Rejected",
        description: status === "accepted" 
          ? "Friend request accepted successfully" 
          : "Friend request rejected",
      });
      
      // Refresh data
      await loadFriendData();
    } catch (error) {
      console.error(`Error ${status} friend request:`, error);
      toast({
        title: "Action Failed",
        description: `Failed to ${status} friend request`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove friend
  const removeFriend = async (friendId: number) => {
    setLoading(true);
    try {
      const response = await apiRequest("DELETE", `/api/social/friends/${friendId}`);
      
      if (response.ok) {
        toast({
          title: "Friend Removed",
          description: "Friend removed successfully",
        });
      }
      
      // Refresh data
      await loadFriendData();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel friend request
  const cancelFriendRequest = async (requestId: number) => {
    setLoading(true);
    try {
      const response = await apiRequest("DELETE", `/api/social/friends/request/${requestId}`);
      
      if (response.ok) {
        toast({
          title: "Request Canceled",
          description: "Friend request canceled successfully",
        });
      }
      
      // Refresh data
      await loadFriendData();
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Friend System Test Page</h1>
      
      {/* Current User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Your current user information</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
              </div>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </CardContent>
      </Card>
      
      {/* Database Status & Setup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Check and set up database tables for the friend system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={checkDatabaseTables} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Tables
              </Button>
              <Button onClick={createTestTables} disabled={loading} variant="secondary">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Missing Tables
              </Button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Table Status:</h3>
              {databaseStatus.length > 0 ? (
                <ul className="space-y-1">
                  {databaseStatus.map((table) => (
                    <li key={table.table} className="flex items-center justify-between">
                      <span>{table.table}</span>
                      {table.exists ? (
                        <Badge variant="success" className="bg-green-600">Exists</Badge>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Click "Check Tables" to see table status</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
          <CardDescription>Create and manage test data for the friend system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={loadTestUsers} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load Test Users
              </Button>
              <Button onClick={createTestRelationships} disabled={loading} variant="secondary">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Test Relationships
              </Button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Test Users:</h3>
              {testUsers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {testUsers.map((testUser) => (
                    <div key={testUser.id} className="flex items-center gap-2 p-2 border rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={testUser.avatar} alt={testUser.username} />
                        <AvatarFallback>{testUser.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{testUser.username}</p>
                        <p className="text-sm text-muted-foreground">ID: {testUser.id}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendFriendRequest(testUser.id)}
                        disabled={loading}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Click "Load Test Users" to see test users</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Friends List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Friends
              {friends.length > 0 && (
                <Badge className="ml-2" variant="secondary">{friends.length}</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Your current friends</CardDescription>
        </CardHeader>
        <CardContent>
          {friendLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={friend.avatar} alt={friend.username} />
                      <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.username}</p>
                      <div className="flex items-center">
                        <Badge 
                          variant={friend.status?.status === "online" ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {friend.status?.status || "offline"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeFriend(friend.id)}
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No friends yet</p>
          )}
          
          <Button 
            className="w-full mt-4" 
            variant="outline" 
            onClick={loadFriendData} 
            disabled={friendLoading || !user}
          >
            {friendLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                Refresh Friend Data
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Friend Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Friend requests waiting for your response</CardDescription>
          </CardHeader>
          <CardContent>
            {friendLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar>
                        <AvatarImage src={request.sender?.avatar} alt={request.sender?.username} />
                        <AvatarFallback>
                          {request.sender?.username.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.sender?.username}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {request.senderId}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleFriendRequest(request.id, "accepted")}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleFriendRequest(request.id, "rejected")}
                        disabled={loading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No pending requests</p>
            )}
          </CardContent>
        </Card>
        
        {/* Sent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Requests</CardTitle>
            <CardDescription>Friend requests you've sent</CardDescription>
          </CardHeader>
          <CardContent>
            {friendLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sentRequests.length > 0 ? (
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div key={request.id} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar>
                        <AvatarImage src={request.receiver?.avatar} alt={request.receiver?.username} />
                        <AvatarFallback>
                          {request.receiver?.username.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.receiver?.username}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {request.receiverId}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">
                        {request.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => cancelFriendRequest(request.id)}
                        disabled={loading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No sent requests</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users to add as friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search username (min 3 chars)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchUsers} disabled={loading || searchQuery.length < 3}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={result.avatar} alt={result.username} />
                      <AvatarFallback>{result.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{result.username}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">ID: {result.id}</p>
                        {result.friendStatus && (
                          <Badge variant="outline" className="ml-2">
                            {result.friendStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {result.isFriend ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFriend(result.id)}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  ) : result.friendStatus === "sent" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelFriendRequest(result.friendRequest?.id)}
                      disabled={loading}
                    >
                      Cancel Request
                    </Button>
                  ) : result.friendStatus === "received" ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleFriendRequest(result.friendRequest?.id, "accepted")}
                        disabled={loading}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFriendRequest(result.friendRequest?.id, "rejected")}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(result.id)}
                      disabled={loading}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              {searchQuery.length >= 3 ? "No users found" : "Enter at least 3 characters to search"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}