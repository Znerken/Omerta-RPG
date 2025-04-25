import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { MessageList } from "@/components/messages/MessageList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JailTimer } from "@/components/jail/JailTimer";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useTimer } from "@/hooks/use-timer";
import { useState, useEffect } from "react";
import { Loader2, Vault, MessageSquare, AlertTriangle, ShieldAlert, Users, Clock, Info } from "lucide-react";

export default function JailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [escapeCooldown, setEscapeCooldown] = useState<Date | null>(null);

  const { data: jailStatus, isLoading } = useQuery({
    queryKey: ["/api/jail/status"],
  });

  const { data: jailMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages?type=jail"],
  });

  const { data: jailedUsers } = useQuery({
    queryKey: ["/api/jail/users"],
    enabled: !jailStatus?.isJailed
  });

  const escapeJailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/jail/escape");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Freedom!",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/jail/status"] });
      } else {
        toast({
          title: "Escape Failed",
          description: data.message,
          variant: "destructive",
        });
        // Set cooldown for 30 minutes after failed attempt
        const cooldownEnd = new Date();
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + 30);
        setEscapeCooldown(cooldownEnd);
        
        if (data.jailTimeEnd) {
          queryClient.invalidateQueries({ queryKey: ["/api/jail/status"] });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create a timer for escape cooldown
  const escapeCooldownTimer = useTimer({
    expiryTimestamp: escapeCooldown || new Date(),
    onExpire: () => setEscapeCooldown(null),
    autoStart: !!escapeCooldown,
  });

  const handleEscapeAttempt = () => {
    escapeJailMutation.mutate();
  };

  const handleSendMessage = async (content: string) => {
    try {
      await apiRequest("POST", "/api/messages", {
        type: "jail",
        content,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages?type=jail"] });
      return true;
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader 
          title="Jail" 
          icon={<Vault className="h-5 w-5" />}
          description="You've been caught breaking the law"
        />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Jail" 
        icon={<Vault className="h-5 w-5" />}
        description={jailStatus?.isJailed ? "You've been caught breaking the law" : "Stay on the right side of the law"}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {jailStatus?.isJailed ? (
            <Card className="bg-dark-surface relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Vault className="text-[120px] text-red-500" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Vault className="h-5 w-5 mr-2 text-red-500" />
                  You're In Jail
                </CardTitle>
                <CardDescription>
                  You've been caught breaking the law and sentenced to prison time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-dark-lighter p-4 rounded-lg mb-4">
                  <div className="flex flex-col items-center mb-4">
                    <Badge variant="destructive" className="mb-2">IMPRISONED</Badge>
                    <h3 className="text-xl font-medium mb-1">Time Remaining</h3>
                    <JailTimer 
                      releaseTime={new Date(jailStatus.jailTimeEnd)} 
                      onRelease={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/jail/status"] });
                        toast({
                          title: "Released from Jail",
                          description: "You've served your time and are now free!",
                        });
                      }} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-3 bg-dark rounded-lg">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <div className="text-sm font-medium">Sentence</div>
                      <div className="text-lg text-gray-300">
                        {Math.floor((new Date(jailStatus.jailTimeEnd).getTime() - new Date().getTime()) / 60000)} minutes
                      </div>
                    </div>
                    <div className="text-center p-3 bg-dark rounded-lg">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                      <div className="text-sm font-medium">Escape Chance</div>
                      <div className="text-lg text-gray-300">
                        50%
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleEscapeAttempt}
                  variant="destructive" 
                  className="w-full" 
                  disabled={
                    escapeJailMutation.isPending || 
                    !!escapeCooldown || 
                    !jailStatus.isJailed
                  }
                >
                  {escapeJailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Attempting Escape...
                    </>
                  ) : escapeCooldown ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" /> 
                      Escape Cooldown ({escapeCooldownTimer.formattedTime})
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" /> 
                      Attempt Escape (50% Chance)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-dark-surface">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Vault className="h-5 w-5 mr-2" />
                  Jail Status
                </CardTitle>
                <CardDescription>
                  You're currently free, but failing in crimes might land you in jail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-dark-lighter border-green-600">
                  <Info className="h-4 w-4 text-green-500" />
                  <AlertTitle>You're not in jail</AlertTitle>
                  <AlertDescription>
                    Keep your nose clean or improve your skills to avoid getting caught next time.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Currently Incarcerated</h3>
                  {jailedUsers && jailedUsers.length > 0 ? (
                    <div className="bg-dark-lighter rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                      {jailedUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2 bg-primary">
                              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                          </div>
                          <Badge variant="destructive">
                            {Math.floor((new Date(user.jailTimeEnd).getTime() - new Date().getTime()) / 60000)}m left
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-dark-lighter rounded-lg p-4 text-center text-gray-400">
                      No prisoners currently in jail
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Jail Chat
              </CardTitle>
              <CardDescription>
                Communicate with other inmates while serving time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-dark-lighter rounded-lg p-2 h-80 mb-4 flex flex-col">
                <MessageList 
                  messages={jailMessages || []} 
                  loading={messagesLoading} 
                  emptyMessage="No messages in jail chat yet. Start the conversation!"
                />
              </div>
              
              <MessageComposer 
                onSendMessage={handleSendMessage} 
                placeholder="Type your jail message..." 
                disabled={!jailStatus?.isJailed}
                disabledMessage="You need to be in jail to use this chat"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Jail Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Jail System</h3>
                <p className="text-sm text-gray-400">
                  When you're caught committing crimes, you get sent to jail for a period of time based on the severity of the crime.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">While In Jail</h3>
                <p className="text-sm text-gray-400">
                  While in jail, you cannot commit crimes or engage in most activities. You can only chat with other inmates and attempt to escape.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Escape Attempts</h3>
                <p className="text-sm text-gray-400">
                  You can attempt to escape jail with a 50% success chance. Failed attempts extend your sentence and have a 30-minute cooldown.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <h3 className="font-medium mb-1">Jail Reduction Items</h3>
                <p className="text-sm text-gray-400">
                  Special items from the store can reduce your jail time or improve escape chances.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Jail Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Build connections with other inmates to gain benefits when you're released. Gang recruitment often happens in jail.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-dark-lighter rounded-lg">
                  <div className="text-sm">Chance to join a gang</div>
                  <div className="font-medium">+15%</div>
                </div>
                <div className="flex justify-between items-center p-2 bg-dark-lighter rounded-lg">
                  <div className="text-sm">Chance to find an item</div>
                  <div className="font-medium">+10%</div>
                </div>
                <div className="flex justify-between items-center p-2 bg-dark-lighter rounded-lg">
                  <div className="text-sm">New criminal contacts</div>
                  <div className="font-medium">+5%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
