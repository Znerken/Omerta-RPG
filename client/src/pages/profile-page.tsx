import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/profile/UserAvatar";
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

// Import our shared FriendActionButton component from social components
import { FriendActionButton as SharedFriendActionButton } from "@/components/social/FriendActionButton";

// Wrapper component to adapt the shared component to the profile page styling
function FriendActionButton({ profile }: { profile: any }) {
  // Adapt our shared component with profile page specific styling
  return (
    <SharedFriendActionButton
      userId={profile.id}
      friendStatus={profile.friendStatus}
      friendRequest={profile.friendRequest}
      size="sm"
      variant="outline"
      onActionComplete={() => {
        // This will be called after any friend action is completed
      }}
    />
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

  // Special Billie Eilish themed profile for extortionist
  const billieEilishProfile = `<div style="font-family: 'Inter', sans-serif; background-color: #0D0D0D; color: #e1e1e1; padding: 0; margin: 0; position: relative; overflow: hidden;">
  <!-- Billie-inspired main container -->
  <div style="position: relative; overflow: hidden; border-radius: 12px; background: linear-gradient(145deg, #111111, #050505); box-shadow: 0 8px 32px rgba(0, 255, 100, 0.1);">
    
    <!-- Animated neon accent -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #00ff6a, #003e19, #00ff6a); background-size: 200% 100%; animation: neonFlow 3s linear infinite;"></div>
    
    <!-- Header with Billie-style imagery -->
    <div style="background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url('https://i.imgur.com/8cNtGuL.jpg'); background-size: cover; background-position: center; height: 320px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; padding: 25px; border-bottom: 1px solid rgba(0, 255, 100, 0.3);">
      
      <!-- Overlay vignette -->
      <div style="position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 30%, #000000 100%); z-index: 1;"></div>
      
      <!-- Glitchy title -->
      <div style="position: relative; z-index: 2; margin-bottom: 70px; text-align: center;">
        <h1 style="font-size: 4em; font-weight: 900; margin: 0; position: relative; display: inline-block; letter-spacing: -1px; text-transform: uppercase; color: transparent; background: linear-gradient(90deg, #00ff6a, #00ffa3, #00ffb7, #00a3ff, #00ff6a); background-size: 400% 100%; -webkit-background-clip: text; text-shadow: 0 0 10px rgba(0, 255, 100, 0.5); animation: titleFlow 10s linear infinite;">EXTORTIONIST</h1>
        <h2 style="font-size: 1.2em; margin: 10px 0 0; opacity: 0.7; font-style: italic; font-weight: 400; letter-spacing: 3px;">&ldquo;Don't say I didn't warn ya&rdquo;</h2>
      </div>
      
      <!-- Neon stats banner -->
      <div style="position: relative; z-index: 2; display: flex; justify-content: space-around; background-color: rgba(0, 0, 0, 0.7); padding: 15px; border-radius: 8px; border: 1px solid rgba(0, 255, 100, 0.3); box-shadow: 0 0 20px rgba(0, 255, 100, 0.2); backdrop-filter: blur(5px);">
        <div style="text-align: center;">
          <div style="font-size: 1.5em; font-weight: 700; color: #00ff6a;">100%</div>
          <div style="font-size: 0.8em; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6;">Stealth</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.5em; font-weight: 700; color: #00ff6a;">$10M+</div>
          <div style="font-size: 0.8em; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6;">Assets</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.5em; font-weight: 700; color: #00ff6a;">Level 73</div>
          <div style="font-size: 0.8em; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6;">Reputation</div>
        </div>
      </div>
    </div>
    
    <!-- Profile content -->
    <div style="padding: 30px 25px; position: relative;">
      <!-- Lyrics Quote section with Billie Eilish "You Should See Me In A Crown" lyrics -->
      <div style="margin-bottom: 30px; position: relative; padding: 25px; border-radius: 8px; background-color: rgba(0, 0, 0, 0.3); border-left: 3px solid #00ff6a;">
        <p style="font-size: 1.1em; font-style: italic; margin: 0; line-height: 1.6;">
          "You should see me in a crown, I'm gonna run this nothing town<br>
          Watch me make 'em bow, one by one by one<br>
          Count my cards, watch them fall<br>
          Blood on a marble wall"
        </p>
        <div style="margin-top: 10px; text-align: right; opacity: 0.7; font-size: 0.9em;">— You Should See Me In A Crown</div>
      </div>
      
      <!-- Two-column layout -->
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <!-- Left column -->
        <div style="flex: 1; min-width: 300px;">
          <h3 style="font-size: 1.3em; margin-top: 0; border-bottom: 1px solid rgba(0, 255, 100, 0.3); padding-bottom: 10px; color: #00ff6a;">THE EMPIRE</h3>
          
          <!-- Skills grid -->
          <div style="margin-bottom: 25px;">
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">Influence</span>
                <span style="font-size: 0.9em;">92%</span>
              </div>
              <div style="height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 92%; background: linear-gradient(90deg, #00ff6a, #00d9ff); border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">Strategy</span>
                <span style="font-size: 0.9em;">88%</span>
              </div>
              <div style="height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 88%; background: linear-gradient(90deg, #00ff6a, #00d9ff); border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">Connections</span>
                <span style="font-size: 0.9em;">95%</span>
              </div>
              <div style="height: 8px; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 95%; background: linear-gradient(90deg, #00ff6a, #00d9ff); border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          
          <!-- Territory -->
          <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #00ff6a; font-size: 1.1em;">CONTROLLED TERRITORIES</h4>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between;">
                <span>Downtown District</span>
                <span style="color: #00ff6a;">100%</span>
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between;">
                <span>Harbor Area</span>
                <span style="color: #00ff6a;">85%</span>
              </li>
              <li style="padding: 8px 0; display: flex; justify-content: space-between;">
                <span>West Side</span>
                <span style="color: #00ff6a;">73%</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Right column -->
        <div style="flex: 1; min-width: 300px;">
          <h3 style="font-size: 1.3em; margin-top: 0; border-bottom: 1px solid rgba(0, 255, 100, 0.3); padding-bottom: 10px; color: #00ff6a;">OPERATIONS</h3>
          
          <!-- Business ventures -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; margin-bottom: 25px;">
            <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid rgba(0, 255, 100, 0.1);">
              <div style="font-size: 2em; margin-bottom: 10px; color: #00ff6a;">🏛️</div>
              <div style="font-size: 0.9em; font-weight: 600;">Banking</div>
              <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px;">Money laundering</div>
            </div>
            
            <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid rgba(0, 255, 100, 0.1);">
              <div style="font-size: 2em; margin-bottom: 10px; color: #00ff6a;">🎲</div>
              <div style="font-size: 0.9em; font-weight: 600;">Casino</div>
              <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px;">Revenue stream</div>
            </div>
            
            <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid rgba(0, 255, 100, 0.1);">
              <div style="font-size: 2em; margin-bottom: 10px; color: #00ff6a;">🏢</div>
              <div style="font-size: 0.9em; font-weight: 600;">Real Estate</div>
              <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px;">Asset control</div>
            </div>
            
            <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center; border: 1px solid rgba(0, 255, 100, 0.1);">
              <div style="font-size: 2em; margin-bottom: 10px; color: #00ff6a;">🔒</div>
              <div style="font-size: 0.9em; font-weight: 600;">Security</div>
              <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px;">Protection</div>
            </div>
          </div>
          
          <!-- Recent exploits -->
          <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #00ff6a; font-size: 1.1em;">LATEST ACHIEVEMENTS</h4>
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="font-weight: 600;">Metropolitan Bank Heist</div>
              <div style="font-size: 0.8em; opacity: 0.7; margin-top: 3px;">The perfect crime. No traces left behind.</div>
            </div>
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="font-weight: 600;">Rival Territory Acquisition</div>
              <div style="font-size: 0.8em; opacity: 0.7; margin-top: 3px;">Expanded influence to the east coast.</div>
            </div>
            <div>
              <div style="font-weight: 600;">Information Network Expansion</div>
              <div style="font-size: 0.8em; opacity: 0.7; margin-top: 3px;">Eyes and ears in every corner of the city.</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom quote with Billie-inspired design -->
      <div style="margin-top: 20px; padding: 25px; border-radius: 8px; background: url('https://i.imgur.com/EfxovUc.jpg'); background-size: cover; background-position: center; position: relative; overflow: hidden;">
        <!-- Overlay -->
        <div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.75);"></div>
        
        <div style="position: relative; z-index: 1;">
          <p style="font-size: 1.2em; font-style: italic; margin: 0 0 10px; line-height: 1.6; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);">
            "Bite my tongue, bide my time<br>
            Wearing a warning sign<br>
            Wait 'til the world is mine<br>
            Visions I vandalize<br>
            Cold in my kingdom size"
          </p>
          <div style="text-align: right; opacity: 0.7; font-size: 0.9em;">— Extortionist's Code</div>
        </div>
      </div>
    </div>
    
    <!-- Footer with Billie-inspired styling -->
    <div style="padding: 20px; text-align: center; background-color: #000000; border-top: 1px solid rgba(0, 255, 100, 0.3);">
      <div style="opacity: 0.5; font-size: 0.8em; letter-spacing: 1px;">"YOU SHOULD SEE ME IN A CROWN" • OMERTÀ • ESTABLISHED 2025</div>
    </div>
  </div>
  
  <!-- Animations -->
  <style>
    @keyframes neonFlow {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    
    @keyframes titleFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  </style>
</div>`;

  // Update state values when profile data loads
  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || "");

      // Set special HTML profile for extortionist
      if (userProfile.username && userProfile.username.toLowerCase() === "extortionist" && !userProfile.htmlProfile) {
        setHtmlProfile(billieEilishProfile);
      } else {
        setHtmlProfile(userProfile.htmlProfile || "");
      }
      
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
      
      {/* Avatar centered without banner - Banner moved to showcase section */}
      <div className="relative w-full mb-10 flex justify-center">
        <div className="relative">
          <div className="relative perspective-1000">
            {/* Decorative circular frame around avatar */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-secondary/30 to-primary/30 blur-md"></div>
            
            <UserAvatar 
              username={username} 
              avatarUrl={avatarPreview || userProfile.avatar} 
              size="xl" 
              linkToProfile={false}
              withBorder={true}
              withRing={true}
              borderColor="border-background"
              ringColor="ring-primary/30"
              className="shadow-lg relative z-10"
            />
            
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 rounded-full h-8 w-8 z-20"
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
      
      {/* User Identity - Centered below avatar with enhanced styling */}
      <div className="text-center mb-8">
        {/* Apply rank-based styling to username with special effects for Extortionist */}
        <h1 className={`text-3xl font-bold mb-1 omerta-profile-name ${
          username.toLowerCase() === "extortionist" ? "extortionist-name" :
          userProfile.rank === "Boss" || (userProfile.gangRank === "Boss") ? "rank-boss-name" : 
          userProfile.rank === "Capo" || (userProfile.gangRank === "Capo") ? "rank-capo-name" : 
          userProfile.rank === "Soldier" || (userProfile.gangRank === "Soldier") ? "rank-soldier-name" : 
          "rank-associate-name"
        }`}>
          {username}
          
          {/* Flame particles for extortionist only */}
          {username.toLowerCase() === "extortionist" && (
            <div className="absolute left-0 right-0 bottom-0 top-[-5px] pointer-events-none overflow-hidden">
              {Array.from({ length: 15 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flame-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}
        </h1>
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
                    <Progress value={stats.strength} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-red-700 to-red-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <Footprints className="h-4 w-4 mr-1 text-green-500" /> Stealth
                      </span>
                      <span className="text-sm font-mono">{stats.stealth}/100</span>
                    </div>
                    <Progress value={stats.stealth} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-green-700 to-green-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <SmilePlus className="h-4 w-4 mr-1 text-blue-500" /> Charisma
                      </span>
                      <span className="text-sm font-mono">{stats.charisma}/100</span>
                    </div>
                    <Progress value={stats.charisma} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-blue-700 to-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center text-gray-300">
                        <BookOpen className="h-4 w-4 mr-1 text-yellow-500" /> Intelligence
                      </span>
                      <span className="text-sm font-mono">{stats.intelligence}/100</span>
                    </div>
                    <Progress value={stats.intelligence} className="h-1.5 progress-bar-animated" indicatorClassName="bg-gradient-to-r from-yellow-700 to-yellow-500" />
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
          {/* Banner moved to here - Above showcase */}
          <div className="relative w-full mb-6">
            {/* Banner Image - Full width with enhanced styling */}
            <div 
              className="omerta-profile-banner w-full bg-gradient-to-r from-primary/30 to-accent/30 rounded-sm"
              style={{
                backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Animated glowing edge effect */}
              <div className="omerta-profile-banner-glow"></div>
              {/* Animated overlay pattern */}
              <div className="absolute inset-0 bg-black/10 film-grain"></div>
              
              {/* Decorative frame for banner */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-secondary/50 to-transparent"></div>
              <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-secondary/50 to-transparent"></div>
              
              {/* Banner corner decorations */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary/40"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary/40"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-secondary/40"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary/40"></div>
              
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 z-10"
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
            </div>
          </div>
          
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