import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notification, useNotification } from "@/hooks/use-notification";
import { format } from "date-fns";
import { Check, Ban, AlertCircle, DollarSign, UserPlus, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FriendRequestNotification, FriendStatusNotification } from "@/components/social/FriendNotification";
import { Badge } from "@/components/ui/badge";

export const NotificationList: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotification();

  const getIcon = (type: string) => {
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
      case "friend_status":
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderNotification = (notification: Notification) => {
    // Special rendering for friend requests
    if (notification.type === "friend_request" && notification.data) {
      return (
        <FriendRequestNotification 
          key={notification.id}
          requestId={notification.data.requestId}
          userId={notification.data.userId}
          username={notification.data.username}
          avatar={notification.data.avatar}
          onDismiss={() => markAsRead(notification.id)}
        />
      );
    }
    
    // Special rendering for friend status updates
    if (notification.type === "friend_status" && notification.data) {
      return (
        <FriendStatusNotification
          key={notification.id}
          userId={notification.data.userId}
          username={notification.data.username}
          avatar={notification.data.avatar}
          status={notification.data.status}
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