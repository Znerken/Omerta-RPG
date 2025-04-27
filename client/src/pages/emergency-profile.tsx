import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Users, Award, Star, CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  UserAvatar 
} from "@/components/profile/UserAvatar";
import { 
  AVATAR_FRAMES, 
  NAME_EFFECTS, 
  PROFILE_THEMES, 
  BACKGROUND_EFFECTS,
  getNameEffectStyles,
  AvatarFrame,
  ProfileTheme,
  NameEffect,
  BackgroundEffect
} from "@/components/profile/ProfileCustomization";
import { cn } from "@/lib/utils";

// Define a conversion function for the database fields
function convertDbUserToProfile(dbUser: any) {
  console.log("Debug - Raw user data for profile effects:", {
    avatarFrame: dbUser.avatar_frame,
    nameEffect: dbUser.name_effect,
    profileTheme: dbUser.profile_theme,
    backgroundEffect: dbUser.background_effect
  });

  // Set some default effects for testing if no effects found
  const hasNoEffects = !dbUser.avatar_frame && !dbUser.name_effect && !dbUser.profile_theme && !dbUser.background_effect;
  
  // Default avatar frame
  const defaultFrame = AVATAR_FRAMES.find(frame => frame.id === 'classic') || AVATAR_FRAMES[0];
  
  // Default profile theme
  const defaultTheme = PROFILE_THEMES.find(theme => theme.id === 'dark') || PROFILE_THEMES[0];
  
  // Default name effect
  const defaultNameEffect = NAME_EFFECTS.find(effect => effect.id === 'none') || NAME_EFFECTS[0];
  
  // Default background effect
  const defaultBgEffect = BACKGROUND_EFFECTS.find(effect => effect.id === 'none') || BACKGROUND_EFFECTS[0];
  
  // If we have no effects, set some test ones
  if (hasNoEffects) {
    console.log("No profile effects found, using test effects for demonstration");
    
    // Use a random avatar frame for testing
    const testFrames = ['rare-gold', 'epic-neon', 'legendary-fire'];
    const randomFrameId = testFrames[Math.floor(Math.random() * testFrames.length)];
    const testFrame = AVATAR_FRAMES.find(frame => frame.id === randomFrameId) || defaultFrame;
    
    // Use a random name effect for testing
    const testNameEffects = ['gradient-red', 'gradient-gold', 'rainbow'];
    const randomNameEffectId = testNameEffects[Math.floor(Math.random() * testNameEffects.length)];
    const testNameEffect = NAME_EFFECTS.find(effect => effect.id === randomNameEffectId) || defaultNameEffect;
    
    // Use a specific profile theme for testing
    const testTheme = PROFILE_THEMES.find(theme => theme.id === 'neon-crime') || defaultTheme;
    
    // Use a random background effect for testing
    const testBgEffects = ['noise', 'matrix', 'rain'];
    const randomBgEffectId = testBgEffects[Math.floor(Math.random() * testBgEffects.length)];
    const testBgEffect = BACKGROUND_EFFECTS.find(effect => effect.id === randomBgEffectId) || defaultBgEffect;
    
    return {
      id: dbUser.id,
      username: dbUser.username,
      level: dbUser.level || 1,
      avatar: dbUser.avatar || null,
      bannerImage: dbUser.banner_image || null,
      bio: dbUser.bio || null,
      htmlProfile: dbUser.html_profile || null,
      showAchievements: dbUser.show_achievements === true,
      createdAt: dbUser.created_at || new Date().toISOString(),
      status: dbUser.status || "offline",
      gang: dbUser.gang_id ? {
        id: dbUser.gang_id,
        name: "Unknown Gang",
        tag: "???"
      } : undefined,
      // Add additional stats that our UI might need
      cash: dbUser.cash || 0,
      respect: dbUser.respect || 0,
      xp: dbUser.xp || 0,
      // Flag for special traits
      isAdmin: dbUser.is_admin === true,
      isJailed: dbUser.is_jailed === true,
      // Use test profile customization
      avatarFrame: testFrame,
      profileTheme: testTheme,
      nameEffect: testNameEffect,
      backgroundEffect: testBgEffect
    };
  }

  // Get the profile theme from database or use default
  const profileThemeId = dbUser.profile_theme || 'dark';
  const profileTheme = PROFILE_THEMES.find(theme => theme.id === profileThemeId) || defaultTheme;
  
  // Get the avatar frame from database or use default (assuming stored as JSON or string)
  let avatarFrameId = 'classic';
  try {
    if (dbUser.avatar_frame) {
      if (typeof dbUser.avatar_frame === 'string') {
        avatarFrameId = dbUser.avatar_frame;
      } else if (typeof dbUser.avatar_frame === 'object' && dbUser.avatar_frame.id) {
        avatarFrameId = dbUser.avatar_frame.id;
      }
    }
  } catch (e) {
    console.error("Error parsing avatar frame:", e);
  }
  const avatarFrame = AVATAR_FRAMES.find(frame => frame.id === avatarFrameId) || defaultFrame;
  
  // Get the name effect from database or use default (assuming stored as JSON or string)
  let nameEffectId = 'none';
  try {
    if (dbUser.name_effect) {
      if (typeof dbUser.name_effect === 'string') {
        nameEffectId = dbUser.name_effect;
      } else if (typeof dbUser.name_effect === 'object' && dbUser.name_effect.id) {
        nameEffectId = dbUser.name_effect.id;
      }
    }
  } catch (e) {
    console.error("Error parsing name effect:", e);
  }
  const nameEffect = NAME_EFFECTS.find(effect => effect.id === nameEffectId) || defaultNameEffect;
  
  // Get the background effect from database or use default (assuming stored as JSON or string)
  let bgEffectId = 'none';
  try {
    if (dbUser.background_effect) {
      if (typeof dbUser.background_effect === 'string') {
        bgEffectId = dbUser.background_effect;
      } else if (typeof dbUser.background_effect === 'object' && dbUser.background_effect.id) {
        bgEffectId = dbUser.background_effect.id;
      }
    }
  } catch (e) {
    console.error("Error parsing background effect:", e);
  }
  const backgroundEffect = BACKGROUND_EFFECTS.find(effect => effect.id === bgEffectId) || defaultBgEffect;
  
  // Convert database field names to the expected profile object structure
  return {
    id: dbUser.id,
    username: dbUser.username,
    level: dbUser.level || 1,
    avatar: dbUser.avatar || null,
    bannerImage: dbUser.banner_image || null,
    bio: dbUser.bio || null,
    htmlProfile: dbUser.html_profile || null,
    showAchievements: dbUser.show_achievements === true,
    createdAt: dbUser.created_at || new Date().toISOString(),
    status: dbUser.status || "offline",
    gang: dbUser.gang_id ? {
      id: dbUser.gang_id,
      name: "Unknown Gang",
      tag: "???"
    } : undefined,
    // Add additional stats that our UI might need
    cash: dbUser.cash || 0,
    respect: dbUser.respect || 0,
    xp: dbUser.xp || 0,
    // Flag for special traits
    isAdmin: dbUser.is_admin === true,
    isJailed: dbUser.is_jailed === true,
    // Profile customization
    avatarFrame: avatarFrame,
    profileTheme: profileTheme,
    nameEffect: nameEffect,
    backgroundEffect: backgroundEffect
  };
}

export default function EmergencyProfilePage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const userId = params?.id ? parseInt(params.id) : null;
  console.log("EmergencyProfilePage - userId:", userId);
  
  // Local state to store raw data for inspection
  const [rawUserData, setRawUserData] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  
  // Fetch user data using our emergency endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/debug/user', userId],
    queryFn: async () => {
      console.log(`Requesting profile for user ID ${userId} using debug endpoint`);
      
      try {
        const res = await fetch(`/api/debug/user/${userId}`);
        console.log("Response status:", res.status);
        console.log("Response headers:", Object.fromEntries([...res.headers.entries()]));
        
        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
        }
        
        const jsonData = await res.json();
        console.log("Profile data from debug endpoint:", JSON.stringify(jsonData, null, 2));
        
        // Store the raw data for display
        setRawUserData(JSON.stringify(jsonData, null, 2));
        
        return jsonData;
      } catch (err) {
        console.error("Profile fetch error:", err);
        throw err;
      }
    },
    enabled: !!userId && !isNaN(userId),
    retry: 2
  });
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Error</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <pre className="bg-muted/30 p-4 rounded text-left text-sm overflow-auto max-h-48">
            {error instanceof Error && error.stack ? error.stack : "No stack trace available"}
          </pre>
        </Card>
      </div>
    );
  }
  
  // If the data is not properly structured
  if (!data || !data.success || !data.user) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Data Issue</h2>
          <p className="text-muted-foreground mb-4">The profile data returned by the server is not in the expected format.</p>
          
          <pre className="bg-muted/30 p-4 rounded text-sm overflow-auto max-h-96 text-left">
            {rawUserData || JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      </div>
    );
  }
  
  // Extract user data from the database response and convert to our profile format
  const dbUser = data.user;
  const profile = convertDbUserToProfile(dbUser);
  
  // Format member since date
  const memberSince = profile.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : 'Unknown';
  
  // Determine if any special background effects should be applied
  const hasBackgroundEffect = profile.backgroundEffect && profile.backgroundEffect.id !== 'none';
  
  return (
    <div className={cn(
      "container mx-auto max-w-4xl py-6",
      hasBackgroundEffect && profile.backgroundEffect?.cssClass
    )}>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              profile.profileTheme?.border
            )}
          >
            Direct DB Access
          </Badge>
          <Link href={`/player/${profile.id}`} className="text-xs bg-primary/20 hover:bg-primary/30 text-primary px-2 py-1 rounded-md transition-colors">
            Try Standard View
          </Link>
        </div>
      </div>
      
      {/* Inject the CSS for name effects */}
      {getNameEffectStyles()}
      
      {/* Profile Header with Banner */}
      <div className="relative mb-6">
        {profile.bannerImage ? (
          <div className={cn(
            "w-full h-48 overflow-hidden rounded-t-lg",
            profile.backgroundEffect?.cssClass
          )}>
            <img 
              src={profile.bannerImage} 
              alt={`${profile.username}'s banner`} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={cn(
            "w-full h-48 rounded-t-lg",
            profile.profileTheme?.background || "bg-gradient-to-r from-gray-800 to-gray-900",
            profile.backgroundEffect?.cssClass || "film-grain"
          )} />
        )}
        
        <div className="absolute -bottom-16 left-6">
          <UserAvatar 
            username={profile.username}
            avatarUrl={profile.avatar}
            size="xl"
            linkToProfile={false}
            frame={profile.avatarFrame}
          />
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {/* Left Column - User Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className={cn(
            profile.profileTheme?.background,
            profile.profileTheme?.border
          )}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={cn(
                    "text-3xl",
                    profile.nameEffect?.cssClass
                  )}>{profile.username}</CardTitle>
                  <div className="text-muted-foreground mt-1 flex items-center space-x-2">
                    <Badge variant={profile.isAdmin ? "destructive" : "secondary"}>
                      {profile.isAdmin ? "Admin" : "Level " + profile.level}
                    </Badge>
                    {profile.gang && (
                      <Badge variant="outline">
                        <span className="mr-1">{profile.gang.tag}</span>
                        {profile.gang.name}
                      </Badge>
                    )}
                    <Badge variant={profile.isJailed ? "destructive" : "outline"}>
                      {profile.isJailed ? "In Jail" : "Free"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      profile.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <span>{profile.status === 'online' ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile.bio && (
                <div className="mb-4">
                  <h3 className="text-sm text-muted-foreground mb-2">Bio</h3>
                  <p>{profile.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Cash</div>
                  <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                    ${profile.cash.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Respect</div>
                  <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    {profile.respect.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm text-muted-foreground mb-3">Account Details</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Member Since</span>
                  </div>
                  <div className="text-right">{memberSince}</div>
                  
                  <div className="flex items-center">
                    <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>XP</span>
                  </div>
                  <div className="text-right">{profile.xp.toLocaleString()}</div>
                  
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Gang</span>
                  </div>
                  <div className="text-right">
                    {profile.gang ? profile.gang.name : "None"}
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Last Seen</span>
                  </div>
                  <div className="text-right">
                    {dbUser.last_seen ? format(new Date(dbUser.last_seen), 'MMM d, yyyy HH:mm') : 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Raw Data & Debug */}
        <div className="space-y-6">
          <Card className={cn(
            "relative overflow-hidden",
            profile.profileTheme?.background,
            profile.profileTheme?.border
          )}>
            {/* Add subtle background effect if one is selected */}
            {profile.backgroundEffect && profile.backgroundEffect.id !== 'none' && (
              <div className={cn(
                "absolute inset-0 opacity-20 pointer-events-none z-0",
                profile.backgroundEffect?.cssClass
              )}></div>
            )}
          
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className={cn(
                "text-lg flex items-center justify-between"
              )}>
                <span>Debug Data</span>
                <button 
                  className={cn(
                    "text-xs px-2 py-1 rounded-md transition-colors",
                    profile.profileTheme?.id === 'gold' 
                      ? "bg-amber-700/20 hover:bg-amber-700/30 text-amber-300" 
                      : profile.profileTheme?.id === 'blood'
                        ? "bg-red-800/20 hover:bg-red-800/30 text-red-300"
                        : "bg-primary/20 hover:bg-primary/30 text-primary"
                  )}
                  onClick={() => setShowRawData(!showRawData)}
                >
                  {showRawData ? 'Hide' : 'Show'} Raw JSON
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">
                  This data is fetched directly from the database without going through the standard API.
                </p>
                <div className="grid grid-cols-2 gap-y-1 text-sm mb-2">
                  <div className="text-muted-foreground">User ID:</div>
                  <div>{profile.id}</div>
                  <div className="text-muted-foreground">Email:</div>
                  <div className="truncate">{dbUser.email}</div>
                  <div className="text-muted-foreground">Admin:</div>
                  <div>{dbUser.is_admin ? 'Yes' : 'No'}</div>
                  <div className="text-muted-foreground">Avatar Frame:</div>
                  <div className="truncate">{profile.avatarFrame?.name || 'None'}</div>
                  <div className="text-muted-foreground">Profile Theme:</div>
                  <div className="truncate">{profile.profileTheme?.name || 'None'}</div>
                  <div className="text-muted-foreground">Name Effect:</div>
                  <div className="truncate">{profile.nameEffect?.name || 'None'}</div>
                </div>
                
                {showRawData && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Raw Database Object</div>
                      <button 
                        className={cn(
                          "text-xs p-1 rounded transition-colors",
                          profile.profileTheme?.id === 'gold' 
                            ? "bg-amber-700/20 hover:bg-amber-700/30 text-amber-300" 
                            : profile.profileTheme?.id === 'blood'
                              ? "bg-red-800/20 hover:bg-red-800/30 text-red-300"
                              : "bg-primary/20 hover:bg-primary/30 text-primary"
                        )}
                        onClick={() => {
                          navigator.clipboard.writeText(rawUserData || JSON.stringify(data, null, 2));
                          toast({
                            title: "Copied to clipboard",
                            description: "The raw JSON data has been copied to your clipboard."
                          });
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className={cn(
                      "text-xs overflow-auto max-h-80 p-2 rounded-md border",
                      profile.profileTheme?.id === 'dark' 
                        ? "bg-black/40 border-white/5 text-muted-foreground" 
                        : "bg-muted/30 text-muted-foreground"
                    )}>
                      {rawUserData || JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}