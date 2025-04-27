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
  BellOff,
  Check,
  DollarSign,
  MailQuestion,
  MessageSquare,
  Trash,
  UserPlus,
  Users,
  BadgeInfo,
  Banknote,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
      return <Banknote className="h-4 w-4 text-emerald-500" />;
    case "friend_request":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "friend_accepted":
      return <Users className="h-4 w-4 text-indigo-500" />;
    case "friend_status":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "friend_removed":
      return <Users className="h-4 w-4 text-red-500" />;
    case "message":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "info":
      return <BadgeInfo className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-blue-500" />;
  }
};

// Memoized notification item to prevent unnecessary re-renders
const NotificationItem = memo(({ 
  notification, 
  onClick 
}: { 
  notification: Notification, 
  onClick: (id: string) => void 
}) => {
  const handleClick = useCallback(() => {
    onClick(notification.id);
  }, [notification.id, onClick]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(notification.id);
    }
  }, [notification.id, onClick]);
  
  // Determine if this notification has grouped items
  const hasCount = notification.data?.count && notification.data.count > 1;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.2 }}
      key={notification.id}
      className={`cursor-pointer text-left p-4 border-b hover:bg-accent/30 transition-colors ${
        !notification.read ? "bg-accent/20" : ""
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="font-medium text-sm">
              {notification.title}
              {hasCount && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notification.data.count}
                </Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
              {formatNotificationTime(notification.timestamp)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            {notification.message}
          </p>
          {notification.data?.transactionId && (
            <p className="text-xs text-muted-foreground mt-1">
              Transaction ID: {notification.data.transactionId}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export function NotificationList() {
  const {
    notifications,
    unreadCount,
    notificationsEnabled,
    toggleNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotification();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = useCallback((id: string) => {
    markAsRead(id);
    // Additional actions for clicking on a notification could go here
  }, [markAsRead]);
  
  // Use memo to prevent unnecessary re-renders
  const memoizedNotifications = useMemo(() => {
    // We need to limit the number of items we render for performance
    const visibleNotifications = notifications.slice(0, 50);
    return visibleNotifications;
  }, [notifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {notificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-medium text-sm">Notifications</h4>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleNotifications}
              title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              <span className="sr-only">
                {notificationsEnabled ? "Disable notifications" : "Enable notifications"}
              </span>
            </Button>
            
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Mark all as read</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearNotifications}
                  title="Clear all notifications"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Clear all</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {memoizedNotifications.length > 0 ? (
          <ScrollArea className="h-[calc(80vh-8rem)] max-h-96">
            <AnimatePresence initial={false}>
              {memoizedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </AnimatePresence>
            {notifications.length > 50 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                Showing 50 of {notifications.length} notifications
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="p-8 flex flex-col items-center">
            <MailQuestion className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-center text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {notificationsEnabled
                ? "Notifications will appear here when you receive them"
                : "Notifications are currently disabled"}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}