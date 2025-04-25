import { FriendsList } from "@/components/social/FriendsList";
import { AddFriend } from "@/components/social/AddFriend";
import { NotificationList } from "@/components/notification/NotificationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Bell, BadgePlus } from "lucide-react";
import { useNotification } from "@/hooks/use-notification";

export default function FriendsPage() {
  const { unreadCount } = useNotification();
  
  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Friends & Connections"
        description="Manage your social network in the criminal underworld"
        icon={<Users className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Friends list */}
        <div className="md:col-span-2">
          <Tabs defaultValue="friends" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Friends</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <BadgePlus className="h-4 w-4" />
                <span>Find Friends</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="friends" className="mt-4">
              <FriendsList />
            </TabsContent>
            <TabsContent value="add" className="mt-4">
              <AddFriend />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - Notifications */}
        <div>
          <Card className="h-full overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                {unreadCount > 0 && (
                  <div className="bg-primary text-primary-foreground text-xs font-medium rounded-full px-2 py-0.5">
                    {unreadCount}
                  </div>
                )}
              </div>
              <ScrollArea className="h-[70vh]">
                <div className="p-4">
                  <NotificationList />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}