import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/hooks/use-notification";
import { Notification, NotificationType } from "@/types";
import { format } from "date-fns";
import { Check, Ban, AlertCircle, DollarSign, UserPlus, Users, UserMinus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FriendNotification } from "@/components/social/FriendNotification";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const NotificationList: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotification();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <Ban className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case "friend_accepted":
        return <Check className="h-4 w-4 text-indigo-500" />;
      case "friend_status":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "friend_removed":
        return <UserMinus className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderNotification = (notification: Notification) => {
    // Special rendering for friend requests, status updates, and friend accepted/removed
    if ((notification.type === "friend_request" || 
         notification.type === "friend_status" ||
         notification.type === "friend_accepted" ||
         notification.type === "friend_removed") && 
        notification.data) {
      
      if (notification.type === "friend_request") {
        // Handle friend request with functional accept/reject buttons
        const { useMutation, useQueryClient } = require("@tanstack/react-query");
        const { apiRequest } = require("@/lib/queryClient");
        const { useToast } = require("@/hooks/use-toast");
        const { Loader2 } = require("lucide-react");
        
        // Create a FriendRequestNotification component inline
        const FriendRequestNotification = () => {
          const toast = useToast();
          const queryClient = useQueryClient();
          
          // Accept friend request mutation
          const acceptRequestMutation = useMutation({
            mutationFn: async () => {
              return apiRequest("PUT", `/api/social/friends/request/${notification.data.requestId}`, { status: "accepted" });
            },
            onSuccess: () => {
              toast().toast({
                title: "Friend request accepted",
                description: `You are now friends with ${notification.data.username}`
              });
              queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
              queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
              markAsRead(notification.id);
            },
            onError: (error) => {
              toast().toast({
                title: "Error",
                description: error.message || "Failed to accept friend request",
                variant: "destructive"
              });
            }
          });
          
          // Reject friend request mutation
          const rejectRequestMutation = useMutation({
            mutationFn: async () => {
              return apiRequest("PUT", `/api/social/friends/request/${notification.data.requestId}`, { status: "rejected" });
            },
            onSuccess: () => {
              toast().toast({
                title: "Friend request rejected",
                description: "The request has been removed"
              });
              queryClient.invalidateQueries({ queryKey: ["/api/social/friends/requests"] });
              markAsRead(notification.id);
            },
            onError: (error) => {
              toast().toast({
                title: "Error",
                description: error.message || "Failed to reject friend request",
                variant: "destructive"
              });
            }
          });

          return (
            <Card key={notification.id} className="mb-2">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <UserPlus className="h-4 w-4 text-indigo-500" />
                    <h4 className="ml-2 text-sm font-medium">Friend Request</h4>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(notification.timestamp, 'HH:mm')}
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.data.avatar || undefined} />
                    <AvatarFallback>{notification.data.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">{notification.data.username} wants to be your friend</p>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                    onClick={() => acceptRequestMutation.mutate()}
                    disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                  >
                    {acceptRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                    onClick={() => rejectRequestMutation.mutate()}
                    disabled={acceptRequestMutation.isPending || rejectRequestMutation.isPending}
                  >
                    {rejectRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        };
        
        return <FriendRequestNotification />;
      }
      
      // For all other friend notifications
      if (!notification.data) {
        console.error("Missing notification data:", notification);
        return null;
      }
      
      // Log invalid data but still attempt to render with fallbacks
      if (!notification.data.userId || !notification.data.username) {
        console.log("Invalid notification data:", notification);
        // Continue with rendering using fallbacks
      }
      
      return (
        <FriendNotification
          key={notification.id}
          type={notification.type as "friend_accepted" | "friend_removed" | "friend_status"}
          userId={notification.data.userId}
          username={notification.data.username}
          avatar={notification.data.avatar}
          status={notification.data.status}
          timestamp={notification.timestamp}
          onDismiss={() => markAsRead(notification.id)}
        />
      );
    }

    // Default notification rendering
    return (
      <Card key={notification.id} className={`mb-2 ${notification.read ? 'opacity-70' : ''}`}>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <div className="flex items-center">
              {getIcon(notification.type)}
              <h4 className="ml-2 text-sm font-medium">{notification.title}</h4>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(notification.timestamp, 'HH:mm')}
            </div>
          </div>
          <Separator className="my-2" />
          <p className="text-sm mb-2">{notification.message}</p>
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => markAsRead(notification.id)}
            >
              Mark as read
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-xl font-bold">Notifications</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={clearNotifications}>
            Clear all
          </Button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No notifications to display</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between mb-2">
            <Badge variant="outline" className="bg-primary text-primary-foreground">
              {notifications.filter(n => !n.read).length} Unread
            </Badge>
            <Badge variant="outline">{notifications.length} Total</Badge>
          </div>
          <ScrollArea className="h-[400px] px-1">
            <div className="pr-4">
              {notifications.map(renderNotification)}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};