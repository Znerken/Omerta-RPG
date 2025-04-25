import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/profile/RichTextEditor";
import { 
  User, 
  DollarSign, 
  Award, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Medal, 
  Dumbbell, 
  Footprints, 
  BookOpen, 
  SmilePlus,
  Briefcase,
  Users,
  Image,
  FileEdit,
  Camera,
  Upload,
  PenTool,
  Palette,
  Save,
  Trash2,
  UserPlus,
  UserMinus,
  UserCheck
} from "lucide-react";
import { formatCurrency, getInitials, calculateLevelProgress } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ProfilePageProps {
  userId?: number;
}

// Friend action button component for other users' profiles
function FriendActionButton({ profile }: { profile: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if already friends or have pending request
  const isFriend = profile.isFriend;
  const friendStatus = profile.friendStatus;
  const friendRequest = profile.friendRequest;
  
  // Mutation for sending friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/social/friends/request", { friendId: profile.id });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: `Request sent to ${profile.username}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/social/users/${profile.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending request",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for accepting friend request
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!friendRequest) return;
      return apiRequest("POST", `/api/social/friends/request/${friendRequest.id}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${profile.username}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/social/users/${profile.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error accepting request",
        description: error.message || "Failed to accept friend request",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for rejecting friend request
  const rejectFriendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!friendRequest) return;
      return apiRequest("POST", `/api/social/friends/request/${friendRequest.id}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: `Request from ${profile.username} has been rejected`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/social/users/${profile.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error rejecting request",
        description: error.message || "Failed to reject friend request",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for removing friend
  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/social/friends/${profile.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: `${profile.username} has been removed from your friends`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/social/users/${profile.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing friend",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });
  
  // Render button based on relationship status
  if (isFriend) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => removeFriendMutation.mutate()}
        disabled={removeFriendMutation.isPending}
        className="flex items-center gap-1 bg-black/50 backdrop-blur-sm hover:bg-black/70"
      >
        {removeFriendMutation.isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <UserMinus className="h-4 w-4 text-red-400" />
        )}
        Remove Friend
      </Button>
    );
  }
  
  if (friendStatus === "pending" && !friendRequest) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-1 bg-black/50 backdrop-blur-sm"
      >
        <Clock className="h-4 w-4 text-yellow-400" />
        Request Pending
      </Button>
    );
  }
  
  if (friendRequest) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground text-center mb-1">
          Friend Request
        </div>
        <Button
          size="sm"
          onClick={() => acceptFriendRequestMutation.mutate()}
          disabled={acceptFriendRequestMutation.isPending || rejectFriendRequestMutation.isPending}
          className="flex items-center gap-1"
        >
          {acceptFriendRequestMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => rejectFriendRequestMutation.mutate()}
          disabled={acceptFriendRequestMutation.isPending || rejectFriendRequestMutation.isPending}
          className="flex items-center gap-1"
        >
          {rejectFriendRequestMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <UserMinus className="h-4 w-4" />
          )}
          Reject
        </Button>
      </div>
    );
  }
  
  // Default: No relationship yet, show add friend button
  return (
    <Button
      size="sm"
      onClick={() => sendFriendRequestMutation.mutate()}
      disabled={sendFriendRequestMutation.isPending}
      className="flex items-center gap-1 bg-black/50 backdrop-blur-sm hover:bg-black/70"
    >
      {sendFriendRequestMutation.isPending ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Add Friend
    </Button>
  );
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  const { user: currentUser } = useAuth();
  const isViewingOwnProfile = !userId || (currentUser && userId === currentUser.id);
  
  // Fetch user profile based on whether we're viewing own profile or another user's
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: isViewingOwnProfile ? ["/api/user/profile"] : [`/api/social/users/${userId}`],
    queryFn: async () => {
      if (isViewingOwnProfile) {
        const response = await apiRequest("GET", "/api/user/profile");
        return await response.json();
      } else {
        const response = await apiRequest("GET", `/api/social/users/${userId}`);
        return await response.json();
      }
    }
  });
  
  // Only fetch crime history for own profile
  const { data: crimeHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/crimes"],
    enabled: isViewingOwnProfile,
  });

  // Initialize all state variables at the top
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [bio, setBio] = useState("");
  const [htmlProfile, setHtmlProfile] = useState("");
  const [showAchievements, setShowAchievements] = useState(true);
  const [profileTheme, setProfileTheme] = useState("dark");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // All mutations must be defined before any conditional returns
  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const res = await apiRequest("PATCH", "/api/user/profile", profileData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Mutation for uploading avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });
      setAvatarPreview(data.avatar);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload avatar",
        description: error.message || "There was an error uploading your avatar.",
        variant: "destructive",
      });
    },
  });

  // Mutation for uploading banner
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("banner", file);
      const res = await fetch("/api/user/banner", {
        method: "POST",
        body: formData,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Banner updated",
        description: "Your banner has been updated successfully.",
      });
      setBannerPreview(data.bannerImage);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload banner",
        description: error.message || "There was an error uploading your banner.",
        variant: "destructive",
      });
    },
  });

  // Update state values when profile data loads
  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || "");
      setHtmlProfile(userProfile.htmlProfile || "");
      setShowAchievements(userProfile.showAchievements !== false);
      setProfileTheme(userProfile.profileTheme || "dark");
      setAvatarPreview(userProfile.avatar || null);
      setBannerPreview(userProfile.bannerImage || null);
    }
  }, [userProfile]);

  // Convert API crime history to activity items format
  const crimeActivities = crimeHistory?.map((crime: any) => {
    if (!crime.lastPerformed) return null;
    
    return {
      id: crime.lastPerformed.id,
      type: 'crime',
      title: crime.name,
      result: crime.lastPerformed.success ? 'success' : crime.lastPerformed.jailed ? 'jailed' : 'failed',
      reward: crime.lastPerformed.success ? {
        cash: crime.lastPerformed.cashReward,
        xp: crime.lastPerformed.xpReward,
      } : undefined,
      timestamp: new Date(crime.lastPerformed.timestamp),
    };
  }).filter(Boolean);

  // Add some sample training activities for UI demonstration
  const trainingActivities = [
    {
      id: 10001,
      type: 'training',
      title: 'Trained Strength',
      result: 'completed',
      reward: { stat: 'Strength', statValue: 2 },
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: 10002,
      type: 'training',
      title: 'Trained Stealth',
      result: 'completed',
      reward: { stat: 'Stealth', statValue: 1 },
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    }
  ];

  const allActivities = [...(crimeActivities || []), ...trainingActivities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (profileLoading || historyLoading) {
    return (
      <>
        <PageHeader 
          title={isViewingOwnProfile ? "Your Profile" : "User Profile"} 
          icon={<User className="h-5 w-5" />} 
          description="Loading profile data..." 
        />
        <div className="grid place-items-center h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <PageHeader 
          title="Profile" 
          icon={<User className="h-5 w-5" />} 
          description="Profile not found" 
        />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Profile not available</h2>
          <p className="text-muted-foreground">
            {isViewingOwnProfile 
              ? "There was an error loading your profile data. Please try again later."
              : "This user's profile could not be found or is no longer available."
            }
          </p>
        </div>
      </>
    );
  }

  const { username, level, xp, cash, respect, stats } = userProfile;
  const nextLevelXp = userProfile.nextLevelXP || 100 * Math.pow(level, 2);
  const xpProgress = calculateLevelProgress(xp, nextLevelXp);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setBannerPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    // Upload images if selected
    if (avatarFile) {
      await uploadAvatarMutation.mutateAsync(avatarFile);
      setAvatarFile(null);
    }

    if (bannerFile) {
      await uploadBannerMutation.mutateAsync(bannerFile);
      setBannerFile(null);
    }

    // Update profile data
    await updateProfileMutation.mutateAsync({
      bio,
      htmlProfile,
      showAchievements,
      profileTheme,
    });
  };

  return (
    <div className={`profile-page ${profileTheme}`}>
      {/* Dynamic Action Button - Always visible floating at top right */}
      <div className="fixed top-20 right-6 z-50">
        {isViewingOwnProfile ? (
          // Own profile - Show edit buttons
          <>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1"
                  disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadBannerMutation.isPending}
                >
                  {(updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadBannerMutation.isPending) ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <FileEdit className="h-4 w-4" /> Edit Profile
              </Button>
            )}
          </>
        ) : (
          // Other user's profile - Show friend actions
          <FriendActionButton profile={userProfile} />
        )}
      </div>
      
      {/* Full-width Banner with Avatar */}
      <div className="relative w-full mb-16">
        {/* Banner Image - Full width */}
        <div 
          className="w-full h-64 bg-gradient-to-r from-primary/30 to-accent/30 relative overflow-hidden"
          style={{
            backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70"
              onClick={() => bannerInputRef.current?.click()}
            >
              <Image className="h-5 w-5" />
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleBannerChange}
              />
            </Button>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>
        
        {/* Avatar - Positioned to overlap banner and content */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background bg-primary ring-4 ring-primary/20">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt={username} />
              ) : (
                <AvatarFallback className="text-5xl font-heading">{getInitials(username)}</AvatarFallback>
              )}
            </Avatar>
            
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 rounded-full h-8 w-8"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* User Identity - Centered below avatar */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{username}</h1>
        <div className="flex items-center justify-center text-gray-400 mb-2">
          <Medal className="h-5 w-5 mr-1" />
          <span className="text-lg">Level {level}</span>
        </div>
        
        {/* User status badges/stats */}
        <div className="flex justify-center gap-2 flex-wrap mt-3">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
            {formatCurrency(cash)}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter">
            <Award className="h-4 w-4 mr-1 text-primary" />
            {respect.toLocaleString()} Respect
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter">
            <Briefcase className="h-4 w-4 mr-1 text-amber-500" />
            Mafia Boss
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter">
            <Users className="h-4 w-4 mr-1 text-blue-500" />
            Crew: 6 Members
          </Badge>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - User Bio and Stats */}
        <div className="xl:col-span-1 space-y-6">
          {/* Bio Card */}
          <Card className="bg-dark-surface border-primary/20 overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" /> About
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isEditing ? (
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="resize-none bg-dark-lighter min-h-[120px]"
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  {bio ? (
                    <p>{bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No bio provided yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Character Stats Card */}
          <Card className="bg-dark-surface border-primary/20">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" /> Character Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* XP Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Level Progress</span>
                    <span className="text-gray-400">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
                  </div>
                  <Progress 
                    value={xpProgress} 
                    className="h-2.5" 
                    indicatorClassName="bg-gradient-to-r from-primary to-purple-600" 
                  />
                </div>
                
                <div className="space-y-3.5 mt-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <Dumbbell className="h-4 w-4 mr-1 text-red-500" /> Strength
                      </span>
                      <span className="text-sm font-mono">{stats.strength}/100</span>
                    </div>
                    <Progress value={stats.strength} className="h-1.5" indicatorClassName="bg-red-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <Footprints className="h-4 w-4 mr-1 text-green-500" /> Stealth
                      </span>
                      <span className="text-sm font-mono">{stats.stealth}/100</span>
                    </div>
                    <Progress value={stats.stealth} className="h-1.5" indicatorClassName="bg-green-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <SmilePlus className="h-4 w-4 mr-1 text-blue-500" /> Charisma
                      </span>
                      <span className="text-sm font-mono">{stats.charisma}/100</span>
                    </div>
                    <Progress value={stats.charisma} className="h-1.5" indicatorClassName="bg-blue-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <BookOpen className="h-4 w-4 mr-1 text-yellow-500" /> Intelligence
                      </span>
                      <span className="text-sm font-mono">{stats.intelligence}/100</span>
                    </div>
                    <Progress value={stats.intelligence} className="h-1.5" indicatorClassName="bg-yellow-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Theme Control - Only in edit mode */}
          {isEditing && (
            <Card className="bg-dark-surface border-primary/20">
              <CardHeader className="pb-2 border-b border-border/30">
                <CardTitle className="text-lg flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-primary" /> Profile Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Profile Theme */}
                  <div>
                    <Label htmlFor="theme" className="mb-2 block">Profile Theme</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['dark', 'noir', 'mafia', 'elegant', 'vintage'].map((theme) => (
                        <Button
                          key={theme}
                          type="button"
                          variant={profileTheme === theme ? "default" : "outline"}
                          onClick={() => setProfileTheme(theme)}
                          className={cn(
                            "h-10 capitalize",
                            profileTheme === theme && "border-2 border-primary"
                          )}
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          {theme}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show Achievements Toggle */}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <Label htmlFor="show-achievements" className="text-sm font-medium">
                        Show Achievements
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Allow others to see your achievements
                      </p>
                    </div>
                    <Switch
                      id="show-achievements"
                      checked={showAchievements}
                      onCheckedChange={setShowAchievements}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main showcase area */}
        <div className="xl:col-span-3 space-y-8">
          {/* HTML Profile Showcase */}
          <Card className="bg-dark-surface border-primary/20 overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <PenTool className="h-5 w-5 mr-2 text-primary" /> 
                  Showcase
                </div>
                {isEditing && (
                  <Badge variant="outline" className="text-xs">HTML Enabled</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isEditing ? (
                <div className="p-4">
                  <RichTextEditor 
                    value={htmlProfile} 
                    onChange={setHtmlProfile}
                    placeholder="Create your custom profile showcase here..."
                    className="bg-dark-surface"
                  />
                </div>
              ) : (
                htmlProfile ? (
                  <div 
                    className="profile-html-content p-6"
                    dangerouslySetInnerHTML={{ __html: htmlProfile }}
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <PenTool className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <h3 className="text-lg font-medium mb-2">Your Custom Showcase</h3>
                    <p>This is where you can display your custom showcase. Click "Edit Profile" to personalize it.</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
          
          {/* Featured Achievements */}
          <Card className="bg-dark-surface border-primary/20">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-lg flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" /> Featured Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Achievement Cards */}
                {[
                  { name: "First Blood", icon: <Award />, rarity: "Common", date: "2023-05-15" },
                  { name: "Mastermind", icon: <Award />, rarity: "Rare", date: "2023-06-20" },
                  { name: "Kingpin", icon: <Award />, rarity: "Epic", date: "2023-07-10" },
                  { name: "Untouchable", icon: <Award />, rarity: "Legendary", date: "2023-08-05" },
                ].map((achievement, i) => (
                  <div key={i} className="relative group overflow-hidden">
                    <div className="bg-dark-lighter rounded-lg p-4 text-center transition-all duration-200 group-hover:bg-dark-lighter/80 border border-border/50 group-hover:border-primary/50">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20">
                        {achievement.icon}
                      </div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <div className="mt-2 flex items-center justify-center">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            achievement.rarity === "Common" && "bg-gray-700/50",
                            achievement.rarity === "Rare" && "bg-blue-700/50",
                            achievement.rarity === "Epic" && "bg-purple-700/50",
                            achievement.rarity === "Legendary" && "bg-amber-700/50",
                          )}
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Feed and Tabs - More Compact */}
          <Card className="bg-dark-surface border-primary/20">
            <CardHeader className="pb-0 pt-4">
              <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="crimes">Crime History</TabsTrigger>
                  <TabsTrigger value="achievements">All Achievements</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              {activeTab === 'activity' && (
                <div>
                  <ActivityTable activities={allActivities} />
                </div>
              )}

              {activeTab === 'crimes' && (
                <div>
                  {crimeHistory?.length > 0 ? (
                    <div className="space-y-3">
                      {crimeHistory.map((crime: any) => (
                        <div key={crime.id} className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium">{crime.name}</h4>
                            <Badge variant={crime.successRate > 50 ? "success" : "default"} className="text-xs">
                              {crime.successRate}% Success
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{crime.description}</p>
                          {crime.lastPerformed && (
                            <div className="text-xs text-muted-foreground flex items-center justify-between">
                              <span>{new Date(crime.lastPerformed.timestamp).toLocaleString()}</span>
                              {crime.lastPerformed.success && (
                                <span className="text-green-500">
                                  +${crime.lastPerformed.cashReward} | +{crime.lastPerformed.xpReward} XP
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No crimes performed yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {/* Sample achievements */}
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="border border-border/50 rounded-lg p-3 text-center hover:border-primary/30 transition-all duration-200">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Award className="h-6 w-6 text-primary/80" />
                        </div>
                        <h4 className="font-medium text-sm">Achievement {i+1}</h4>
                        <p className="text-xs text-muted-foreground mt-1">10% of players have this</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Custom CSS for the HTML showcase */}
      <style jsx global>{`
        .profile-html-content {
          max-width: 100%;
          overflow-x: hidden;
        }
        
        .profile-html-content img {
          max-width: 100%;
          height: auto;
        }
        
        .profile-page.noir {
          --page-bg: #0a0a0a;
          --card-bg: #141414;
          --border-color: rgba(255,255,255,0.05);
        }
        
        .profile-page.mafia {
          --primary-color: #b8860b;
          --accent-color: #8b4513;
        }
        
        .profile-page.elegant {
          --primary-color: #9370db;
          --accent-color: #4b0082;
        }
        
        .profile-page.vintage {
          --primary-color: #cd853f;
          --accent-color: #8b4513;
          --card-bg: #1c1917;
          --border-color: rgba(205,133,63,0.2);
        }
      `}</style>
    </div>
  );
}