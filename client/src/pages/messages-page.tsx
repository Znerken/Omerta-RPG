import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketContext } from '@/hooks/use-websocket-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  MailOpen,
  Send,
  Trash,
  Users,
  AlertCircle,
  User,
  Building,
  Bell,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: number;
  senderId: number;
  receiverId: number | null;
  gangId: number | null;
  type: 'personal' | 'gang' | 'jail' | 'global';
  content: string;
  read: boolean;
  timestamp: string;
  senderName?: string;
};

type NewMessageForm = {
  receiverId: number;
  type: 'personal' | 'gang' | 'jail' | 'global';
  content: string;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, socket } = useWebSocketContext(); // Use the global WebSocket context
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [newMessage, setNewMessage] = useState<NewMessageForm>({
    receiverId: 0,
    type: 'personal',
    content: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Query for fetching messages based on type
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/messages', activeTab],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/messages?type=${activeTab}`);
      return res.json();
    }
  });

  // Query for unread messages count
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['/api/messages/unread'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/messages/unread');
      return res.json();
    },
    onSuccess: (data) => {
      setUnreadCount(data.length);
    }
  });

  // Mutation for sending a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: NewMessageForm) => {
      const res = await apiRequest('POST', '/api/messages', messageData);
      return res.json();
    },
    onSuccess: () => {
      // Clear the input and refetch messages
      setNewMessage({
        receiverId: 0,
        type: activeTab as 'personal' | 'gang' | 'jail' | 'global',
        content: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeTab] });
      toast({
        title: 'Message sent',
        description: 'Your message was sent successfully.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });

  // Mutation for marking a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark message as read',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });

  // Mutation for marking all messages as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/messages/read/all');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });
      toast({
        title: 'All messages marked as read',
        description: 'All your messages have been marked as read.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark messages as read',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });

  // Use the shared WebSocketContext for real-time updates
  useEffect(() => {
    if (!user || !isConnected) return;

    // Setup message handler for WebSocket messages
    const handleWebSocketMessage = (event: Event) => {
      try {
        const data = (event as CustomEvent).detail;
        console.log('WebSocket message received in messages-page:', data);

        if (data.type === 'newMessage' || data.type === 'newGangMessage') {
          // Display notification for new message
          toast({
            title: 'New Message',
            description: `From ${data.senderName || data.data?.senderName}: ${data.content || data.data?.content}`,
            variant: 'default'
          });

          // Refetch messages if we're on the relevant tab
          if (
            (data.type === 'newMessage' && activeTab === 'personal') ||
            (data.type === 'newGangMessage' && activeTab === 'gang')
          ) {
            // Use a slight delay to prevent excessive refreshes
            setTimeout(() => {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/messages', activeTab],
                refetchType: "none" // Prevent automatic refetch
              });
              refetch();
            }, 300);
          }
        } else if (data.type === 'unreadMessages') {
          setUnreadCount(data.data?.count);
        } else if (data.type === 'globalMessage') {
          toast({
            title: 'Global Announcement',
            description: `${data.senderName || data.data?.senderName}: ${data.content || data.data?.content}`,
            variant: 'default'
          });

          if (activeTab === 'global') {
            // Use a slight delay to prevent excessive refreshes
            setTimeout(() => {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/messages', activeTab],
                refetchType: "none" // Prevent automatic refetch 
              });
              refetch();
            }, 300);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    // Add event listener for custom websocket events
    document.addEventListener('websocket-message', handleWebSocketMessage);

    return () => {
      // Remove event listener when component unmounts
      document.removeEventListener('websocket-message', handleWebSocketMessage);
    };
  }, [user, isConnected, activeTab, refetch, toast, queryClient]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setNewMessage(prev => ({
      ...prev,
      type: value as 'personal' | 'gang' | 'jail' | 'global'
    }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim()) {
      toast({
        title: 'Cannot send empty message',
        description: 'Please enter a message.',
        variant: 'destructive'
      });
      return;
    }

    const messageData = {
      ...newMessage,
      type: activeTab as 'personal' | 'gang' | 'jail' | 'global'
    };

    // For personal messages, make sure we have a receiver ID
    if (activeTab === 'personal' && !newMessage.receiverId) {
      toast({
        title: 'Receiver ID required',
        description: 'Please enter a receiver ID for personal messages.',
        variant: 'destructive'
      });
      return;
    }

    sendMessageMutation.mutate(messageData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: name === 'receiverId' ? parseInt(value) || 0 : value
    }));
  };

  const renderMessageIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <User className="h-4 w-4 mr-2" />;
      case 'gang':
        return <Users className="h-4 w-4 mr-2" />;
      case 'jail':
        return <Building className="h-4 w-4 mr-2" />;
      case 'global':
        return <Bell className="h-4 w-4 mr-2" />;
      default:
        return <MailOpen className="h-4 w-4 mr-2" />;
    }
  };

  const markMessageAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  // Render the UI
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-white">
          Messages
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500">{unreadCount} unread</Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="personal" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="gang" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Gang
          </TabsTrigger>
          <TabsTrigger value="jail" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Jail
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Global
          </TabsTrigger>
        </TabsList>

        {/* Shared content for all tabs */}
        <div className="mb-8">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            {activeTab === 'personal' && (
              <Input
                type="number"
                name="receiverId"
                placeholder="Receiver ID"
                value={newMessage.receiverId || ''}
                onChange={handleInputChange}
                className="w-24 flex-shrink-0"
              />
            )}
            <Input
              type="text"
              name="content"
              placeholder={`Type your ${activeTab} message...`}
              value={newMessage.content}
              onChange={handleInputChange}
              className="flex-grow"
            />
            <Button 
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>

        {/* Messages list - same layout for all tabs */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-400">Loading messages...</p>
          ) : error ? (
            <div className="text-center text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Failed to load messages</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400">No messages found</p>
          ) : (
            messages.map((message: Message) => (
              <Card 
                key={message.id} 
                className={`p-4 transition-colors ${
                  !message.read && message.receiverId === user?.id 
                    ? 'bg-accent/40' 
                    : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {renderMessageIcon(message.type)}
                    <span className="font-medium">
                      {message.senderId === user?.id ? 'You' : `User #${message.senderId}`}
                    </span>
                    {!message.read && message.receiverId === user?.id && (
                      <Badge variant="secondary" className="ml-2">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {message.timestamp && (
                      <span>{formatDistanceToNow(new Date(message.timestamp))} ago</span>
                    )}
                    {!message.read && message.receiverId === user?.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2" 
                        onClick={() => markMessageAsRead(message.id)}
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Separator className="my-2" />
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}