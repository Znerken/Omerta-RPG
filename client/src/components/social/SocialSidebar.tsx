import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Circle, User, UserPlus, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Friend } from "@/types/social";
import { cn } from "@/lib/utils";
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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Online Contacts</h3>
        <Badge 
          variant="outline" 
          className="text-xs font-normal bg-primary/5 border-primary/10 text-primary"
        >
          {onlineFriends.length} / {friends.length}
        </Badge>
      </div>

      {isLoadingFriends ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
        </div>
      ) : friendsError ? (
        <div className="text-center py-4 text-muted-foreground/70 text-xs">
          Could not load friends list
        </div>
      ) : friends.length === 0 ? (
        <div className="p-3 border border-border/60 rounded-md bg-card/30 backdrop-blur-sm">
          <div className="text-center py-4">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary/30" />
            <p className="text-sm text-muted-foreground">
              No friends yet
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-xs bg-primary/5 hover:bg-primary/10"
              asChild
            >
              <Link href="/friends">Find Friends</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card/30 backdrop-blur-sm rounded-md border border-border/60">
          <Tabs defaultValue="online" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-0.5 h-9 bg-transparent rounded-t-md rounded-b-none">
              <TabsTrigger 
                value="online" 
                className="text-xs rounded-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Online
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="text-xs rounded-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                All Friends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="online" className="m-0 border-t border-border/60 pt-2">
              {onlineFriends.length === 0 ? (
                <div className="text-center py-6">
                  <Circle className="h-5 w-5 mx-auto mb-1 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/70">
                    No friends online right now
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[250px] px-2">
                  <div className="space-y-0.5 pt-1.5 pb-3">
                    {onlineFriends.map((friend: Friend) => (
                      <FriendListItem 
                        key={friend.id}
                        friend={friend}
                        isOnline={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="m-0 border-t border-border/60 pt-2">
              <ScrollArea className="h-[250px] px-2">
                {onlineFriends.length > 0 && (
                  <div className="mb-4 mt-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider font-medium text-primary/70 mb-2 px-1">
                      Online • {onlineFriends.length}
                    </h4>
                    <div className="space-y-0.5">
                      {onlineFriends.map((friend: Friend) => (
                        <FriendListItem 
                          key={friend.id}
                          friend={friend}
                          isOnline={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {offlineFriends.length > 0 && (
                  <div className="mb-2 mt-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2 px-1">
                      Offline • {offlineFriends.length}
                    </h4>
                    <div className="space-y-0.5">
                      {offlineFriends.map((friend: Friend) => (
                        <FriendListItem 
                          key={friend.id}
                          friend={friend}
                          isOnline={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <div className="p-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-8 bg-muted/30 hover:bg-muted/60"
                asChild
              >
                <Link href="/friends">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Manage Friends
                </Link>
              </Button>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}

interface FriendListItemProps {
  friend: Friend;
  isOnline: boolean;
}

function FriendListItem({ friend, isOnline }: FriendListItemProps) {
  return (
    <div 
      className={cn(
        "group relative rounded-sm py-1.5 px-2 transition-colors",
        isOnline 
          ? "hover:bg-primary/5" 
          : "hover:bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-shrink-0">
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background z-10" />
            )}
            <Avatar className="h-7 w-7">
              <AvatarImage src={friend.avatar || undefined} />
              <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <PlayerLink 
              userId={friend.id} 
              username={friend.username} 
              className={cn(
                "text-xs",
                !isOnline && "text-muted-foreground"
              )}
            />
            {friend.status?.lastLocation && !isOnline && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Last seen: {friend.status.lastLocation}
              </p>
            )}
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-sm"
            asChild
          >
            <Link href={`/messages?userId=${friend.id}`}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}