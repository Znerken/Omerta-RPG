import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageList } from "@/components/messages/MessageList";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  MessageSquare, 
  Users, 
  Globe, 
  Vault, 
  Plus, 
  Send, 
  Loader2, 
  Search 
} from "lucide-react";

const newMessageSchema = z.object({
  receiverUsername: z.string().min(1, "Receiver username is required"),
  content: z.string().min(1, "Message content is required").max(500, "Message too long (max 500 characters)"),
});

type NewMessageValues = z.infer<typeof newMessageSchema>;

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<NewMessageValues>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: {
      receiverUsername: "",
      content: "",
    },
  });

  const { data: personalMessages, isLoading: personalLoading } = useQuery({
    queryKey: ["/api/messages?type=personal"],
  });

  const { data: gangMessages, isLoading: gangLoading } = useQuery({
    queryKey: ["/api/messages?type=gang"],
  });

  const { data: globalMessages, isLoading: globalLoading } = useQuery({
    queryKey: ["/api/messages?type=global"],
  });

  const { data: jailMessages, isLoading: jailLoading } = useQuery({
    queryKey: ["/api/messages?type=jail"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { type: string; content: string; receiverId?: number }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setIsComposeOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitNewMessage = (data: NewMessageValues) => {
    // In a real app, we would have an API endpoint to get user ID from username
    // For now, simulate this with a fake ID (this should be replaced with actual logic)
    const fakeReceiverId = Math.floor(Math.random() * 100) + 1;
    
    sendMessageMutation.mutate({
      type: "personal",
      content: data.content,
      receiverId: fakeReceiverId
    });
  };

  const handleSendGangMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        type: "gang",
        content
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSendGlobalMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        type: "global",
        content
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSendJailMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        type: "jail",
        content
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Filter personal messages based on search term
  const filteredPersonalMessages = personalMessages 
    ? personalMessages.filter((msg: any) => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.senderUsername && msg.senderUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (msg.receiverUsername && msg.receiverUsername.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <MainLayout title="Messages">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Messages
                </CardTitle>

                <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/80">
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-dark-surface border-gray-700">
                    <DialogHeader>
                      <DialogTitle>Compose New Message</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitNewMessage)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="receiverUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter username" 
                                  className="bg-dark-lighter border-gray-700" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Type your message here..." 
                                  className="bg-dark-lighter border-gray-700 min-h-32" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter className="pt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsComposeOpen(false)}
                            className="bg-dark-lighter"
                            type="button"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/80"
                            disabled={sendMessageMutation.isPending}
                          >
                            {sendMessageMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" /> 
                                Send Message
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Send and receive messages with other players
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4 bg-dark-lighter">
                  <TabsTrigger 
                    value="personal" 
                    className="flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Personal
                  </TabsTrigger>
                  <TabsTrigger 
                    value="gang" 
                    className="flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gang Chat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="global" 
                    className="flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Global
                  </TabsTrigger>
                  <TabsTrigger 
                    value="jail" 
                    className="flex items-center"
                  >
                    <Vault className="h-4 w-4 mr-2" />
                    Jail Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search messages..."
                        className="pl-8 bg-dark-lighter border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-dark-lighter rounded-lg p-2 h-96 flex flex-col">
                    <MessageList 
                      messages={filteredPersonalMessages} 
                      loading={personalLoading}
                      emptyMessage="No personal messages yet. Use the 'New Message' button to start a conversation."
                      type="personal"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="gang">
                  <div className="bg-dark-lighter rounded-lg p-2 h-80 mb-4 flex flex-col">
                    <MessageList 
                      messages={gangMessages || []} 
                      loading={gangLoading} 
                      emptyMessage={
                        user?.gangId 
                          ? "No gang messages yet. Start the conversation!" 
                          : "You need to join a gang to use gang chat."
                      }
                      type="gang"
                    />
                  </div>

                  <MessageComposer 
                    onSendMessage={handleSendGangMessage} 
                    placeholder="Type your gang message..." 
                    disabled={!user?.gangId}
                    disabledMessage="Join a gang to send messages"
                  />
                </TabsContent>

                <TabsContent value="global">
                  <div className="bg-dark-lighter rounded-lg p-2 h-80 mb-4 flex flex-col">
                    <MessageList 
                      messages={globalMessages || []} 
                      loading={globalLoading} 
                      emptyMessage="No global messages yet. Be the first to say something!"
                      type="global"
                    />
                  </div>

                  <MessageComposer 
                    onSendMessage={handleSendGlobalMessage} 
                    placeholder="Type your message to everyone..." 
                  />
                </TabsContent>

                <TabsContent value="jail">
                  <div className="bg-dark-lighter rounded-lg p-2 h-80 mb-4 flex flex-col">
                    <MessageList 
                      messages={jailMessages || []} 
                      loading={jailLoading} 
                      emptyMessage="No jail messages yet. Only inmates can chat here."
                      type="jail"
                    />
                  </div>

                  <MessageComposer 
                    onSendMessage={handleSendJailMessage} 
                    placeholder="Type your jail message..." 
                    disabled={!user?.isJailed}
                    disabledMessage="Only inmates can use jail chat"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recent Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {personalMessages && personalMessages.length > 0 ? (
                  // Get unique contacts from messages (both senders and receivers)
                  Array.from(new Set(
                    personalMessages
                      .filter((msg: any) => 
                        msg.senderId !== user?.id || msg.receiverId !== user?.id
                      )
                      .map((msg: any) => 
                        msg.senderId === user?.id ? msg.receiverId : msg.senderId
                      )
                  )).map((contactId: number, index: number) => {
                    const contactMsg = personalMessages.find((msg: any) => 
                      msg.senderId === contactId || msg.receiverId === contactId
                    );
                    const contactName = contactMsg.senderId === user?.id 
                      ? contactMsg.receiverUsername 
                      : contactMsg.senderUsername;
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-dark-lighter p-3 rounded-lg">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3 bg-primary">
                            <AvatarFallback>{getInitials(contactName || "User")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contactName || "Unknown User"}</div>
                            <div className="text-xs text-gray-400">
                              {formatRelativeTime(new Date(contactMsg.timestamp))}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            form.setValue('receiverUsername', contactName || "");
                            setIsComposeOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No recent contacts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="font-medium">Personal Messages</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Private messages between you and another player. Use these for sensitive communications or to make deals.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 mr-2 text-green-500" />
                  <h3 className="font-medium">Gang Chat</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Communication channel for your gang members only. Plan activities and coordinate with your crew.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Globe className="h-5 w-5 mr-2 text-purple-500" />
                  <h3 className="font-medium">Global Chat</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Public chat visible to all players. Great for announcements, recruitment, and community interaction.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Vault className="h-5 w-5 mr-2 text-red-500" />
                  <h3 className="font-medium">Jail Chat</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Only accessible when you're in jail. Connect with other inmates and pass the time while serving your sentence.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
