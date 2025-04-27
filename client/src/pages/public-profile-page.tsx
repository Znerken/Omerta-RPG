import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Loader2, Users, Star, Award, ArrowLeft, CalendarIcon, Clock, Dumbbell, Shield, CircleDollarSign, MoveRight, SettingsIcon, Music, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  cash?: number;
  respect?: number;
  avatar: string | null;
  bannerImage: string | null;
  bio: string | null;
  htmlProfile: string | null;
  showAchievements: boolean;
  createdAt: string;
  status?: string;
  gang?: UserGang;
  gangRank?: string;
  // Visual customization
  avatarFrame?: any;
  nameEffect?: any;
  profileTheme?: any;
  backgroundEffect?: any;
  // Stats
  strength?: number;
  stealth?: number;
  charisma?: number;
  intelligence?: number;
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

  // Load profile customization settings from localStorage based on user ID
  const loadUserCustomizationSettings = (userId: number) => {
    if (typeof window === 'undefined') return null;
    
    try {
      // First try to load from localStorage by user ID
      const savedCustomization = localStorage.getItem(`userCustomization_${userId}`);
      if (savedCustomization) {
        try {
          const customization = JSON.parse(savedCustomization);
          
          const frame = customization.frameId 
            ? AVATAR_FRAMES.find(f => f.id === customization.frameId) 
            : AVATAR_FRAMES.find(f => f.id === 'classic');
            
          const theme = customization.themeId 
            ? PROFILE_THEMES.find(t => t.id === customization.themeId) 
            : PROFILE_THEMES.find(t => t.id === 'dark');
            
          const nameEffect = customization.nameEffectId 
            ? NAME_EFFECTS.find(e => e.id === customization.nameEffectId) 
            : NAME_EFFECTS.find(e => e.id === 'none');
            
          const bgEffect = customization.backgroundEffectId 
            ? BACKGROUND_EFFECTS.find(e => e.id === customization.backgroundEffectId) 
            : BACKGROUND_EFFECTS.find(e => e.id === 'none');
            
          return {
            avatarFrame: frame || AVATAR_FRAMES.find(f => f.id === 'classic'),
            nameEffect: nameEffect || NAME_EFFECTS.find(e => e.id === 'none'),
            profileTheme: theme || PROFILE_THEMES.find(t => t.id === 'dark'),
            backgroundEffect: bgEffect || BACKGROUND_EFFECTS.find(e => e.id === 'none')
          };
        } catch (e) {
          console.error("Error parsing user customization:", e);
        }
      }
      
      // Fallback to generic localStorage items
      const frameId = localStorage.getItem('profile-frame') || 'neon';
      const themeId = localStorage.getItem('profile-theme') || 'neon-crime';
      const nameEffectId = localStorage.getItem('profile-name-effect') || 'gradient-gold';
      const bgEffectId = localStorage.getItem('profile-bg-effect') || 'noise';
      
      return {
        avatarFrame: AVATAR_FRAMES.find(frame => frame.id === frameId) || AVATAR_FRAMES[0],
        nameEffect: NAME_EFFECTS.find(effect => effect.id === nameEffectId) || NAME_EFFECTS[0],
        profileTheme: PROFILE_THEMES.find(theme => theme.id === themeId) || PROFILE_THEMES[0],
        backgroundEffect: BACKGROUND_EFFECTS.find(effect => effect.id === bgEffectId) || BACKGROUND_EFFECTS[0]
      };
    } catch (error) {
      console.error("Error loading customization settings:", error);
      return null;
    }
  };

  // Get the user's customization or fallback to generated effects
  const userCustomization = userId ? loadUserCustomizationSettings(userId) : null;
  const visualEffects = userCustomization || generateRandomVisualEffects();

  // Convert the raw DB data to the expected profile format with improved null handling
  const profile = rawData?.success && rawData?.user ? {
    id: rawData.user.id,
    username: rawData.user.username || "Unknown User",
    level: rawData.user.level || 1,
    cash: rawData.user.cash || 0,
    respect: rawData.user.respect || 0,
    avatar: rawData.user.avatar,
    bannerImage: rawData.user.banner_image,
    bio: rawData.user.bio,
    htmlProfile: rawData.user.html_profile,
    showAchievements: rawData.user.show_achievements !== false,
    createdAt: rawData.user.created_at,
    status: rawData.user.status || 'offline',
    // Stats - would normally come from stats table
    strength: 100,
    stealth: 100,
    charisma: 100,
    intelligence: 100,
    
    // Add visual effects from the user's customization or fallback to random effects
    ...visualEffects
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

  // Format cash with $ and commas
  const formattedCash = profile.cash ? `$${profile.cash.toLocaleString()}` : "$0";
  const formattedRespect = profile.respect ? profile.respect.toLocaleString() : "0";

  return (
    <div className="container mx-auto max-w-4xl py-6 bg-black/60">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Profile Header with Banner and Background Effect - New Design */}
      <div className="relative border border-amber-800/60 rounded-md overflow-hidden mb-6">
        {/* Background Image with Pattern Overlay */}
        <div className="relative h-72 w-full">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80">
            <div className="w-full h-full bg-[url('https://i.imgur.com/UUmCPLs.png')] opacity-30"></div>
          </div>
          
          {/* Circular Avatar in Center */}
          <div className="absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <UserAvatar 
                user={profile} 
                size={100} 
                frame={profile.avatarFrame} 
              />
              {/* Settings icon on the avatar - Only shown when it's the user's own profile */}
              <div className="absolute -right-1 -top-1 bg-gray-800/80 p-1 rounded-full cursor-pointer hover:bg-gray-700/80 transition-colors">
                <SettingsIcon className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          </div>
          
          {/* Username Below Avatar - Large and centered with text effect */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 z-10 text-center">
            <h1 
              className={cn(
                "text-4xl uppercase tracking-wider font-bold text-white", 
                profile.nameEffect?.className || "text-shadow-lg"
              )}
              style={getNameEffectStyles(profile.nameEffect) || {
                textShadow: '0 0 15px rgba(255, 255, 255, 0.7)'
              }}
            >
              {profile.username}
            </h1>
            
            {/* Level Badge */}
            <div className="mt-2 flex justify-center">
              <Badge 
                className={cn(
                  "px-3 py-1 bg-amber-500/90 text-white shadow-md",
                  "flex items-center gap-1.5"
                )}
              >
                <Star className="h-4 w-4 fill-white" /> 
                <span className="font-semibold">Level {profile.level || 1}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Stats and Actions Row */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {/* Cash Badge */}
        <Badge variant="outline" className="bg-black/50 text-green-400 border-green-800/50 px-4 py-2 h-auto flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5" />
          <span className="text-sm font-medium">{formattedCash}</span>
        </Badge>
        
        {/* Respect Badge */}
        <Badge variant="outline" className="bg-black/50 text-red-400 border-red-800/50 px-4 py-2 h-auto flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-sm font-medium">{formattedRespect} Respect</span>
        </Badge>
        
        {/* Gang Badge */}
        {profile.gang ? (
          <Badge variant="outline" className="bg-black/50 text-purple-400 border-purple-800/50 px-4 py-2 h-auto flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">{profile.gang.name}</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-black/50 text-blue-400 border-blue-800/50 px-4 py-2 h-auto flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Mafia Boss</span>
          </Badge>
        )}
        
        {/* Crew Badge - Placeholder */}
        <Badge variant="outline" className="bg-black/50 text-cyan-400 border-cyan-800/50 px-4 py-2 h-auto flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">Crew: 6 Members</span>
        </Badge>
        
        {/* Customize Button */}
        <Badge variant="outline" className="bg-indigo-600/80 text-indigo-100 border-indigo-500 px-4 py-2 h-auto flex items-center gap-2 cursor-pointer hover:bg-indigo-500/80 transition-colors">
          <SettingsIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Customize</span>
        </Badge>
        
        {/* Photo Gallery Button */}
        <Badge variant="outline" className="bg-fuchsia-600/80 text-fuchsia-100 border-fuchsia-500 px-4 py-2 h-auto flex items-center gap-2 cursor-pointer hover:bg-fuchsia-500/80 transition-colors">
          <Image className="h-5 w-5" />
          <Music className="h-5 w-5" />
          <span className="text-sm font-medium">Photo Gallery</span>
        </Badge>
        
        {/* Edit Profile Button */}
        <Badge variant="outline" className="bg-slate-700/80 text-slate-100 border-slate-600 px-4 py-2 h-auto flex items-center gap-2 cursor-pointer hover:bg-slate-600/80 transition-colors">
          <SettingsIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Edit Profile</span>
        </Badge>
      </div>

      {/* Two-column layout for profile content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - About & Character Stats */}
        <div className="space-y-6">
          {/* About Section */}
          <div className="bg-black/70 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-white">About</h2>
            </div>
            <div className="p-4">
              {profile.bio ? (
                <p className="text-gray-300">{profile.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio provided yet.</p>
              )}
            </div>
          </div>
          
          {/* Character Stats Section */}
          <div className="bg-black/70 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-white">Character Stats</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* XP Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Level Progress</span>
                  <span className="text-gray-300">0 / 100 XP</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300" 
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>
              
              {/* Strength Stat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center">
                    <Dumbbell className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                    Strength
                  </span>
                  <span className="text-red-400">{profile.strength || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-700 to-red-500" 
                    style={{ width: `${profile.strength || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stealth Stat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center">
                    <MoveRight className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                    Stealth
                  </span>
                  <span className="text-green-400">{profile.stealth || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-700 to-green-500" 
                    style={{ width: `${profile.stealth || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Charisma Stat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                    Charisma
                  </span>
                  <span className="text-blue-400">{profile.charisma || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-700 to-blue-500" 
                    style={{ width: `${profile.charisma || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Intelligence Stat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center">
                    <Shield className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                    Intelligence
                  </span>
                  <span className="text-amber-400">{profile.intelligence || 0}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-700 to-amber-500" 
                    style={{ width: `${profile.intelligence || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Showcase */}
        <div className="md:col-span-2">
          <div className="bg-black/70 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-white">Showcase</h2>
            </div>
            <div className="p-4 space-y-6">
              {/* Music Player */}
              {profile.htmlProfile ? (
                <div 
                  className="custom-profile"
                  dangerouslySetInnerHTML={{ __html: profile.htmlProfile }}
                />
              ) : (
                <>
                  {/* Example Music Player */}
                  <div className="bg-gray-900/80 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-md overflow-hidden">
                        <img 
                          src="https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e"
                          alt="Album Cover" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Happier Than Ever</h3>
                        <p className="text-gray-400">BILLIE EILISH</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>2:35 / 4:58</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-gray-700 rounded-full mb-4">
                      <div className="w-1/2 h-full bg-white rounded-full"></div>
                    </div>
                    <div className="flex justify-center items-center gap-4">
                      <div className="rounded-full bg-red-500 w-10 h-10 flex items-center justify-center text-white">
                        <span>▶</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src="https://i.pinimg.com/736x/2e/61/83/2e61839b1699f4e88e97b3dd6bf12cad.jpg"
                        alt="Gallery Image 1" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src="https://i.pinimg.com/736x/43/fc/2b/43fc2b1cd1507f7b28926d458a3e57c8.jpg"
                        alt="Gallery Image 2" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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