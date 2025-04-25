import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Loader2, Users, Star, Award, ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { StatusIndicator } from "@/components/social/StatusIndicator";

export default function PublicProfilePage() {
  const { id } = useParams();
  const userId = parseInt(id);

  // Fetch public profile data
  const { 
    data: profile, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/users', userId, 'profile'],
    queryFn: () => fetch(`/api/users/${userId}/profile`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    }),
    enabled: !!userId && !isNaN(userId),
  });

  // Fetch user achievements if visible
  const { 
    data: achievements
  } = useQuery({
    queryKey: ['/api/users', userId, 'achievements'],
    queryFn: () => fetch(`/api/users/${userId}/achievements`).then(res => {
      if (!res.ok) {
        if (res.status === 403) {
          return { hidden: true };
        }
        throw new Error('Failed to fetch achievements');
      }
      return res.json();
    }),
    enabled: !!profile && profile.showAchievements !== false,
  });

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If error, show error message
  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">This profile does not exist or is not available.</p>
        </Card>
      </div>
    );
  }

  // Calculate member since date in readable format
  const memberSince = profile.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : 'Unknown';

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Profile Header with Banner */}
      <div className="relative mb-6">
        {profile.bannerImage ? (
          <div className="w-full h-48 overflow-hidden rounded-t-lg">
            <img 
              src={profile.bannerImage} 
              alt={`${profile.username}'s banner`} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-lg" />
        )}
        
        <div className="absolute -bottom-16 left-6">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatar || undefined} />
            <AvatarFallback className="text-4xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info */}
      <Card className="mt-16 mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <StatusIndicator status={profile.status || 'offline'} />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" /> 
                  Level {profile.level || 1}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> 
                  Member since {memberSince}
                </Badge>
                {profile.gang && (
                  <Badge className="bg-purple-500 text-white flex items-center gap-1">
                    <Users className="h-3 w-3" /> 
                    {profile.gang.name} [{profile.gang.tag}]
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Bio</h2>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="custom">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Custom Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Custom HTML Profile */}
        <TabsContent value="custom">
          <Card>
            <CardContent className="pt-6">
              {profile.htmlProfile ? (
                <div 
                  className="custom-profile"
                  dangerouslySetInnerHTML={{ __html: profile.htmlProfile }}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Award className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>{profile.username} hasn't created a custom profile yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements?.hidden ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Award className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>{profile.username} has chosen to hide their achievements.</p>
                </div>
              ) : !achievements || achievements.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Award className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>No achievements unlocked yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements
                    .filter(ach => ach.unlocked)
                    .map(achievement => (
                      <div key={achievement.id} className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              Unlocked on {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}