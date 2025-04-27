import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Loader2, Users, Star, Award, ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

// Define types for profile data
interface UserAchievement {
  id: number;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface UserGang {
  id: number;
  name: string;
  tag: string;
}

interface UserProfile {
  id: number;
  username: string;
  level: number;
  avatar: string | null;
  bannerImage: string | null;
  bio: string | null;
  htmlProfile: string | null;
  showAchievements: boolean;
  createdAt: string;
  status?: string;
  gang?: UserGang;
}

interface PublicProfilePageProps {
  userId?: number;
}

export default function PublicProfilePage({ userId: propUserId }: PublicProfilePageProps) {
  // Get userId from prop or URL parameter
  const params = useParams();
  const id = params?.id;
  const urlUserId = id ? parseInt(id) : 0;
  
  // Use the prop userId if provided, otherwise use the URL parameter
  const userId = propUserId || urlUserId;
  
  console.log("PublicProfilePage - params:", params);
  console.log("PublicProfilePage - id:", id);
  console.log("PublicProfilePage - propUserId:", propUserId);
  console.log("PublicProfilePage - urlUserId:", urlUserId);
  console.log("PublicProfilePage - final userId:", userId);

  // Fetch public profile data - Use our emergency debug endpoint
  const { 
    data: rawData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/debug/user', userId],
    queryFn: async () => {
      console.log(`Requesting profile for user ID ${userId} using debug endpoint`);
      
      try {
        const res = await fetch(`/api/debug/user/${userId}`);
        console.log("Response status:", res.status);
        console.log("Response headers:", Object.fromEntries([...res.headers.entries()]));
        
        // First check if the response is proper JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error("Non-JSON response received:", contentType);
          const text = await res.text();
          console.error("Response body:", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
          throw new Error(`Non-JSON response: ${contentType}`);
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error response:", errorData);
          throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("Profile data from debug endpoint:", JSON.stringify(data, null, 2));
        return data;
      } catch (err) {
        console.error("Fetch error:", err);
        throw err;
      }
    },
    enabled: !!userId && !isNaN(userId),
    retry: 3,
    retryDelay: 1000
  });
  
  // Add extra debug render for response data
  if (rawData && !rawData.success) {
    console.error("Server reports error in profile data:", rawData);
  }
  
  // Convert the raw DB data to the expected profile format with improved null handling
  const profile = rawData?.success && rawData?.user ? {
    id: rawData.user.id,
    username: rawData.user.username || "Unknown User",
    level: rawData.user.level || 1,
    avatar: rawData.user.avatar,
    bannerImage: rawData.user.banner_image,
    bio: rawData.user.bio,
    htmlProfile: rawData.user.html_profile,
    showAchievements: rawData.user.show_achievements !== false,
    createdAt: rawData.user.created_at,
    status: rawData.user.status || 'offline',
    // No gang info for now
  } as UserProfile : undefined;

  // Fetch user achievements if visible
  const { 
    data: achievements
  } = useQuery<UserAchievement[] | { hidden: boolean }>({
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
                <Badge variant={profile.status === 'online' ? 'default' : 'outline'}>
                  {profile.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
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
              {achievements && 'hidden' in achievements ? (
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
                  {Array.isArray(achievements) && achievements
                    .filter(ach => ach.unlocked)
                    .map((achievement: UserAchievement) => (
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