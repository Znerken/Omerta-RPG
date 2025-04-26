import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Circle, User, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Friend } from "@/types/social";
import { FriendIndicator } from "./FriendIndicator";
import { useState } from "react";
import { Link } from "wouter";
import { PlayerLink } from "./PlayerLink";

export function SocialSidebar() {
  // Fetch friends list
  const {
    data: friends = [],
    isLoading: isLoadingFriends,
    error: friendsError,
  } = useQuery({
    queryKey: ["/api/social/friends"],
    queryFn: () => fetch("/api/social/friends").then(res => res.json()),
  });

  // Split friends by online status
  const onlineFriends = friends.filter((friend: Friend) => friend.status?.status === "online");
  const offlineFriends = friends.filter((friend: Friend) => friend.status?.status !== "online");

  return (
    <div className="w-full">
      <Card className="h-full">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {friends.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {isLoadingFriends ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : friendsError ? (
            <div className="text-center py-4 text-muted-foreground">
              Could not load friends list
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-3">
              <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No friends yet
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                asChild
              >
                <Link href="/friends">Find Friends</Link>
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="online">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="online" className="text-xs">
                  Online ({onlineFriends.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All Friends ({friends.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="online" className="mt-2">
                {onlineFriends.length === 0 ? (
                  <div className="text-center py-3">
                    <Circle className="h-6 w-6 mx-auto mb-1 text-gray-500 opacity-30" />
                    <p className="text-xs text-muted-foreground">
                      No friends online
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] pr-3">
                    <div className="space-y-1">
                      {onlineFriends.map((friend: Friend) => (
                        <div key={friend.id} className="group relative py-1 hover:bg-accent/50 rounded-md transition-colors px-1">
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-shrink-0">
                              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background z-10" />
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={friend.avatar || undefined} />
                                <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </div>
                            <PlayerLink 
                              userId={friend.id} 
                              username={friend.username} 
                              className="text-xs" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="mt-2">
                <ScrollArea className="h-[200px] pr-3">
                  {onlineFriends.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Online</h4>
                      <div className="space-y-1">
                        {onlineFriends.map((friend: Friend) => (
                          <div key={friend.id} className="group relative py-1 hover:bg-accent/50 rounded-md transition-colors px-1">
                            <div className="flex items-center space-x-2">
                              <div className="relative flex-shrink-0">
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background z-10" />
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={friend.avatar || undefined} />
                                  <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </div>
                              <PlayerLink 
                                userId={friend.id} 
                                username={friend.username} 
                                className="text-xs" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {offlineFriends.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Offline</h4>
                      <div className="space-y-1">
                        {offlineFriends.map((friend: Friend) => (
                          <div key={friend.id} className="group relative py-1 hover:bg-accent/50 rounded-md transition-colors px-1">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={friend.avatar || undefined} />
                                <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <PlayerLink 
                                userId={friend.id} 
                                username={friend.username} 
                                className="text-xs text-muted-foreground" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          
          <Separator className="my-2" />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8 mt-1"
            asChild
          >
            <Link href="/friends">
              <User className="h-3.5 w-3.5 mr-1" />
              Manage Friends
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}