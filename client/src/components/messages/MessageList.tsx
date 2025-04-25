import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  senderUsername?: string;
  receiverId?: number;
  receiverUsername?: string;
  content: string;
  timestamp: string;
  type: string;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  emptyMessage?: string;
  type?: 'personal' | 'gang' | 'global' | 'jail';
}

export function MessageList({ messages, loading = false, emptyMessage = "No messages", type = 'personal' }: MessageListProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-gray-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  // Sort messages by timestamp (newest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex-1 flex flex-col-reverse overflow-y-auto p-2 space-y-reverse space-y-3">
      {sortedMessages.map((message) => {
        const isCurrentUser = message.senderId === user?.id;
        const senderName = message.senderUsername || (isCurrentUser ? user?.username : "Unknown User");
        
        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
          >
            <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[85%]`}>
              <Avatar className={`h-8 w-8 ${isCurrentUser ? 'ml-2' : 'mr-2'} flex-shrink-0 bg-primary`}>
                <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 rounded-lg ${
                  isCurrentUser 
                    ? 'bg-primary text-white' 
                    : 'bg-dark text-gray-200'
                }`}>
                  {type !== 'personal' && (
                    <div className="text-xs font-medium mb-1">
                      {senderName}
                    </div>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(new Date(message.timestamp))}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
