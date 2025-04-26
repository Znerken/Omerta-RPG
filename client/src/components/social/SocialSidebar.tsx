import { useQuery } from "@tanstack/react-query";
import { Loader2, Circle, UserPlus, MessageSquare, CircleUser } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <h3 className="text-sm font-medium flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Contacts Directory
          </span>
        </h3>
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
        <div className="text-center py-6">
          <CircleUser className="h-12 w-12 mx-auto mb-3 text-primary/20" />
          <p className="text-sm text-muted-foreground">
            No contacts in your network
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full text-xs bg-primary/5 hover:bg-primary/10"
            asChild
          >
            <Link href="/friends">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Find Associates
            </Link>
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="online" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 bg-muted/10 rounded-md mb-2">
            <TabsTrigger 
              value="online" 
              className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Online
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              All Contacts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="online" className="mt-0">
            {onlineFriends.length === 0 ? (
              <div className="text-center py-8">
                <Circle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/70">
                  No associates online right now
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-1 pt-2 pb-4">
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
          
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[280px]">
              {onlineFriends.length > 0 && (
                <div className="mb-4 mt-1">
                  <h4 className="text-[11px] uppercase tracking-wider font-medium text-primary/70 mb-2 px-1">
                    Active • {onlineFriends.length}
                  </h4>
                  <div className="space-y-1">
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
                <div className="mb-2 mt-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2 px-1">
                    Offline • {offlineFriends.length}
                  </h4>
                  <div className="space-y-1">
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

          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-9 bg-muted/10 hover:bg-muted/20 border border-border/30"
              asChild
            >
              <Link href="/friends">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Manage Network
              </Link>
            </Button>
          </div>
        </Tabs>
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
        "group relative rounded-md py-2.5 px-3 transition-colors",
        isOnline 
          ? "hover:bg-primary/5" 
          : "hover:bg-muted/10"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-1 ring-background z-10" />
            )}
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatar || undefined} />
              <AvatarFallback className="text-sm">{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <PlayerLink 
              userId={friend.id} 
              username={friend.username} 
              className={cn(
                "text-sm font-medium",
                !isOnline && "text-muted-foreground"
              )}
            />
            {friend.status?.lastLocation && !isOnline ? (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Last seen: {friend.status.lastLocation}
              </p>
            ) : (
              <p className="text-[11px] text-emerald-500/90 mt-0.5">
                Online now
              </p>
            )}
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            asChild
          >
            <Link href={`/messages?userId=${friend.id}`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}