import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatNumber } from "@shared/gameUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  Dumbbell, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Trophy,
  ChevronRight,
  Target,
  Clock,
  Skull,
  Diamond,
  ShieldAlert,
  AlertTriangle,
  Star,
  Award,
  HeartPulse,
  Brain,
  Sparkles,
  Mail,
  Plus,
  Settings,
  Palette,
  Frame,
  Camera,
  Sparkle,
  Crown,
  BadgeDollarSign
} from "lucide-react";
import { 
  TommyGunIcon, 
  FedoraIcon, 
  MoneyBriefcaseIcon, 
  WhiskeyGlassIcon, 
  DiceIcon, 
  FamilyIcon 
} from "@/components/ui/mafia-icons";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Animated background SVG patterns
const NoiseSVG = () => (
  <svg className="noise-overlay" xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.5 0" />
    </filter>
    <rect width="500" height="500" filter="url(#noise)" opacity="0.08" />
  </svg>
);

// Avatar frames that can be unlocked or purchased in-game
const AVATAR_FRAMES = [
  { 
    id: 'classic', 
    name: 'Classic',
    description: 'Standard frame',
    border: 'border-white/10',
    unlocked: true,
    rarity: 'common'
  },
  { 
    id: 'gold', 
    name: 'Gold Trim',
    description: 'A luxurious gold border',
    border: 'border-yellow-500/70',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
    unlocked: true,
    rarity: 'rare' 
  },
  { 
    id: 'diamond', 
    name: 'Diamond Edge',
    description: 'Prestigious diamond-encrusted frame',
    border: 'border-cyan-300/70',
    glow: 'shadow-[0_0_20px_rgba(103,232,249,0.6)]',
    unlocked: true,
    rarity: 'legendary' 
  },
  { 
    id: 'blood', 
    name: 'Blood Pact',
    description: 'Frame bound by blood oath',
    border: 'border-red-800/90',
    glow: 'shadow-[0_0_15px_rgba(220,38,38,0.6)]',
    unlocked: true,
    rarity: 'epic' 
  },
  { 
    id: 'boss', 
    name: 'Boss Status',
    description: 'Reserved for family bosses',
    border: 'border-[3px] border-gradient-to-r from-red-600 to-orange-400',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.6)]',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Reach Boss rank in a family'
  },
];

// Profile card themes that can be unlocked or purchased
const PROFILE_THEMES = [
  {
    id: 'dark',
    name: 'Classic Noir',
    description: 'Standard dark theme',
    background: 'bg-black/40',
    border: 'border-white/5',
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'blood',
    name: 'Blood Money',
    description: 'For those who aren\'t afraid to get their hands dirty',
    background: 'bg-gradient-to-br from-black/60 to-red-950/30',
    border: 'border-red-900/30',
    unlocked: true, 
    rarity: 'rare'
  },
  {
    id: 'gold',
    name: 'High Roller',
    description: 'For those with expensive taste',
    background: 'bg-gradient-to-br from-black/60 to-amber-950/30',
    border: 'border-amber-700/30',
    unlocked: true,
    rarity: 'epic'
  },
  {
    id: 'royal',
    name: 'Cosa Nostra',
    description: 'For the untouchable crime lords',
    background: 'bg-gradient-to-br from-black/70 to-purple-950/40',
    border: 'border-purple-800/30 border-[1.5px]',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Reach level 30'
  },
  {
    id: 'godfather',
    name: 'The Godfather',
    description: 'Reserved for the most feared and respected',
    background: 'bg-gradient-to-br from-black/80 to-zinc-900/50',
    border: 'border-orange-800/50 border-[2px]',
    glow: 'shadow-[0_0_30px_rgba(0,0,0,0.5)]',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Become the top player on the leaderboard'
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: crimes, isLoading: isCrimesLoading } = useQuery({
    queryKey: ["/api/crimes"],
  });

  // State for animations and customization
  const [selectedTab, setSelectedTab] = useState("overview");
  const [animatePulse, setAnimatePulse] = useState(false);
  const [animate3DEffect, setAnimate3DEffect] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(AVATAR_FRAMES[0]);
  const [selectedTheme, setSelectedTheme] = useState(PROFILE_THEMES[0]);
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [activityLog, setActivityLog] = useState([
    { id: 1, type: 'crime', name: 'Bank Robbery', time: '10 min ago', success: true, reward: '$5,200' },
    { id: 2, type: 'training', name: 'Strength Training', time: '2 hours ago', success: true, reward: '+3 Strength' },
    { id: 3, type: 'heist', name: 'Jewelry Store Heist', time: '5 hours ago', success: false, reward: 'None' },
  ]);

  const gangLevel = user?.gangId ? 5 : 0;

  // Set up periodic animations
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setAnimatePulse(true);
      setTimeout(() => setAnimatePulse(false), 2000);
    }, 15000);

    // Effect to create slight 3D motion effect
    let tiltInterval: NodeJS.Timeout;
    if (window.innerWidth > 768) {
      tiltInterval = setInterval(() => {
        setAnimate3DEffect(prev => !prev);
      }, 7000);
    }

    return () => {
      clearInterval(pulseInterval);
      clearInterval(tiltInterval);
    };
  }, []);

  const getRankTitle = (level: number) => {
    if (level < 5) return "Street Thug";
    if (level < 10) return "Associate";
    if (level < 20) return "Soldier";
    if (level < 30) return "Capo";
    if (level < 40) return "Underboss";
    return "Boss";
  };

  const getRankColor = (level: number) => {
    if (level < 5) return "from-zinc-400 to-zinc-300";
    if (level < 10) return "from-yellow-600 to-yellow-400";
    if (level < 20) return "from-emerald-600 to-emerald-400";
    if (level < 30) return "from-blue-600 to-blue-400";
    if (level < 40) return "from-purple-600 to-purple-400";
    return "from-red-600 to-red-400";
  };

  if (!user) return null;

  // Calculate XP progress for leveling up
  const xpForNextLevel = 100; // Each level requires 100 XP
  // For current level progress, we only care about XP beyond previous level
  const totalXpForPreviousLevel = (user.level - 1) * 100;
  const currentLevelXP = user.xp - totalXpForPreviousLevel;
  const xpProgress = Math.min(100, Math.round((currentLevelXP / xpForNextLevel) * 100)) || 0;
  
  // Calculate wealth rank
  const wealthRank = user.cash > 100000 ? "High Roller" : user.cash > 10000 ? "Made Man" : "Small Timer";

  return (
    <div className="relative">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-40 z-[-1]">
        <NoiseSVG />
      </div>

      {/* Omertà logo with animation */}
      <div className="mb-8 text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-block"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-3 
                       bg-gradient-to-br from-red-600 to-red-400 bg-clip-text text-transparent 
                       drop-shadow-[0_0.1em_0.1em_rgba(0,0,0,0.3)]">
            OMERTÀ
          </h1>
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent mt-1 animate-pulse"></div>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-sm italic text-muted-foreground opacity-70"
        >
          The code of silence
        </motion.p>
      </div>

      {/* User profile header with 3D card effect */}
      <motion.div 
        className="mb-8 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          perspective: "1500px",
        }}
      >
        <motion.div 
          className={cn(`backdrop-blur-sm rounded-xl p-6 shadow-xl ${selectedTheme.background} ${selectedTheme.border}`, 
            selectedTheme.glow && selectedTheme.glow
          )}
          animate={animate3DEffect ? {
            rotateX: [-0.5, 0.5],
            rotateY: [-0.5, 0.5],
          } : {
            rotateX: [0.5, -0.5],
            rotateY: [0.5, -0.5],
          }}
          transition={{
            duration: 5,
            ease: "easeInOut"
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Customize card button */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-black/30 border border-white/10 hover:bg-black/50"
                >
                  <Settings className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/10 text-zinc-200">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-zinc-400" />
                  <span>Customize Profile</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                <DropdownMenuItem 
                  className="justify-between cursor-pointer focus:bg-black/50"
                  onClick={() => setShowCustomizeMenu(true)}
                >
                  <div className="flex items-center gap-2">
                    <Frame className="h-4 w-4 text-amber-400" />
                    <span>Change Avatar Frame</span>
                  </div>
                  <Badge variant="outline" className="bg-black/30 text-xs font-normal">
                    {AVATAR_FRAMES.filter(f => f.unlocked).length} Owned
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="justify-between cursor-pointer focus:bg-black/50"
                  onClick={() => setShowCustomizeMenu(true)}
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-400" />
                    <span>Change Card Theme</span>
                  </div>
                  <Badge variant="outline" className="bg-black/30 text-xs font-normal">
                    {PROFILE_THEMES.filter(t => t.unlocked).length} Owned
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="justify-between cursor-pointer focus:bg-black/50">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4 text-green-400" />
                    <span>Shop Premium Items</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Avatar with customizable frame */}
            <div className="relative">
              <motion.div 
                className={cn(`h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 ${selectedFrame.border}`,
                  selectedFrame.glow && selectedFrame.glow
                )}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {user.avatar ? (
                  <div 
                    className="h-full w-full bg-cover bg-center" 
                    style={{ backgroundImage: `url(${user.avatar})` }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-black/80 to-red-900/50 flex items-center justify-center">
                    <FedoraIcon size="xl" className="text-red-400" />
                  </div>
                )}
              </motion.div>
              
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <motion.div 
                  className={`text-xs font-semibold py-1 px-3 rounded-full 
                            bg-gradient-to-r ${getRankColor(user.level)}
                            shadow-lg border border-white/10`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {getRankTitle(user.level)}
                </motion.div>
              </div>
            </div>
            
            {/* User info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.username}</h1>
              <div className="mt-1 flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="bg-zinc-800/50 text-zinc-200 border-zinc-700/50">
                  Level {user.level}
                </Badge>
                {user.gangId && (
                  <Badge variant="outline" className="bg-red-900/30 text-red-200 border-red-800/50">
                    <FamilyIcon size="xs" className="mr-1" /> Family Member
                  </Badge>
                )}
                <Badge variant="outline" className="bg-amber-900/30 text-amber-200 border-amber-800/50">
                  <DollarSign className="h-3 w-3 mr-1" /> {wealthRank}
                </Badge>
              </div>
              
              {/* XP progress bar */}
              <div className="mt-3 max-w-md">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Level Progress: {formatNumber(currentLevelXP)} / {xpForNextLevel} XP</span>
                  <span className="text-zinc-400">{xpProgress}%</span>
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
              </div>
            </div>
            
            {/* Status and quick stats */}
            <div className="shrink-0 grid grid-cols-2 md:grid-cols-1 gap-3 text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center p-2 md:p-3 bg-black/30 rounded-lg border border-white/5 hover:bg-black/40 transition-all">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-400 mb-1" />
                      <span className="text-sm md:text-base font-semibold">{formatCurrency(user.cash || 0)}</span>
                      <span className="text-xs text-zinc-500">Cash</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">Your Finances</p>
                      <p className="text-xs text-zinc-400">Bank: {formatCurrency(user.bankBalance || 0)}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center p-2 md:p-3 bg-black/30 rounded-lg border border-white/5 hover:bg-black/40 transition-all">
                      <FamilyIcon size="sm" className="text-amber-400 mb-1" />
                      <span className="text-sm md:text-base font-semibold">{formatNumber(user.respect || 0)}</span>
                      <span className="text-xs text-zinc-500">Respect</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Respect determines your influence in the underworld</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Customization dialog */}
      {showCustomizeMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            className="bg-zinc-900/90 border border-white/10 rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
              onClick={() => setShowCustomizeMenu(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </Button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Sparkle className="mr-2 h-5 w-5 text-amber-400" /> 
              Customize Your Profile
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Avatar frames section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Frame className="mr-2 h-4 w-4 text-zinc-400" /> 
                  Avatar Frames
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVATAR_FRAMES.map(frame => (
                    <div 
                      key={frame.id}
                      onClick={() => frame.unlocked && setSelectedFrame(frame)}
                      className={cn(
                        "relative rounded-lg border p-3 flex flex-col items-center cursor-pointer transition-all duration-200",
                        frame.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-40 cursor-not-allowed",
                        selectedFrame.id === frame.id && "border-white/40 bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2",
                        frame.border,
                        frame.glow && frame.glow
                      )}>
                        {user.avatar ? (
                          <div 
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${user.avatar})` }}
                          />
                        ) : (
                          <div className="h-full w-full bg-black flex items-center justify-center">
                            <FedoraIcon className="text-red-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium">{frame.name}</div>
                        <div className="text-xs text-zinc-500">{frame.description}</div>
                      </div>
                      
                      {/* Rarity badge */}
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] uppercase font-semibold",
                            frame.rarity === 'common' && "bg-zinc-900/50 border-zinc-700/50 text-zinc-400",
                            frame.rarity === 'rare' && "bg-blue-900/30 border-blue-700/50 text-blue-400",
                            frame.rarity === 'epic' && "bg-purple-900/30 border-purple-700/50 text-purple-400",
                            frame.rarity === 'legendary' && "bg-amber-900/30 border-amber-700/50 text-amber-400",
                            frame.rarity === 'mythic' && "bg-red-900/30 border-red-700/50 text-red-400"
                          )}
                        >
                          {frame.rarity}
                        </Badge>
                      </div>
                      
                      {!frame.unlocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <Badge variant="outline" className="bg-red-900/30 border-red-900/50">
                            {frame.requirement || "Locked"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Profile themes section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Palette className="mr-2 h-4 w-4 text-zinc-400" /> 
                  Card Themes
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROFILE_THEMES.map(theme => (
                    <div 
                      key={theme.id}
                      onClick={() => theme.unlocked && setSelectedTheme(theme)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 h-24",
                        theme.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-40 cursor-not-allowed",
                        selectedTheme.id === theme.id && "border-white/40"
                      )}
                    >
                      <div className={cn("w-full h-full flex items-center justify-center", theme.background, theme.border)}>
                        <div className="text-center p-4">
                          <div className="text-sm font-medium">{theme.name}</div>
                          <div className="text-xs text-zinc-500 line-clamp-2">{theme.description}</div>
                        </div>
                      </div>
                      
                      {/* Rarity badge */}
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] uppercase font-semibold",
                            theme.rarity === 'common' && "bg-zinc-900/50 border-zinc-700/50 text-zinc-400",
                            theme.rarity === 'rare' && "bg-blue-900/30 border-blue-700/50 text-blue-400",
                            theme.rarity === 'epic' && "bg-purple-900/30 border-purple-700/50 text-purple-400",
                            theme.rarity === 'legendary' && "bg-amber-900/30 border-amber-700/50 text-amber-400",
                            theme.rarity === 'mythic' && "bg-red-900/30 border-red-700/50 text-red-400"
                          )}
                        >
                          {theme.rarity}
                        </Badge>
                      </div>
                      
                      {!theme.unlocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="outline" className="bg-red-900/30 border-red-900/50">
                            {theme.requirement || "Locked"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowCustomizeMenu(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCustomizeMenu(false)}>
                Apply Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content with tabs */}
      <Tabs 
        defaultValue="overview" 
        className="w-full" 
        onValueChange={setSelectedTab}
      >
        <div className="border-b border-white/10 mb-6">
          <TabsList className="bg-transparent w-full justify-start pb-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-red-500 data-[state=active]:font-medium data-[state=active]:border-red-500 data-[state=active]:border-b-2 px-6 pb-2"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="activities" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-red-500 data-[state=active]:font-medium data-[state=active]:border-red-500 data-[state=active]:border-b-2 px-6 pb-2"
            >
              Activities
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-red-500 data-[state=active]:font-medium data-[state=active]:border-red-500 data-[state=active]:border-b-2 px-6 pb-2"
            >
              Operations
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Criminal Skills */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg relative overflow-hidden"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <FedoraIcon size="sm" className="mr-2 text-red-400" />
                  Criminal Skills
                </h2>
                
                <div className="space-y-5">
                  <SkillBarCard 
                    name="Strength" 
                    value={user?.stats?.strength || 0} 
                    icon={<HeartPulse className="h-4 w-4 text-red-400" />}
                    color="from-red-700 to-red-500"
                    hoverTip="Used for intimidation and physical crimes"
                    cooldown={user?.stats?.strengthTrainingCooldown}
                  />
                  
                  <SkillBarCard 
                    name="Stealth" 
                    value={user?.stats?.stealth || 0} 
                    icon={<Target className="h-4 w-4 text-green-400" />}
                    color="from-green-700 to-green-500"
                    hoverTip="Used for theft and avoiding detection"
                    cooldown={user?.stats?.stealthTrainingCooldown}
                  />
                  
                  <SkillBarCard 
                    name="Charisma" 
                    value={user?.stats?.charisma || 0} 
                    icon={<Sparkles className="h-4 w-4 text-blue-400" />}
                    color="from-blue-700 to-blue-500"
                    hoverTip="Used for negotiation and deception"
                    cooldown={user?.stats?.charismaTrainingCooldown}
                  />
                  
                  <SkillBarCard 
                    name="Intelligence" 
                    value={user?.stats?.intelligence || 0} 
                    icon={<Brain className="h-4 w-4 text-amber-400" />}
                    color="from-amber-700 to-amber-500"
                    hoverTip="Used for complex crimes and planning"
                    cooldown={user?.stats?.intelligenceTrainingCooldown}
                  />
                </div>
                
                <div className="mt-4">
                  <Link href="/training">
                    <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                      Train Skills
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <Dumbbell className="h-32 w-32 rotate-12" />
                </div>
              </motion.div>
              
              {/* Gang Status */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg relative overflow-hidden"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <FamilyIcon size="sm" className="mr-2 text-red-400" />
                  Family Status
                </h2>
                
                {user.gangId ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-zinc-200">
                        {dashboardData?.user?.gang?.name || "Kekw"} Family
                      </h3>
                      <Badge variant="outline" className="bg-black/30">
                        {dashboardData?.user?.gangMember?.rank || "Boss"} Rank
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-semibold text-amber-400">
                          {dashboardData?.user?.gang?.members?.length || 4}
                        </div>
                        <div className="text-xs text-zinc-400">Members</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-semibold text-red-400">3</div>
                        <div className="text-xs text-zinc-400">Territories</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Family Strength</span>
                        <span className="text-zinc-400">Level {gangLevel}</span>
                      </div>
                      <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-800 to-red-600 rounded-full"
                          style={{ width: `${gangLevel * 10}%` }}
                        />
                      </div>
                    </div>
                    
                    <Link href="/gang">
                      <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                        Family Business
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <div className="text-zinc-400 text-sm">You are not part of a family yet</div>
                    <Link href="/gang">
                      <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                        Join a Family
                        <Plus className="h-4 w-4 ml-1 group-hover:scale-125 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )}
                
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <Users className="h-32 w-32 rotate-12" />
                </div>
              </motion.div>
            </div>
            
            {/* Middle column */}
            <div className="space-y-6 md:col-span-2">
              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-red-400" />
                  Quick Actions
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <QuickActionCard 
                    title="Crimes"
                    icon={<TommyGunIcon size="md" className="text-red-400" />}
                    link="/crimes"
                    highlight={animatePulse}
                  />
                  
                  <QuickActionCard 
                    title="Training"
                    icon={<Dumbbell className="h-5 w-5 text-amber-400" />}
                    link="/training"
                  />
                  
                  <QuickActionCard 
                    title="Casino"
                    icon={<DiceIcon size="md" className="text-emerald-400" />}
                    link="/casino"
                  />
                  
                  <QuickActionCard 
                    title="Territories"
                    icon={<Target className="h-5 w-5 text-blue-400" />}
                    link="/locations"
                  />
                  
                  <QuickActionCard 
                    title="Market"
                    icon={<MoneyBriefcaseIcon size="md" className="text-purple-400" />}
                    link="/inventory"
                  />
                  
                  <QuickActionCard 
                    title="Banking"
                    icon={<DollarSign className="h-5 w-5 text-green-400" />}
                    link="/banking"
                  />
                  
                  <QuickActionCard 
                    title="Family"
                    icon={<FamilyIcon size="md" className="text-red-400" />}
                    link="/gang"
                  />
                  
                  <QuickActionCard 
                    title="Messages"
                    icon={<Mail className="h-5 w-5 text-zinc-400" />}
                    link="/messages"
                    badgeCount={3}
                  />
                </div>
              </motion.div>
              
              {/* Available Crimes */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-zinc-100 flex items-center">
                    <TommyGunIcon size="sm" className="mr-2 text-red-400" />
                    Available Crimes
                  </h2>
                  
                  <Link href="/crimes">
                    <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-red-900/20 hover:text-red-300">
                      View All
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isCrimesLoading ? (
                    <>
                      <AdvancedCrimeSkeleton />
                      <AdvancedCrimeSkeleton />
                    </>
                  ) : crimes && crimes.length > 0 ? (
                    crimes.slice(0, 2).map((crime: any) => (
                      <AdvancedCrimeCard 
                        key={crime.id}
                        name={crime.name}
                        description={crime.description}
                        cashReward={`$${crime.minCashReward} - $${crime.maxCashReward}`}
                        xpReward={`${crime.minXpReward} - ${crime.maxXpReward} XP`}
                        successChance={crime.successChance || calculateSuccessChance(crime, user?.stats)}
                        cooldown={formatTime(crime.cooldown)}
                        jailRisk={crime.jailRisk}
                        primarySkill={getMostImportantSkill(crime)}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-muted-foreground">
                      No crimes available at your level
                    </div>
                  )}
                </div>
                
                <div className="absolute -bottom-2 -left-2 opacity-5">
                  <TommyGunIcon size="5xl" className="rotate-12" />
                </div>
              </motion.div>
              
              {/* Recent Activity */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-red-400" />
                  Recent Activity
                </h2>
                
                <div className="space-y-3">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-white/5">
                      <div className={`h-10 w-10 rounded-md flex items-center justify-center 
                                     ${activity.success ? 'bg-green-900/30' : 'bg-red-900/30'}
                                     ${activity.success ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.type === 'crime' && <TommyGunIcon size="sm" />}
                        {activity.type === 'training' && <Dumbbell className="h-5 w-5" />}
                        {activity.type === 'heist' && <Diamond className="h-5 w-5" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">{activity.name}</h4>
                          <span className="text-xs text-zinc-500">{activity.time}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${activity.success ? 'text-green-400' : 'text-red-400'}`}>
                            {activity.success ? 'Success' : 'Failed'}
                          </span>
                          <span className="text-xs text-zinc-400">Reward: {activity.reward}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* View more button */}
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-zinc-400 hover:text-zinc-200">
                    View Activity Log <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-amber-400" />
                  Achievements
                </h2>
                
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-200">First Blood</h4>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-zinc-400">Complete your first crime</span>
                          <span className="text-xs text-green-400">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-500">
                        <Skull className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-400">The Executioner</h4>
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs text-zinc-500">Complete 50 crimes</span>
                          <div className="w-20">
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full">
                              <div className="h-1.5 bg-zinc-600 rounded-full" style={{ width: "30%" }}></div>
                            </div>
                            <div className="text-xs text-zinc-500 text-right mt-1">15/50</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-500">
                        <Diamond className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-400">Millionaire</h4>
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs text-zinc-500">Accumulate $1,000,000</span>
                          <div className="w-20">
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full">
                              <div className="h-1.5 bg-zinc-600 rounded-full" style={{ width: "5%" }}></div>
                            </div>
                            <div className="text-xs text-zinc-500 text-right mt-1">$50k/$1M</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link href="/achievements">
                    <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                      View All Achievements
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg relative overflow-hidden"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-red-400" />
                  Weekly Challenges
                </h2>
                
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                        <TommyGunIcon size="sm" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-200">Crime Spree</h4>
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs text-zinc-400">Complete 20 crimes</span>
                          <div className="w-20">
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-gradient-to-r from-red-800 to-red-600 rounded-full" style={{ width: "45%" }}></div>
                            </div>
                            <div className="text-xs text-zinc-500 text-right mt-1">9/20</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-amber-900/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-200">Big Spender</h4>
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs text-zinc-400">Spend $10,000</span>
                          <div className="w-20">
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-gradient-to-r from-amber-800 to-amber-600 rounded-full" style={{ width: "70%" }}></div>
                            </div>
                            <div className="text-xs text-zinc-500 text-right mt-1">$7k/$10k</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link href="/challenges">
                    <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                      View All Challenges
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <Trophy className="h-32 w-32 rotate-12" />
                </div>
              </motion.div>
            </div>
            
            {/* Right column */}
            <div className="md:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-red-400" />
                  Activity Log
                </h2>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
                      <div className={`h-10 w-10 rounded-md flex items-center justify-center 
                                    ${i % 3 !== 2 ? 'bg-green-900/30' : 'bg-red-900/30'}
                                    ${i % 3 !== 2 ? 'text-green-400' : 'text-red-400'}`}>
                        {i % 4 === 0 && <TommyGunIcon size="sm" />}
                        {i % 4 === 1 && <Dumbbell className="h-5 w-5" />}
                        {i % 4 === 2 && <Diamond className="h-5 w-5" />}
                        {i % 4 === 3 && <DollarSign className="h-5 w-5" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">
                            {i % 4 === 0 && 'Bank Robbery'}
                            {i % 4 === 1 && 'Strength Training'}
                            {i % 4 === 2 && 'Jewelry Store Heist'}
                            {i % 4 === 3 && 'Casino Winnings'}
                          </h4>
                          <span className="text-xs text-zinc-500">
                            {i === 0 ? '10 min ago' : 
                             i === 1 ? '2 hours ago' : 
                             i === 2 ? '5 hours ago' : 
                             `${i} days ago`}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${i % 3 !== 2 ? 'text-green-400' : 'text-red-400'}`}>
                            {i % 3 !== 2 ? 'Success' : 'Failed'}
                          </span>
                          <span className="text-xs text-zinc-400">
                            Reward: {i % 3 !== 2 ? 
                              (i % 4 === 0 ? '$5,200' : 
                               i % 4 === 1 ? '+3 Strength' : 
                               i % 4 === 3 ? '$1,800' : '+2 XP') : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg relative overflow-hidden"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-red-400" />
                  Security Status
                </h2>
                
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Jail Risk</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">High</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Your recent activities have attracted police attention</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-amber-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Gang Protection</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400">Medium</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Your family provides some level of protection</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Diamond className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Asset Security</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">Protected</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Your assets are secured in offshore accounts</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <ShieldAlert className="h-32 w-32 rotate-12" />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-red-400" />
                  Cooldowns
                </h2>
                
                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="h-5 w-5 text-amber-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Strength Training</h4>
                          <span className="text-xs text-zinc-400">1h 23m</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-800 to-amber-600 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <TommyGunIcon size="xs" className="text-red-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Bank Robbery</h4>
                          <span className="text-xs text-zinc-400">4h 45m</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-800 to-red-600 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-zinc-200">Territory Control</h4>
                          <span className="text-xs text-zinc-400">12h 10m</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-800 to-blue-600 rounded-full" style={{ width: "5%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Right columns */}
            <div className="md:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-red-400" />
                  Territory Control
                </h2>
                
                <div className="relative h-[300px] rounded-lg overflow-hidden border border-white/10">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="text-xl font-semibold mb-2">City Map</div>
                      <Link href="/locations">
                        <Button variant="secondary" size="sm" className="hover:bg-red-900/20">
                          View Territories
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-red-400">3</div>
                    <div className="text-xs text-zinc-400">Controlled</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-zinc-400">12</div>
                    <div className="text-xs text-zinc-500">Contested</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-zinc-400">$4,500</div>
                    <div className="text-xs text-zinc-500">Daily Income</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                  Financial Overview
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-zinc-200">{formatCurrency(user.cash || 0)}</div>
                    <div className="text-xs text-zinc-500">Cash</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-zinc-200">{formatCurrency(user.bankBalance || 0)}</div>
                    <div className="text-xs text-zinc-500">Bank</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-lg font-semibold text-zinc-200">{formatCurrency((user.cash || 0) + (user.bankBalance || 0))}</div>
                    <div className="text-xs text-zinc-500">Net Worth</div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <h3 className="font-medium text-zinc-200 mb-3">Income Breakdown</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TommyGunIcon size="xs" className="text-red-400" />
                        <span className="text-sm text-zinc-300">Crimes</span>
                      </div>
                      <div className="text-sm text-zinc-300">$5,200 (42%)</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-zinc-300">Territories</span>
                      </div>
                      <div className="text-sm text-zinc-300">$4,500 (36%)</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DiceIcon size="xs" className="text-green-400" />
                        <span className="text-sm text-zinc-300">Gambling</span>
                      </div>
                      <div className="text-sm text-zinc-300">$1,800 (15%)</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FamilyIcon size="xs" className="text-amber-400" />
                        <span className="text-sm text-zinc-300">Gang Operations</span>
                      </div>
                      <div className="text-sm text-zinc-300">$850 (7%)</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link href="/banking">
                      <Button variant="secondary" size="sm" className="w-full group hover:bg-red-900/20">
                        Banking & Finance
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 45, 85, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 45, 85, 0.5);
        }
        
        @keyframes borderGlow {
          0% {
            box-shadow: 0 0 5px rgba(255, 45, 85, 0.3);
          }
          100% {
            box-shadow: 0 0 15px rgba(255, 45, 85, 0.6);
          }
        }
        
        @keyframes dividerGlow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.05;
          z-index: -1;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// Skill bar with cool hover effect
function SkillBarCard({ 
  name, 
  value, 
  icon, 
  color = "from-red-700 to-red-500", 
  hoverTip,
  cooldown
}: { 
  name: string; 
  value: number; 
  icon: React.ReactNode;
  color?: string; 
  hoverTip?: string;
  cooldown?: string | Date | null;
}) {
  const cooldownDate = cooldown ? new Date(cooldown) : null;
  const isOnCooldown = cooldownDate && cooldownDate > new Date();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                {icon}
                <span className="font-medium text-sm">{name}</span>
              </div>
              <span className="font-mono text-sm">{value}</span>
            </div>
            
            <div className="h-2 bg-black/50 rounded-full overflow-hidden relative">
              <motion.div 
                className={`h-full bg-gradient-to-r ${color} rounded-full relative group-hover:brightness-110 transition-all`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, value)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            {isOnCooldown && (
              <div className="flex items-center text-xs text-zinc-500 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Ready in {formatCooldown(cooldownDate)}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hoverTip || `Your ${name.toLowerCase()} skill level is ${value}/100`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick action cards with hover effects and animations
function QuickActionCard({ 
  title, 
  icon, 
  link,
  highlight = false,
  badgeCount
}: { 
  title: string; 
  icon: React.ReactNode; 
  link: string; 
  highlight?: boolean;
  badgeCount?: number;
}) {
  return (
    <Link href={link}>
      <motion.div 
        className={`relative bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center text-center cursor-pointer
                  hover:bg-black/50 hover:border-red-900/30 transition-all duration-300
                  ${highlight ? 'ring-2 ring-red-500/20 ring-offset-1 ring-offset-red-500/5' : ''}`}
        whileHover={{ 
          y: -5,
          boxShadow: "0 10px 15px -3px rgba(153, 27, 27, 0.1), 0 4px 6px -4px rgba(153, 27, 27, 0.1)" 
        }}
        animate={highlight ? {
          borderColor: ['rgba(255,255,255,0.05)', 'rgba(220,38,38,0.3)', 'rgba(255,255,255,0.05)'],
        } : {}}
        transition={highlight ? {
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        } : {}}
      >
        <div className="mb-2 h-10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-medium">{title}</h3>
        
        {badgeCount !== undefined && badgeCount > 0 && (
          <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">
            {badgeCount}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// Enhanced crime card with animations
function AdvancedCrimeCard({ 
  name, 
  description, 
  cashReward, 
  xpReward, 
  successChance, 
  cooldown,
  jailRisk,
  primarySkill
}: { 
  name: string; 
  description: string; 
  cashReward: string; 
  xpReward: string; 
  successChance: number; 
  cooldown: string;
  jailRisk: number;
  primarySkill: string;
}) {
  const difficultyColor = successChance < 30 ? 'red' : 
                          successChance < 60 ? 'amber' : 'emerald';
                          
  return (
    <motion.div 
      className="bg-black/30 rounded-lg border border-white/5 overflow-hidden hover:bg-black/40 transition-all duration-300"
      whileHover={{ 
        y: -3,
        boxShadow: "0 10px 15px -3px rgba(153, 27, 27, 0.1), 0 4px 6px -4px rgba(153, 27, 27, 0.1)",
        borderColor: "rgba(220, 38, 38, 0.2)" 
      }}
    >
      <div className="p-4">
        <div className="flex justify-between mb-2">
          <h3 className="font-medium text-zinc-200">{name}</h3>
          <Badge 
            variant="outline" 
            className={`bg-${difficultyColor}-900/30 text-${difficultyColor}-400 border-${difficultyColor}-800/50`}
          >
            {successChance}% Success
          </Badge>
        </div>
        
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <DollarSign className="h-3 w-3 text-green-400" />
            <span>{cashReward}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Award className="h-3 w-3 text-blue-400" />
            <span>{xpReward}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>Cooldown: {cooldown}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Skull className="h-3 w-3 text-red-400" />
            <span>Jail Risk: {jailRisk}%</span>
          </div>
        </div>
        
        <div className="bg-black/40 rounded p-2 flex items-center gap-2 mb-3">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center bg-${primarySkill === 'Strength' ? 'red' : primarySkill === 'Stealth' ? 'green' : primarySkill === 'Charisma' ? 'blue' : 'amber'}-900/50`}>
            {primarySkill === 'Strength' && <HeartPulse className="h-4 w-4 text-red-400" />}
            {primarySkill === 'Stealth' && <Target className="h-4 w-4 text-green-400" />}
            {primarySkill === 'Charisma' && <Sparkles className="h-4 w-4 text-blue-400" />}
            {primarySkill === 'Intelligence' && <Brain className="h-4 w-4 text-amber-400" />}
          </div>
          <div className="flex-1">
            <span className="text-xs text-zinc-400">Primary Skill: {primarySkill}</span>
          </div>
        </div>
        
        <Button className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-zinc-100">
          Execute Crime
        </Button>
      </div>
    </motion.div>
  );
}

// Crime card loading skeleton
function AdvancedCrimeSkeleton() {
  return (
    <div className="bg-black/30 rounded-lg border border-white/5 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-6 w-[90px] rounded-full" />
        </div>
        
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-[80%] mb-3" />
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        
        <Skeleton className="h-[43px] w-full mb-3" />
        
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

// Utility functions
function calculateSuccessChance(crime: any, stats: any) {
  if (!stats) return 50;
  
  // Simple calculation based on weights
  const strengthContribution = (stats.strength || 0) * (crime.strengthWeight || 0.25);
  const stealthContribution = (stats.stealth || 0) * (crime.stealthWeight || 0.25);
  const charismaContribution = (stats.charisma || 0) * (crime.charismaWeight || 0.25);
  const intelligenceContribution = (stats.intelligence || 0) * (crime.intelligenceWeight || 0.25);
  
  const totalContribution = strengthContribution + stealthContribution + 
                            charismaContribution + intelligenceContribution;
  
  // Scale to a percentage (max stats would be 400 total)
  let chance = Math.min(95, Math.max(5, Math.floor(totalContribution / 4)));
  
  return chance;
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatCooldown(date: Date) {
  const now = new Date();
  const diff = Math.max(0, Math.floor((date.getTime() - now.getTime()) / 1000));
  return formatTime(diff);
}

function getMostImportantSkill(crime: any) {
  if (!crime) return 'Strength';
  
  const weights = {
    strength: crime.strengthWeight || 0.25,
    stealth: crime.stealthWeight || 0.25,
    charisma: crime.charismaWeight || 0.25,
    intelligence: crime.intelligenceWeight || 0.25
  };
  
  const highest = Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0];
  
  return highest.charAt(0).toUpperCase() + highest.slice(1);
}