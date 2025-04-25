import { useQuery, useMutation } from "@tanstack/react-query";
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
  Trash2
} from "lucide-react";
import { formatCurrency, getInitials, calculateLevelProgress } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });
  
  const { data: crimeHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

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

  if (profileLoading) {
    return (
      <>
        <PageHeader 
          title="Your Profile" 
          icon={<User className="h-5 w-5" />}
          description="View your character stats and activity"
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <PageHeader 
          title="Your Profile" 
          icon={<User className="h-5 w-5" />}
          description="View your character stats and activity"
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400">Failed to load profile data</p>
          </div>
        </div>
      </>
    );
  }

  const { username, level, xp, cash, respect, stats } = userProfile;
  const nextLevelXp = userProfile.nextLevelXP || 100 * Math.pow(level, 2);
  const xpProgress = calculateLevelProgress(xp, nextLevelXp);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [bio, setBio] = useState(userProfile.bio || "");
  const [htmlProfile, setHtmlProfile] = useState(userProfile.htmlProfile || "");
  const [showAchievements, setShowAchievements] = useState(userProfile.showAchievements !== false);
  const [profileTheme, setProfileTheme] = useState(userProfile.profileTheme || "dark");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.bannerImage || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    <>
      <PageHeader 
        title="Your Profile" 
        icon={<User className="h-5 w-5" />}
        description="View your character stats and activity"
        action={
          isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Cancel
              </Button>
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
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <FileEdit className="h-4 w-4" /> Edit Profile
            </Button>
          )
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardContent className="pt-6 relative">
              {/* Banner Image */}
              <div 
                className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/30 to-accent/30 overflow-hidden rounded-t-lg"
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
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Image className="h-4 w-4" />
                    <input
                      type="file"
                      ref={bannerInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleBannerChange}
                    />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col items-center text-center mb-6 mt-16">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background mb-4 bg-primary">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt={username} />
                    ) : (
                      <AvatarFallback className="text-3xl font-heading">{getInitials(username)}</AvatarFallback>
                    )}
                  </Avatar>
                  
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-4 right-0 bg-black/50 hover:bg-black/70 rounded-full h-8 w-8"
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
                
                <h2 className="text-2xl font-medium mb-1">{username}</h2>
                <div className="flex items-center text-gray-400">
                  <Medal className="h-4 w-4 mr-1" />
                  <span>Level {level}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* XP Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Level Progress</span>
                    <span className="text-gray-400">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 gap-3 bg-dark-lighter p-3 rounded-md">
                  <div className="text-center p-2">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-lg font-medium">{formatCurrency(cash)}</div>
                    <div className="text-xs text-gray-400">Cash</div>
                  </div>
                  <div className="text-center p-2">
                    <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-medium">{respect.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Respect</div>
                  </div>
                  <div className="text-center p-2">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-lg font-medium">48h</div>
                    <div className="text-xs text-gray-400">Play Time</div>
                  </div>
                  <div className="text-center p-2">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <div className="text-lg font-medium">85</div>
                    <div className="text-xs text-gray-400">Actions</div>
                  </div>
                </div>

                {/* Character Stats */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Character Stats
                  </h3>
                  <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Settings */}
          {isEditing && (
            <Card className="bg-dark-surface">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileEdit className="h-5 w-5 mr-2" /> Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio" className="mb-2 block">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      className="resize-none bg-dark-lighter"
                    />
                  </div>
                  
                  {/* Profile Theme */}
                  <div>
                    <Label htmlFor="theme" className="mb-2 block">Profile Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['dark', 'noir', 'mafia'].map((theme) => (
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
                  <div className="flex items-center justify-between">
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
          
          {/* HTML Profile Editor */}
          {isEditing && (
            <Card className="bg-dark-surface">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <PenTool className="h-5 w-5 mr-2" /> HTML Profile
                </CardTitle>
                <CardDescription>
                  Use HTML to customize your profile page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea 
                    value={htmlProfile} 
                    onChange={(e) => setHtmlProfile(e.target.value)}
                    placeholder="<h1>Welcome to my profile!</h1>"
                    className="min-h-[200px] font-mono text-sm bg-dark-lighter"
                  />
                  <div className="text-xs text-muted-foreground">
                    <p>Allowed HTML tags: h1, h2, h3, p, div, span, b, i, u, a, ul, ol, li, img, hr</p>
                    <p>Example: <code>&lt;h1&gt;My Gang&lt;/h1&gt; &lt;p&gt;I've been a member since 2025&lt;/p&gt;</code></p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-dark-lighter text-xs p-2">
                <div className="flex w-full flex-col space-y-1">
                  <div className="flex items-center text-yellow-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-7.25 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>HTML content is restricted for security reasons</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* HTML Profile Display */}
          {!isEditing && userProfile.htmlProfile && (
            <Card className="bg-dark-surface">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <PenTool className="h-5 w-5 mr-2" /> Custom Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: userProfile.htmlProfile }}
                />
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Medal className="h-5 w-5 mr-2" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center">
                  <Briefcase className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Master Thief</div>
                  <div className="text-xs text-gray-400">50 successful crimes</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <Dumbbell className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Strong Arm</div>
                  <div className="text-xs text-gray-400">Reach 50 Strength</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <Users className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Gang Boss</div>
                  <div className="text-xs text-gray-400">Lead a gang of 5+ members</div>
                </div>
                <div className="bg-dark-lighter rounded-md p-3 text-center flex flex-col items-center opacity-50">
                  <DollarSign className="h-8 w-8 mb-2 text-secondary" />
                  <div className="text-sm font-medium">Millionaire</div>
                  <div className="text-xs text-gray-400">Accumulate $1,000,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity History */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-dark-lighter">
                  <TabsTrigger value="all">All Activity</TabsTrigger>
                  <TabsTrigger value="crimes">Crimes</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <ActivityTable activities={allActivities} loading={historyLoading} />
                </TabsContent>
                
                <TabsContent value="crimes">
                  <ActivityTable activities={crimeActivities || []} loading={historyLoading} />
                </TabsContent>
                
                <TabsContent value="training">
                  <ActivityTable activities={trainingActivities} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-dark-surface mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">42</div>
                  <div className="text-xs text-gray-400">Crimes Committed</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">78%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">3</div>
                  <div className="text-xs text-gray-400">Jail Sentences</div>
                </div>
                <div className="bg-dark-lighter p-3 rounded-md text-center">
                  <div className="text-2xl font-medium">{formatCurrency(15420)}</div>
                  <div className="text-xs text-gray-400">Total Earnings</div>
                </div>
              </div>

              <Separator className="my-6 bg-gray-700" />

              <h3 className="font-medium mb-4">Crime Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-green-500" />
                    </div>
                    <span>Pickpocket a Tourist</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">28 times</div>
                    <div className="text-xs text-gray-400">92% success</div>
                  </div>
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-yellow-500" />
                    </div>
                    <span>Break into a Car</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">12 times</div>
                    <div className="text-xs text-gray-400">75% success</div>
                  </div>
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center mr-2">
                      <Briefcase className="h-4 w-4 text-red-500" />
                    </div>
                    <span>Rob a Convenience Store</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">2 times</div>
                    <div className="text-xs text-gray-400">50% success</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
