import React from "react";
import { UsersRound, UserRoundPlus } from "lucide-react";
import { FriendsList } from "@/components/social/FriendsList";
import { AddFriend } from "@/components/social/AddFriend";
import { StatusIndicator } from "@/components/social/StatusIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function FriendsPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">
            Manage your friends and expand your criminal network
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIndicator />
          <AddFriend />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>My Network</CardTitle>
          <CardDescription>
            Manage your connections in the criminal underworld
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends">
            <TabsList className="mb-4">
              <TabsTrigger value="friends" className="flex items-center">
                <UsersRound className="h-4 w-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="online" className="flex items-center">
                <UserRoundPlus className="h-4 w-4 mr-2" />
                Online Users
              </TabsTrigger>
            </TabsList>
            <TabsContent value="friends">
              <FriendsList />
            </TabsContent>
            <TabsContent value="online">
              <div className="text-center p-8 text-muted-foreground">
                <p>Online users feature coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}