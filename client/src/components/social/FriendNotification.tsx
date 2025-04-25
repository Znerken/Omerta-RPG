import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface FriendNotificationProps {
  type: "friend_accepted" | "friend_removed" | "friend_status";
  userId: number;
  username: string;
  avatar?: string;
  timestamp: Date;
  status?: string;
  onDismiss: () => void;
}

export const FriendNotification: React.FC<FriendNotificationProps> = ({
  type,
  username,
  avatar,
  status,
  timestamp,
  onDismiss
}) => {
  const getTitle = () => {
    switch (type) {
      case "friend_accepted":
        return "Friend Request Accepted";
      case "friend_removed":
        return "Friend Removed";
      case "friend_status":
        return "Friend Status Updated";
      default:
        return "Friend Notification";
    }
  };

  const getMessage = () => {
    if (!username) return "Unknown user";
    
    switch (type) {
      case "friend_accepted":
        return `${username} has accepted your friend request.`;
      case "friend_removed":
        return `${username} has removed you from their friends list.`;
      case "friend_status":
        return `${username || 'A user'} is now ${status || 'offline'}.`;
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "friend_accepted":
        return <Check className="h-4 w-4 text-green-500" />;
      case "friend_removed":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex items-center">
            {getIcon()}
            <h4 className="ml-2 text-sm font-medium">{getTitle()}</h4>
          </div>
          <div className="text-xs text-muted-foreground">
            {timestamp ? format(timestamp, 'HH:mm') : 'now'}
          </div>
        </div>
        <Separator className="my-2" />
        
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{username && username.charAt(0).toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <p className="text-sm">{getMessage()}</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </CardContent>
    </Card>
  );
};