import { useNotification, type Notification } from "@/hooks/use-notification";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  Bell,
  Check,
  DollarSign,
  MailQuestion,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const formatNotificationTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than a minute
  if (diff < 60000) {
    return "Just now";
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Format as date
  return date.toLocaleDateString();
};

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "success":
      return <Check className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "payment":
      return <DollarSign className="h-4 w-4 text-primary" />;
    case "info":
    default:
      return <Bell className="h-4 w-4 text-blue-500" />;
  }
};

export function NotificationList() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotification();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // Additional actions for clicking on a notification could go here
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-medium text-sm">Notifications</h4>
          <div className="flex space-x-1">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => markAllAsRead()}
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Mark all as read</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => clearNotifications()}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Clear all</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[calc(80vh-8rem)] max-h-96">
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer text-left p-4 border-b hover:bg-accent/30 transition-colors ${
                    !notification.read ? "bg-accent/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleNotificationClick(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">
                          {notification.title}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.data?.transactionId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Transaction ID: {notification.data.transactionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 flex flex-col items-center py-8">
            <MailQuestion className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-center text-muted-foreground">
              No notifications yet
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}