import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Loader2, Users, Star, Award, ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { 
  AVATAR_FRAMES,
  NAME_EFFECTS, 
  PROFILE_THEMES, 
  BACKGROUND_EFFECTS,
  getNameEffectStyles 
} from "@/components/profile/ProfileCustomization";

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
  // Visual customization
  avatarFrame?: any;
  nameEffect?: any;
  profileTheme?: any;
  backgroundEffect?: any;
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
  
  // Generate random visual effects for profiles if needed
  const generateRandomVisualEffects = () => {
    // Use a random frame for testing
    const frames = ['rare-gold', 'epic-neon', 'legendary-fire', 'uncommon-silver'];
    const randomFrameId = frames[Math.floor(Math.random() * frames.length)];
    const randomFrame = AVATAR_FRAMES.find(frame => frame.id === randomFrameId) 
      || AVATAR_FRAMES.find(frame => frame.id === 'default');
    
    // Use a random name effect for testing
    const nameEffects = ['gradient-red', 'gradient-gold', 'rainbow', 'neon-blue', 'shadow'];
    const randomNameEffectId = nameEffects[Math.floor(Math.random() * nameEffects.length)];
    const randomNameEffect = NAME_EFFECTS.find(effect => effect.id === randomNameEffectId)
      || NAME_EFFECTS.find(effect => effect.id === 'default');
    
    // Use a random profile theme for testing
    const themes = ['neon-crime', 'classic-noir', 'modern-minimal', 'luxury-gold'];
    const randomThemeId = themes[Math.floor(Math.random() * themes.length)];
    const randomTheme = PROFILE_THEMES.find(theme => theme.id === randomThemeId)
      || PROFILE_THEMES.find(theme => theme.id === 'default');
    
    // Use a random background effect for testing
    const bgEffects = ['noise', 'matrix', 'rain', 'particles', 'money-rain', 'cigar-smoke'];
    const randomBgEffectId = bgEffects[Math.floor(Math.random() * bgEffects.length)];
    const randomBgEffect = BACKGROUND_EFFECTS.find(effect => effect.id === randomBgEffectId)
      || BACKGROUND_EFFECTS.find(effect => effect.id === 'default');
    
    return {
      avatarFrame: randomFrame,
      nameEffect: randomNameEffect,
      profileTheme: randomTheme,
      backgroundEffect: randomBgEffect
    };
  };

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
    
    // Add visual effects - either from database or generate random ones for testing
    ...generateRandomVisualEffects()
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

  // If error, show error message with link to emergency profile
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
          <p className="text-muted-foreground mb-4">This profile does not exist or is not available.</p>
          
          {userId && (
            <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-amber-800 dark:text-amber-300 text-sm mb-2">
                Try the emergency profile viewer instead:
              </p>
              <Link 
                href={`/emergency-profile/${userId}`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                View Emergency Profile
              </Link>
            </div>
          )}
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

      {/* Profile Header with Banner and Background Effect */}
      <div className={cn(
        "relative mb-6", 
        profile.backgroundEffect?.className
      )}>
        {/* Background effect container */}
        <div className="w-full h-60 overflow-hidden rounded-t-lg relative">
          {/* Banner image */}
          {profile.bannerImage && (
            <img 
              src={profile.bannerImage} 
              alt={`${profile.username}'s banner`} 
              className="w-full h-full object-cover absolute inset-0 z-0"
            />
          )}
          
          {/* Background effect overlay */}
          <div className={cn(
            "absolute inset-0 z-10",
            !profile.bannerImage ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-black/30",
            profile.profileTheme?.bgClassName
          )}>
            {/* Apply any animated background effects */}
            {profile.backgroundEffect?.element && (
              <div className="absolute inset-0 z-10 overflow-hidden">
                {profile.backgroundEffect.element}
              </div>
            )}
          </div>
          
          {/* User status indicator - top right */}
          <div className="absolute top-4 right-4 z-20">
            <Badge 
              variant={profile.status === 'online' ? 'default' : 'secondary'}
              className={cn(
                "h-8 px-3 py-1.5 font-semibold text-sm",
                profile.status === 'online' 
                  ? "bg-green-500/80 text-white animate-pulse" 
                  : "bg-gray-500/80 text-white"
              )}
            >
              {profile.status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
        
        {/* Avatar with frame */}
        <div className="absolute -bottom-16 left-6 z-30">
          <UserAvatar 
            user={profile} 
            size={128} 
            frame={profile.avatarFrame} 
          />
        </div>
      </div>

      {/* Profile Info */}
      <Card className={cn(
        "mt-16 mb-6 overflow-hidden", 
        profile.profileTheme?.cardClassName
      )}>
        <CardContent className="pt-6 relative">
          {/* Theme overlay effects */}
          {profile.profileTheme?.overlayElement && (
            <div className="absolute inset-0 pointer-events-none">
              {profile.profileTheme.overlayElement}
            </div>
          )}
          
          <div className="flex justify-between items-start z-10 relative">
            <div className="w-full">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Username with effect */}
                <h1 
                  className={cn(
                    "text-3xl font-bold", 
                    profile.nameEffect?.className
                  )}
                  style={getNameEffectStyles(profile.nameEffect)}
                >
                  {profile.username}
                </h1>
                
                {/* Level badge with glow effect */}
                <Badge 
                  className={cn(
                    "px-3 py-1.5 bg-amber-500/90 text-white shadow-lg",
                    "border border-amber-400/30",
                    "flex items-center gap-1.5",
                    "animate-[pulse_3s_ease-in-out_infinite]"
                  )}
                >
                  <Star className="h-4 w-4 fill-white" /> 
                  <span className="font-semibold">Level {profile.level || 1}</span>
                </Badge>
                
                {/* Member since info */}
                <div className="ml-auto flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> 
                  <span>Member since {memberSince}</span>
                </div>
              </div>
              
              {/* Additional badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.gang && (
                  <Badge className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 px-3 py-1.5 shadow-lg">
                    <Users className="h-3.5 w-3.5" /> 
                    <span className="font-medium">{profile.gang.name}</span>
                    <span className="bg-purple-800 text-purple-100 px-1.5 py-0.5 rounded-sm text-xs ml-1">
                      {profile.gang.tag}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Bio with styled container */}
          {profile.bio && (
            <div className={cn(
              "mt-6 p-4 rounded-lg",
              profile.profileTheme?.bioClassName || "bg-secondary/20"
            )}>
              <h2 className="text-lg font-semibold mb-2 flex items-center">
                <span className="mr-2">Bio</span>
                <div className="h-px flex-grow bg-border/50"></div>
              </h2>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="custom" className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-primary/10 p-1.5 rounded text-primary">
              <Users className="h-5 w-5" />
            </span>
            {profile.username}'s Profile
          </h2>
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="custom">Custom Profile</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
        </div>

        {/* Custom HTML Profile */}
        <TabsContent value="custom">
          <Card className={cn(
            "overflow-hidden shadow-xl", 
            profile.profileTheme?.cardClassName
          )}>
            <CardContent className="p-0 relative">
              {/* Theme overlay effects */}
              {profile.profileTheme?.overlayElement && (
                <div className="absolute inset-0 pointer-events-none">
                  {profile.profileTheme.overlayElement}
                </div>
              )}
              
              {profile.htmlProfile ? (
                <div 
                  className="custom-profile relative z-10"
                  dangerouslySetInnerHTML={{ __html: profile.htmlProfile }}
                />
              ) : (
                <div className="py-16 px-4 text-center text-muted-foreground relative z-10">
                  <div className="bg-secondary/10 inline-block p-6 rounded-full mb-3">
                    <Users className="h-16 w-16 opacity-30" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Custom Profile Yet</h3>
                  <p className="max-w-md mx-auto">
                    {profile.username} hasn't created a custom profile yet. 
                    Custom profiles can include photo galleries, music preferences, 
                    favorite quotes, and more personalized content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements">
          <Card className={cn(
            "overflow-hidden", 
            profile.profileTheme?.cardClassName
          )}>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Award className="h-6 w-6 text-amber-500" />
                Achievements & Honors
              </CardTitle>
              {profile.profileTheme?.dividerElement && (
                <div className="absolute bottom-0 left-0 right-0">
                  {profile.profileTheme.dividerElement}
                </div>
              )}
            </CardHeader>
            <CardContent className="relative">
              {/* Theme overlay effects */}
              {profile.profileTheme?.overlayElement && (
                <div className="absolute inset-0 pointer-events-none">
                  {profile.profileTheme.overlayElement}
                </div>
              )}
              
              {achievements && 'hidden' in achievements ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="relative inline-block">
                    <Award className="mx-auto h-20 w-20 mb-2 opacity-30 text-amber-800/20" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🔒</div>
                  </div>
                  <p className="text-lg">{profile.username} has chosen to hide their achievements.</p>
                </div>
              ) : !achievements || achievements.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="bg-secondary/10 inline-block p-6 rounded-full mb-3">
                    <Award className="mx-auto h-16 w-16 opacity-30 text-amber-500/30" />
                  </div>
                  <p className="text-lg">No achievements unlocked yet.</p>
                  <p className="text-sm mt-1 max-w-md mx-auto">
                    As {profile.username} completes criminal activities and challenges, 
                    achievements will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  {Array.isArray(achievements) && achievements
                    .filter(ach => ach.unlocked)
                    .map((achievement: UserAchievement) => (
                      <div 
                        key={achievement.id} 
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg transition-all",
                          "bg-gradient-to-br from-secondary/30 to-secondary/5",
                          "border border-border/40 hover:border-primary/20",
                          "relative overflow-hidden group"
                        )}
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        
                        {/* Achievement icon */}
                        <div className="relative">
                          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-3 rounded-lg">
                            <Award className="h-8 w-8 text-amber-500" />
                          </div>
                          {/* Shine effect */}
                          <div className="absolute top-0 right-0 h-full w-1/3 bg-white/10 skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                        </div>
                        
                        {/* Achievement content */}
                        <div className="flex-1 z-10">
                          <h3 className="font-bold text-lg">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <div className="flex items-center mt-2 text-xs bg-background/50 px-2 py-1 rounded w-fit">
                              <Clock className="mr-1.5 h-3 w-3 text-amber-500" />
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