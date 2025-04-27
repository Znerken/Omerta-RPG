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
import { PhotoGalleryGenerator } from "@/components/profile/PhotoGalleryGenerator";
import { 
  ProfileCustomizationButton, 
  ProfileCustomizationDialog,
  AVATAR_FRAMES,
  PROFILE_THEMES,
  NAME_EFFECTS,
  BACKGROUND_EFFECTS,
  type AvatarFrame,
  type ProfileTheme,
  type NameEffect,
  type BackgroundEffect,
  getNameEffectStyles 
} from "@/components/profile/ProfileCustomization";
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
  UserCheck,
  Music as MusicIcon
} from "lucide-react";
import { formatCurrency, getInitials, calculateLevelProgress } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
// ProfileCustomization components already imported above

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
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Load profile customization settings from localStorage
  const loadCustomizationSettings = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Framework ID
      const savedFrameId = localStorage.getItem('profile-frame');
      const frameToUse = savedFrameId 
        ? AVATAR_FRAMES.find(frame => frame.id === savedFrameId) 
        : AVATAR_FRAMES.find(frame => frame.id === 'classic');
      
      // Profile Theme
      const savedThemeId = localStorage.getItem('profile-theme');
      const themeToUse = savedThemeId 
        ? PROFILE_THEMES.find(theme => theme.id === savedThemeId) 
        : PROFILE_THEMES.find(theme => theme.id === 'dark');
      
      // Name Effect
      const savedNameEffectId = localStorage.getItem('profile-name-effect');
      const nameEffectToUse = savedNameEffectId 
        ? NAME_EFFECTS.find(effect => effect.id === savedNameEffectId) 
        : NAME_EFFECTS.find(effect => effect.id === 'none');
      
      // Background Effect
      const savedBgEffectId = localStorage.getItem('profile-bg-effect');
      const bgEffectToUse = savedBgEffectId 
        ? BACKGROUND_EFFECTS.find(effect => effect.id === savedBgEffectId) 
        : BACKGROUND_EFFECTS.find(effect => effect.id === 'none');
      
      return {
        frame: frameToUse || AVATAR_FRAMES[0],
        theme: themeToUse || PROFILE_THEMES[0],
        nameEffect: nameEffectToUse || NAME_EFFECTS[0],
        bgEffect: bgEffectToUse || BACKGROUND_EFFECTS[0]
      };
    } catch (error) {
      console.error("Error loading customization settings:", error);
      return null;
    }
  };
  
  // Profile customization state - load from localStorage or use defaults
  const savedSettings = loadCustomizationSettings();
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrame>(
    savedSettings?.frame || AVATAR_FRAMES.find(frame => frame.id === 'classic') || AVATAR_FRAMES[0]
  );
  const [selectedProfileTheme, setSelectedProfileTheme] = useState<ProfileTheme>(
    savedSettings?.theme || PROFILE_THEMES.find(theme => theme.id === 'dark') || PROFILE_THEMES[0]
  );
  const [selectedNameEffect, setSelectedNameEffect] = useState<NameEffect>(
    savedSettings?.nameEffect || NAME_EFFECTS.find(effect => effect.id === 'none') || NAME_EFFECTS[0]
  );
  const [selectedBgEffect, setSelectedBgEffect] = useState<BackgroundEffect>(
    savedSettings?.bgEffect || BACKGROUND_EFFECTS.find(effect => effect.id === 'none') || BACKGROUND_EFFECTS[0]
  );
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  
  // Mutation for saving customization settings
  const saveCustomizationMutation = useMutation({
    mutationFn: async (customizationData: any) => {
      const res = await apiRequest("PATCH", "/api/user/customization", customizationData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Customization saved",
        description: "Your profile customization settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save customization",
        description: error.message || "There was an error saving your customization settings.",
        variant: "destructive",
      });
    },
  });
  
  // Save profile customization settings
  const saveCustomization = () => {
    if (!isViewingOwnProfile) return;
    
    const customizationData = {
      frameId: selectedFrame.id,
      themeId: selectedProfileTheme.id,
      nameEffectId: selectedNameEffect.id,
      backgroundEffectId: selectedBgEffect.id
    };
    
    // In a real implementation with server support, we would persist this:
    // saveCustomizationMutation.mutate(customizationData);
    
    // Until we set up the API endpoints, we'll use localStorage for persistence
    localStorage.setItem('userCustomization', JSON.stringify(customizationData));
    
    toast({
      title: "Profile customization saved",
      description: "Your profile customization settings have been updated.",
    });
  };
  
  // Load saved customization from localStorage on initial render
  useEffect(() => {
    if (isViewingOwnProfile) {
      const savedCustomization = localStorage.getItem('userCustomization');
      if (savedCustomization) {
        try {
          const customization = JSON.parse(savedCustomization);
          
          // Apply saved customization
          if (customization.frameId) {
            const frame = AVATAR_FRAMES.find(f => f.id === customization.frameId);
            if (frame) setSelectedFrame(frame);
          }
          
          if (customization.themeId) {
            const theme = PROFILE_THEMES.find(t => t.id === customization.themeId);
            if (theme) setSelectedProfileTheme(theme);
          }
          
          if (customization.nameEffectId) {
            const effect = NAME_EFFECTS.find(e => e.id === customization.nameEffectId);
            if (effect) setSelectedNameEffect(effect);
          }
          
          if (customization.backgroundEffectId) {
            const bgEffect = BACKGROUND_EFFECTS.find(e => e.id === customization.backgroundEffectId);
            if (bgEffect) setSelectedBgEffect(bgEffect);
          }
        } catch (e) {
          console.error("Error loading saved customization", e);
        }
      }
    }
  }, [isViewingOwnProfile]);
  
  // Function to apply Billie Eilish theme
  const applyBillieEilishTheme = () => {
    setHtmlProfile(billieEilishProfile);
    setProfileTheme("mafia");
    toast({
      title: "Billie Eilish theme applied",
      description: "You should see me in a crown...",
      variant: "default"
    });
  };
  
  // Function to apply generated photo gallery template
  const handlePhotoGalleryGenerate = async (htmlTemplate: string) => {
    setHtmlProfile(htmlTemplate);
    setProfileTheme("dark");
    setIsPhotoGalleryOpen(false);
    
    // Save the new profile to the server immediately
    try {
      await updateProfileMutation.mutateAsync({
        bio,
        htmlProfile: htmlTemplate,
        showAchievements,
        profileTheme: "dark",
      });
      
      toast({
        title: "Photo Gallery template applied",
        description: "Your custom photo gallery has been saved to your profile",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "The template was created but could not be saved to your profile",
        variant: "destructive"
      });
    }
  };
  
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
    
    <!-- Main banner with all profile info -->
    <div style="position: relative; width: 100%; height: 400px; overflow: hidden; border-bottom: 1px solid rgba(0, 255, 100, 0.3);">
      <!-- Dark gradient overlay for better text readability -->
      <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)); z-index: 2;"></div>
      
      <!-- Banner image with Billie Eilish - stretched and positioned for dramatic effect -->
      <div style="position: absolute; inset: 0; background: url('https://i.pinimg.com/736x/d4/73/6b/d4736bb3b71fa79e6b8aae7e5182787a.jpg') center/cover; z-index: 1; filter: brightness(0.7);"></div>
      
      <!-- User profile content -->
      <div style="position: relative; z-index: 3; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding: 30px;">
        <!-- Avatar circle within the banner -->
        <div style="position: absolute; right: 50px; top: 60px; width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 3px solid #ff2d55; outline: 1px solid rgba(255, 45, 85, 0.4); outline-offset: 2px;">
          <img src="https://i.pinimg.com/736x/29/1d/70/291d7007c84a0ae18c950f3d1621e4af.jpg" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        
        <!-- Username with dramatic effect -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 4rem; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 5px; color: #ff2d55; outline: 1px solid #ff2d55; outline-offset: 5px; padding: 10px; display: inline-block;">
            EXTORTIONIST
          </h2>
          
          <!-- Level indicator -->
          <div style="display: flex; align-items: center; justify-content: center; margin-top: 10px;">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 5px;">
              <path d="M10 0L12.2451 6.90983H19.5106L13.6327 11.1803L15.8779 18.0902L10 13.8197L4.12215 18.0902L6.36729 11.1803L0.489435 6.90983H7.75486L10 0Z" fill="#ff9500"/>
            </svg>
            <span style="color: #ff9500; font-weight: bold; font-size: 1.2rem;">Level 12</span>
          </div>
        </div>
        
        <!-- Status indicators row -->
        <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
          <!-- Money counter -->
          <div style="background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; display: flex; align-items: center; border: 1px solid rgba(0, 255, 0, 0.3);">
            <span style="color: #00cc00; margin-right: 5px; font-size: 1.2rem;">$</span>
            <span style="color: #fff; font-weight: bold;">9,043,354</span>
          </div>
          
          <!-- Respect counter -->
          <div style="background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; display: flex; align-items: center; border: 1px solid rgba(255, 45, 85, 0.3);">
            <span style="color: #ff2d55; margin-right: 5px; font-size: 1.2rem;">⚔️</span>
            <span style="color: #fff; font-weight: bold;">125 Respect</span>
          </div>
          
          <!-- Mafia rank -->
          <div style="background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; display: flex; align-items: center; border: 1px solid rgba(255, 165, 0, 0.3);">
            <span style="color: #ff9500; margin-right: 5px; font-size: 1.2rem;">👑</span>
            <span style="color: #fff; font-weight: bold;">Mafia Boss</span>
          </div>
          
          <!-- Crew counter -->
          <div style="background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; display: flex; align-items: center; border: 1px solid rgba(100, 100, 255, 0.3);">
            <span style="color: #6464ff; margin-right: 5px; font-size: 1.2rem;">👥</span>
            <span style="color: #fff; font-weight: bold;">Crew: 6 Members</span>
          </div>
        </div>
        
        <!-- Stat bars -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 10px;">
          <!-- Strength stat -->
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 0.9rem; color: #ff9500; text-transform: uppercase; font-weight: bold;">Strength</span>
              <span style="font-size: 0.9rem; color: #fff;">100/100</span>
            </div>
            <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: 100%; background: linear-gradient(90deg, #ff2d55, #ff9500);"></div>
            </div>
          </div>
          
          <!-- Stealth stat -->
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 0.9rem; color: #ff9500; text-transform: uppercase; font-weight: bold;">Stealth</span>
              <span style="font-size: 0.9rem; color: #fff;">100/100</span>
            </div>
            <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: 100%; background: linear-gradient(90deg, #ff2d55, #ff9500);"></div>
            </div>
          </div>
          
          <!-- Intelligence stat -->
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 0.9rem; color: #ff9500; text-transform: uppercase; font-weight: bold;">Intelligence</span>
              <span style="font-size: 0.9rem; color: #fff;">100/100</span>
            </div>
            <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: 100%; background: linear-gradient(90deg, #ff2d55, #ff9500);"></div>
            </div>
          </div>
          
          <!-- Charisma stat -->
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 0.9rem; color: #ff9500; text-transform: uppercase; font-weight: bold;">Charisma</span>
              <span style="font-size: 0.9rem; color: #fff;">100/100</span>
            </div>
            <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: 100%; background: linear-gradient(90deg, #ff2d55, #ff9500);"></div>
            </div>
          </div>
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

  // Get the theme classes based on selected theme from customization
  const getProfileThemeClasses = () => {
    // Use selected theme from customization if available
    const effectiveTheme = selectedProfileTheme?.id || profileTheme;
    
    switch (effectiveTheme) {
      case 'noir':
        return 'profile-page noir';
      case 'mafia':
        return 'profile-page mafia';
      case 'elegant':
        return 'profile-page elegant';
      case 'vintage':
        return 'profile-page vintage';
      default:
        return 'profile-page';
    }
  };

  return (
    <div className={getProfileThemeClasses()}>
      {/* Add CSS for name effects - removed manual styles in favor of reusing the classes */}
      {/* The rainbow and other effects are now handled by the CSS classes directly */}
      {/* Floating action buttons for save/cancel during edit mode only */}
      {isViewingOwnProfile && isEditing && (
        <div className="fixed top-20 right-6 z-50">
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
        </div>
      )}
      
      {/* Other user's profile - Show friend actions in floating button */}
      {!isViewingOwnProfile && (
        <div className="fixed top-20 right-6 z-50">
          <FriendActionButton profile={userProfile} />
        </div>
      )}
      
      {/* Integrated banner and profile section with overlapping elements */}
      <div className="relative w-full mb-14">
        {/* Enhanced Banner with Avatar and User Info Overlay */}
        <div 
          className="omerta-profile-banner w-full bg-gradient-to-r from-primary/30 to-accent/30 rounded-md overflow-hidden"
          style={{
            backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '260px',
          }}
        >
          {/* Animated glowing edge effect */}
          <div className="omerta-profile-banner-glow"></div>
          
          {/* Animated overlay pattern */}
          <div className="absolute inset-0 bg-black/20 film-grain"></div>
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          
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
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 z-10"
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
          
          {/* Centered Avatar that is positioned higher in the banner */}
          <div className="absolute left-1/2 top-1/3 transform -translate-x-1/2 z-20">
            <div className="relative">
              <div className="relative perspective-1000">
                {/* Position the customization button in top-right corner, only when logged in and viewing own profile */}
                {isViewingOwnProfile && !isEditing && (
                  <div className="absolute -top-2 -right-2 z-30">
                    <ProfileCustomizationButton 
                      onOpenCustomization={() => setIsCustomizationOpen(true)}
                    />
                  </div>
                )}
                
                {/* Standard glow only when no custom frame is selected */}
                {(!selectedFrame || !selectedFrame.glow) && (
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-secondary/30 to-primary/30 animate-pulse blur-md"></div>
                )}
                
                <UserAvatar 
                  username={username} 
                  avatarUrl={avatarPreview || userProfile.avatar} 
                  size="xl" 
                  linkToProfile={false}
                  withBorder={!selectedFrame} // Only use default border if no frame is selected
                  withRing={!selectedFrame} // Only use default ring if no frame is selected
                  borderColor="border-background"
                  ringColor="ring-primary/50"
                  frame={selectedFrame}
                  className="shadow-lg relative z-10 transform hover:scale-105 transition-transform duration-300"
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
          
          {/* User Identity - Positioned below the avatar within the banner */}
          <div className="absolute bottom-0 inset-x-0 pb-6 pt-10 text-center">
            {/* Apply name effect from customization, falling back to rank-based styling */}
            <h1 className={`text-4xl font-bold mb-2 omerta-profile-name relative z-10 ${
              selectedNameEffect?.cssClass || "text-foreground"
            }`}>
              {username}
              
              {/* Apply background effect if selected */}
              {selectedBgEffect?.id !== 'none' && selectedBgEffect?.cssClass && (
                <div className={`absolute left-0 right-0 bottom-0 top-[-10px] pointer-events-none overflow-hidden ${selectedBgEffect.cssClass}`}>
                  {selectedBgEffect.id === 'flames' && Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flame-particle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${0.8 + Math.random() * 1.5}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </h1>
            
            <div className="flex items-center justify-center text-white mb-2 relative z-10">
              <Medal className="h-5 w-5 mr-1 text-amber-400" />
              <span className="text-lg font-semibold">Level {level}</span>
            </div>
          </div>
        </div>
        
        {/* User stats badges - positioned below avatar for better visual flow */}
        <div className="flex justify-center gap-2 flex-wrap mt-16 mb-2">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
            {formatCurrency(cash)}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
            <Award className="h-4 w-4 mr-1 text-primary" />
            {respect.toLocaleString()} Respect
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
            <Briefcase className="h-4 w-4 mr-1 text-amber-500" />
            Mafia Boss
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-dark-lighter backdrop-blur-sm shadow-md">
            <Users className="h-4 w-4 mr-1 text-blue-500" />
            Crew: 6 Members
          </Badge>
          
          {/* Profile Action Buttons */}
          <div className="flex gap-2">
            {/* Customization Button */}
            {isViewingOwnProfile && (
              <Button
                size="sm"
                onClick={() => setIsCustomizationOpen(true)}
                variant="outline"
                className="flex items-center gap-1 bg-dark-lighter backdrop-blur-sm shadow-md hover:bg-black/70"
              >
                <Palette className="h-4 w-4 text-primary" /> Customize
              </Button>
            )}
            
            {/* Photo Gallery Generator Button */}
            {isViewingOwnProfile && (
              <Button
                size="sm"
                onClick={() => setIsPhotoGalleryOpen(true)}
                variant="secondary"
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 text-white shadow-lg"
              >
                <Image className="h-4 w-4" />
                <MusicIcon className="h-4 w-4" /> Photo Gallery
              </Button>
            )}
            
            {/* Edit Profile Button */}
            {isViewingOwnProfile && !isEditing && (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center gap-1 bg-dark-lighter backdrop-blur-sm shadow-md hover:bg-black/70"
              >
                <FileEdit className="h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>
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
                  
                  {/* Billie Eilish Theme Button */}
                  <div className="mt-4">
                    <Button
                      onClick={applyBillieEilishTheme}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
                    >
                      <MusicIcon className="h-4 w-4 mr-2" />
                      Apply Billie Eilish Theme
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applies a special theme inspired by Billie Eilish's "You Should See Me In A Crown"
                    </p>
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
                <div className="p-4 space-y-4">
                  <RichTextEditor 
                    value={htmlProfile} 
                    onChange={setHtmlProfile}
                    placeholder="Create your custom profile showcase here..."
                    className="bg-dark-surface"
                  />
                  
                  {/* Template generator options */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30 mt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setIsPhotoGalleryOpen(true)}
                      className="flex items-center gap-1.5"
                    >
                      <Image className="h-4 w-4" />
                      <MusicIcon className="h-4 w-4" />
                      Photo Gallery Generator
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={applyBillieEilishTheme}
                    >
                      Billie Eilish Theme
                    </Button>
                  </div>
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
      <style>{`
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
      
      {/* Profile Customization Dialog */}
      {isViewingOwnProfile && (
        <ProfileCustomizationDialog
          open={isCustomizationOpen}
          selectedFrame={selectedFrame}
          selectedTheme={selectedProfileTheme}
          selectedNameEffect={selectedNameEffect}
          selectedBackgroundEffect={selectedBgEffect}
          userAvatar={avatarPreview || userProfile?.avatar || undefined}
          userName={username}
          onFrameChange={setSelectedFrame}
          onThemeChange={setSelectedProfileTheme}
          onNameEffectChange={setSelectedNameEffect}
          onBgEffectChange={setSelectedBgEffect}
          onClose={() => {
            setIsCustomizationOpen(false);
            // Save current selections to localStorage for persistence
            localStorage.setItem('profile-frame', selectedFrame.id);
            localStorage.setItem('profile-theme', selectedProfileTheme.id);
            localStorage.setItem('profile-name-effect', selectedNameEffect.id);
            localStorage.setItem('profile-bg-effect', selectedBgEffect.id);
            
            // Also save combined data for easier loading
            const customizationData = {
              frameId: selectedFrame.id,
              themeId: selectedProfileTheme.id,
              nameEffectId: selectedNameEffect.id,
              backgroundEffectId: selectedBgEffect.id
            };
            localStorage.setItem('userCustomization', JSON.stringify(customizationData));
            
            toast({
              title: "Profile customization saved",
              description: "Your profile style has been updated",
            });
          }}
        />
      )}
      
      {/* Apply name effect styles */}
      {getNameEffectStyles()}
      
      {/* Photo Gallery Generator */}
      {isViewingOwnProfile && (
        <PhotoGalleryGenerator
          isOpen={isPhotoGalleryOpen}
          onClose={() => setIsPhotoGalleryOpen(false)}
          onGenerateTemplate={handlePhotoGalleryGenerate}
          username={username}
        />
      )}
    </div>
  );
}