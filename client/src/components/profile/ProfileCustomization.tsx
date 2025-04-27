import React, { useState } from 'react';
import { 
  Palette, 
  Frame, 
  Sparkles, 
  Crown, 
  Camera, 
  BadgeDollarSign, 
  Star, 
  Shield, 
  Flame,
  Zap,
  Music,
  Cloud,
  PaintBucket,
  Shapes,
  Sparkle,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FedoraIcon } from "@/components/ui/mafia-icons";
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions for customization items
export interface AvatarFrame {
  id: string;
  name: string;
  description: string;
  border: string;
  glow?: string;
  animation?: string;
  effects?: string[];
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
}

export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  background: string;
  border: string;
  glow?: string;
  textColor?: string;
  animation?: string;
  effects?: string[];
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
}

export interface NameEffect {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  preview: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
}

export interface BackgroundEffect {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  preview?: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
}

export interface ProfileSticker {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirement?: string;
  cost?: number;
}

// Avatar frames that can be unlocked or purchased in-game
export const AVATAR_FRAMES: AvatarFrame[] = [
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
  {
    id: 'neon',
    name: 'Neon Pulse',
    description: 'Electrifying neon border that pulses with energy',
    border: 'border-[3px] border-[#00ff99]',
    glow: 'shadow-[0_0_20px_rgba(0,255,153,0.7)]',
    animation: 'animate-pulse',
    unlocked: true,
    rarity: 'epic'
  },
  {
    id: 'fire',
    name: 'Inferno',
    description: 'A burning frame of pure fire',
    border: 'border-[3px] border-gradient-to-r from-orange-500 to-red-600',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.7)]',
    effects: ['flame-effect'],
    unlocked: true,
    rarity: 'legendary'
  },
  {
    id: 'shadow',
    name: 'Shadow Master',
    description: 'A frame that radiates dark energy',
    border: 'border-[3px] border-purple-900/80',
    glow: 'shadow-[0_0_20px_rgba(88,28,135,0.8)]',
    animation: 'animate-pulse',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Complete 100 stealth missions',
    cost: 50000
  },
  {
    id: 'electric',
    name: 'Electric Shock',
    description: 'Crackling with electricity',
    border: 'border-[3px] border-blue-400',
    glow: 'shadow-[0_0_25px_rgba(96,165,250,0.8)]',
    effects: ['electric-effect'],
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Win 50 casino games',
    cost: 25000
  },
  {
    id: 'prestige',
    name: 'Prestige Elite',
    description: 'Only the most elite mafioso can display this frame',
    border: 'border-[4px] border-gradient-to-r from-purple-600 via-pink-500 to-red-600',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.8)]',
    animation: 'animate-border-flow',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Reach level 50',
    cost: 100000
  }
];

// Profile card themes that can be unlocked or purchased
export const PROFILE_THEMES: ProfileTheme[] = [
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
  {
    id: 'neon-crime',
    name: 'Neon Crime',
    description: 'Cyberpunk-inspired theme with neon accents',
    background: 'bg-gradient-to-br from-slate-900/90 to-slate-950/80',
    border: 'border-cyan-500/50 border-[2px]',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    animation: 'animate-pulse-slow',
    unlocked: true,
    rarity: 'epic'
  },
  {
    id: 'vintage-mafia',
    name: 'Vintage Mafia',
    description: 'Classic 1920s mafia aesthetic with sepia tones',
    background: 'bg-gradient-to-br from-amber-950/80 to-stone-900/90',
    border: 'border-amber-800/40 border-[1px]',
    textColor: 'text-amber-100',
    unlocked: true,
    rarity: 'rare'
  },
  {
    id: 'yakuza',
    name: 'Yakuza',
    description: 'Inspired by Japanese crime syndicates',
    background: 'bg-gradient-to-br from-slate-950/90 to-red-950/80',
    border: 'border-red-700/30 border-[2px]',
    effects: ['cherry-blossom-corner'],
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete the Tokyo Territory missions',
    cost: 50000
  },
  {
    id: 'miami-vice',
    name: 'Miami Vice',
    description: 'Vibrant South Beach aesthetic',
    background: 'bg-gradient-to-br from-pink-900/70 to-blue-900/70',
    border: 'border-cyan-400/30 border-[2px]',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.2)]',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Control the Miami Territory',
    cost: 35000
  },
  {
    id: 'digital-kingpin',
    name: 'Digital Kingpin',
    description: 'Cutting-edge digital overlord aesthetic',
    background: 'bg-gradient-to-br from-emerald-950/90 to-black/80',
    border: 'border-green-500/40 border-[2px]',
    animation: 'animate-matrix-bg',
    effects: ['matrix-code'],
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Hack the Global Banking System',
    cost: 75000
  }
];

// Name effects for highlighting your username
export const NAME_EFFECTS: NameEffect[] = [
  {
    id: 'none',
    name: 'Standard',
    description: 'No special effects',
    cssClass: 'text-foreground',
    preview: 'Username',
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'gradient-red',
    name: 'Blood Money',
    description: 'Red gradient text effect',
    cssClass: 'bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent',
    preview: 'Username',
    unlocked: true,
    rarity: 'rare'
  },
  {
    id: 'gradient-gold',
    name: 'Gold Status',
    description: 'Gold gradient text effect',
    cssClass: 'bg-gradient-to-r from-amber-500 to-yellow-300 bg-clip-text text-transparent',
    preview: 'Username',
    unlocked: true,
    rarity: 'epic'
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    description: 'Glowing neon text effect',
    cssClass: 'text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
    preview: 'Username',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Reach level 25',
    cost: 25000
  },
  {
    id: 'rainbow',
    name: 'Rainbow Boss',
    description: 'Animated rainbow text effect',
    cssClass: 'rainbow-text-effect',
    preview: 'Username',
    unlocked: true, // Set to true for testing
    rarity: 'mythic',
    requirement: 'Own all territories',
    cost: 100000
  },
  {
    id: 'fire-text',
    name: 'Burning Words',
    description: 'Text that burns with fire',
    cssClass: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent animate-fire-text',
    preview: 'Username',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete 50 arson crimes',
    cost: 50000
  },
  {
    id: 'ice-text',
    name: 'Frost Bite',
    description: 'Freezing cold text effect',
    cssClass: 'bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent shadow-[0_0_10px_rgba(56,189,248,0.5)]',
    preview: 'Username',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Execute 25 cold-blooded hits',
    cost: 30000
  },
  {
    id: 'toxic',
    name: 'Toxic Boss',
    description: 'Poisonous text effect',
    cssClass: 'bg-gradient-to-r from-green-400 via-lime-500 to-emerald-500 bg-clip-text text-transparent animate-pulse',
    preview: 'Username',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete 30 poison assassinations',
    cost: 40000
  },
  {
    id: 'shadow-lord',
    name: 'Shadow Lord',
    description: 'Dark shadowy text with purple glow',
    cssClass: 'text-gray-200 shadow-[0_0_8px_rgba(0,0,0,0.8),0_0_15px_rgba(124,58,237,0.5)]',
    preview: 'Username',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Complete the Shadow Syndicate missions',
    cost: 60000
  },
  {
    id: 'electric-shock',
    name: 'Electric Shock',
    description: 'Text that pulses with electricity',
    cssClass: 'text-white animate-electric',
    preview: 'Username',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Sabotage 20 rival operations',
    cost: 45000
  }
];

// Background effects for profile card
export const BACKGROUND_EFFECTS: BackgroundEffect[] = [
  {
    id: 'none',
    name: 'Clean',
    description: 'No background effects',
    cssClass: '',
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'noise',
    name: 'Static Noise',
    description: 'Subtle noise texture overlay',
    cssClass: 'bg-noise',
    unlocked: true,
    rarity: 'rare'
  },
  {
    id: 'rain',
    name: 'Crime Noir Rain',
    description: 'Animated rain effect overlay',
    cssClass: 'rain-effect',
    unlocked: true,
    rarity: 'epic'
  },
  {
    id: 'matrix',
    name: 'Digital Matrix',
    description: 'Digital code raining down',
    cssClass: 'matrix-effect',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Hack 10 secure systems',
    cost: 25000
  },
  {
    id: 'particles',
    name: 'Floating Particles',
    description: 'Ambient floating particles',
    cssClass: 'particles-effect',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Reach level 20',
    cost: 20000
  },
  {
    id: 'smoke',
    name: 'Cigar Smoke',
    description: 'Drifting smoke effect',
    cssClass: 'smoke-effect',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete the Cigar Club mission',
    cost: 35000
  },
  {
    id: 'money',
    name: 'Money Rain',
    description: 'Dollar bills falling in the background',
    cssClass: 'money-rain-effect',
    unlocked: false,
    rarity: 'mythic',
    requirement: 'Accumulate $1,000,000 cash',
    cost: 75000
  },
  {
    id: 'blood',
    name: 'Blood Splatter',
    description: 'Blood spatter effect on the edges',
    cssClass: 'blood-splatter-effect',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Complete 30 hit contracts',
    cost: 50000
  },
  {
    id: 'sparkles',
    name: 'Gold Dust',
    description: 'Subtle gold sparkles in the background',
    cssClass: 'gold-dust-effect',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Win big at the casino',
    cost: 30000
  },
  {
    id: 'police-lights',
    name: 'Police Pursuit',
    description: 'Red and blue flashing lights effect',
    cssClass: 'police-lights-effect',
    unlocked: false,
    rarity: 'epic',
    requirement: 'Escape from 15 police chases',
    cost: 25000
  }
];

// Decorative stickers for customizing profiles
export const PROFILE_STICKERS: ProfileSticker[] = [
  {
    id: 'dollar',
    name: 'Money Bags',
    description: 'Show off your wealth',
    imageUrl: '/assets/stickers/money-bag.svg',
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'gun',
    name: 'Tommy Gun',
    description: 'Classic mafia weapon',
    imageUrl: '/assets/stickers/tommy-gun.svg',
    unlocked: true,
    rarity: 'rare'
  },
  {
    id: 'crown',
    name: 'Boss Crown',
    description: 'Symbol of authority',
    imageUrl: '/assets/stickers/crown.svg',
    unlocked: false,
    rarity: 'legendary',
    requirement: 'Become a family boss',
    cost: 50000
  },
  // Add more stickers here
];

// Helper function to get a rarity CSS class
export function getRarityClass(rarity: string) {
  switch (rarity) {
    case 'common':
      return "bg-zinc-900/50 border-zinc-700/50 text-zinc-400";
    case 'rare':
      return "bg-blue-900/30 border-blue-700/50 text-blue-400";
    case 'epic':
      return "bg-purple-900/30 border-purple-700/50 text-purple-400";
    case 'legendary':
      return "bg-amber-900/30 border-amber-700/50 text-amber-400";
    case 'mythic':
      return "bg-red-900/30 border-red-700/50 text-red-400";
    default:
      return "bg-zinc-900/50 border-zinc-700/50 text-zinc-400";
  }
}

// Types for the profile customization
export interface ProfileCustomizationProps {
  selectedFrame: AvatarFrame;
  selectedTheme: ProfileTheme;
  selectedNameEffect: NameEffect;
  selectedBackgroundEffect: BackgroundEffect;
  userAvatar?: string | null;
  userName: string;
  onFrameChange: (frame: AvatarFrame) => void;
  onThemeChange: (theme: ProfileTheme) => void;
  onNameEffectChange: (effect: NameEffect) => void;
  onBgEffectChange: (effect: BackgroundEffect) => void;
  onClose: () => void;
}

export const ProfileCustomizationDialog: React.FC<{
  open: boolean;
  selectedFrame: AvatarFrame;
  selectedTheme: ProfileTheme;
  selectedNameEffect: NameEffect;
  selectedBackgroundEffect: BackgroundEffect;
  userAvatar?: string | null;
  userName: string;
  onFrameChange: (frame: AvatarFrame) => void;
  onThemeChange: (theme: ProfileTheme) => void;
  onNameEffectChange: (effect: NameEffect) => void;
  onBgEffectChange: (effect: BackgroundEffect) => void;
  onClose: () => void;
}> = ({
  open,
  selectedFrame,
  selectedTheme,
  selectedNameEffect,
  selectedBackgroundEffect,
  userAvatar,
  userName,
  onFrameChange,
  onThemeChange,
  onNameEffectChange,
  onBgEffectChange,
  onClose
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-zinc-900/95 border-white/10 max-w-4xl w-[95vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Sparkles className="mr-2 h-5 w-5 text-amber-400" /> 
            Customize Your Profile
          </DialogTitle>
          <DialogDescription>
            Personalize your profile with different visual effects, borders, themes, and more.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="frames" className="py-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="frames" className="flex items-center gap-2">
              <Frame className="h-4 w-4" /> Avatar Frames
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Card Themes
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Sparkle className="h-4 w-4" /> Name Effects
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" /> Background
            </TabsTrigger>
          </TabsList>

          {/* Avatar frame selector */}
          <TabsContent value="frames">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVATAR_FRAMES.map(frame => (
                <div 
                  key={frame.id}
                  onClick={() => frame.unlocked && onFrameChange(frame)}
                  className={cn(
                    "relative rounded-lg border p-3 flex flex-col items-center cursor-pointer transition-all duration-200",
                    frame.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-60 cursor-not-allowed",
                    selectedFrame.id === frame.id && "border-white/40 bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2",
                    frame.border,
                    frame.glow,
                    frame.animation
                  )}>
                    {userAvatar ? (
                      <div 
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${userAvatar})` }}
                      />
                    ) : (
                      <div className="h-full w-full bg-black flex items-center justify-center">
                        <FedoraIcon className="text-red-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium">{frame.name}</div>
                    <div className="text-xs text-zinc-500 line-clamp-2">{frame.description}</div>
                  </div>
                  
                  {/* Rarity badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        getRarityClass(frame.rarity)
                      )}
                    >
                      {frame.rarity}
                    </Badge>
                  </div>
                  
                  {/* Cost badge for purchasable items */}
                  {frame.cost && (
                    <div className="absolute bottom-2 left-2">
                      <Badge 
                        variant="outline" 
                        className="text-[10px] bg-black/50 border-amber-700/50 text-amber-400"
                      >
                        ${frame.cost.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  
                  {!frame.unlocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Badge variant="outline" className="bg-red-900/30 border-red-900/50 text-xs">
                        {frame.requirement || "Locked"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Profile themes selector */}
          <TabsContent value="themes">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROFILE_THEMES.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => theme.unlocked && onThemeChange(theme)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 h-32",
                    theme.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-60 cursor-not-allowed",
                    selectedTheme.id === theme.id && "border-white/40"
                  )}
                >
                  <div className={cn("w-full h-full flex items-center justify-center", theme.background, theme.border, theme.animation)}>
                    <div className="text-center p-4">
                      <div className={cn("text-base font-medium", theme.textColor)}>{theme.name}</div>
                      <div className="text-xs text-zinc-500 line-clamp-2">{theme.description}</div>
                    </div>
                  </div>
                  
                  {/* Rarity badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        getRarityClass(theme.rarity)
                      )}
                    >
                      {theme.rarity}
                    </Badge>
                  </div>
                  
                  {/* Cost badge */}
                  {theme.cost && (
                    <div className="absolute top-2 left-2">
                      <Badge 
                        variant="outline" 
                        className="text-[10px] bg-black/50 border-amber-700/50 text-amber-400"
                      >
                        ${theme.cost.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  
                  {!theme.unlocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="outline" className="bg-red-900/30 border-red-900/50 text-xs">
                        {theme.requirement || "Locked"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Name effect selector */}
          <TabsContent value="text">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {NAME_EFFECTS.map(effect => (
                <div 
                  key={effect.id}
                  onClick={() => effect.unlocked && onNameEffectChange(effect)}
                  className={cn(
                    "relative rounded-lg border p-3 flex flex-col items-center cursor-pointer transition-all duration-200",
                    effect.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-60 cursor-not-allowed",
                    selectedNameEffect.id === effect.id && "border-white/40 bg-white/5"
                  )}
                >
                  <div className="py-6 px-2 text-center">
                    <h3 className={cn("text-xl font-bold", effect.cssClass)}>
                      {userName || "Username"}
                    </h3>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium">{effect.name}</div>
                    <div className="text-xs text-zinc-500 line-clamp-2">{effect.description}</div>
                  </div>
                  
                  {/* Rarity badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        getRarityClass(effect.rarity)
                      )}
                    >
                      {effect.rarity}
                    </Badge>
                  </div>
                  
                  {/* Cost badge */}
                  {effect.cost && (
                    <div className="absolute bottom-2 left-2">
                      <Badge 
                        variant="outline" 
                        className="text-[10px] bg-black/50 border-amber-700/50 text-amber-400"
                      >
                        ${effect.cost.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  
                  {!effect.unlocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Badge variant="outline" className="bg-red-900/30 border-red-900/50 text-xs">
                        {effect.requirement || "Locked"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Background effect selector */}
          <TabsContent value="effects">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BACKGROUND_EFFECTS.map(effect => (
                <div 
                  key={effect.id}
                  onClick={() => effect.unlocked && onBgEffectChange(effect)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 h-32",
                    effect.unlocked ? "border-white/10 hover:border-white/30" : "border-white/5 opacity-60 cursor-not-allowed",
                    selectedBackgroundEffect.id === effect.id && "border-white/40"
                  )}
                >
                  <div className={cn("w-full h-full flex items-center justify-center bg-black/30", effect.cssClass)}>
                    <div className="text-center p-4 z-10">
                      <div className="text-base font-medium">{effect.name}</div>
                      <div className="text-xs text-zinc-500">{effect.description}</div>
                    </div>
                  </div>
                  
                  {/* Rarity badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        getRarityClass(effect.rarity)
                      )}
                    >
                      {effect.rarity}
                    </Badge>
                  </div>
                  
                  {/* Cost badge */}
                  {effect.cost && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge 
                        variant="outline" 
                        className="text-[10px] bg-black/50 border-amber-700/50 text-amber-400"
                      >
                        ${effect.cost.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  
                  {!effect.unlocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <Badge variant="outline" className="bg-red-900/30 border-red-900/50 text-xs">
                        {effect.requirement || "Locked"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <BadgeDollarSign className="h-4 w-4" />
              Shop Premium Items
            </Button>
            <Button onClick={onClose}>Apply Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Component for the item selection in individual components
export function ProfileCustomizationButton({
  onOpenCustomization
}: {
  onOpenCustomization: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full bg-black/30 border border-white/10 hover:bg-black/50"
      onClick={onOpenCustomization}
    >
      <Settings className="h-4 w-4 text-zinc-400" />
    </Button>
  );
}

// Animated Frame Component
export function AnimatedProfileFrame({
  children,
  frame,
  className
}: {
  children: React.ReactNode;
  frame: AvatarFrame;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "rounded-full overflow-hidden", 
        frame.border, 
        frame.glow,
        frame.animation,
        className
      )}
    >
      {children}
    </div>
  );
}

// Helper function to get CSS for animated name effects
export function getNameEffectStyles(effect?: any) {
  // CSS-in-JS mapping for specific effect IDs
  if (effect) {
    switch (effect.id) {
      case 'gradient-red':
        return { backgroundImage: 'linear-gradient(to right, #ff4d4d, #f9cb28)' };
      case 'gradient-gold':
        return { backgroundImage: 'linear-gradient(to right, #ffd700, #ff8c00)' };
      case 'rainbow':
        return { backgroundImage: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' };
      case 'neon-blue':
        return { textShadow: '0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff' };
      case 'shadow':
        return { textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' };
      case 'fire-text':
        return { backgroundImage: 'linear-gradient(to right, #ff4d00, #f9cb28)' };
      default:
        return {};
    }
  }

  // Return CSS styles for animations
  return (
    <style>{`
      @keyframes rainbow {
        0% { color: #ff0000; }
        14% { color: #ff7f00; }
        28% { color: #ffff00; }
        42% { color: #00ff00; }
        57% { color: #0000ff; }
        71% { color: #4b0082; }
        85% { color: #9400d3; }
        100% { color: #ff0000; }
      }
      
      .animate-rainbow-text {
        animation: rainbow 4s linear infinite;
      }
      
      @keyframes electric {
        0%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e6, 0 0 20px #0073e6; }
        50% { text-shadow: 0 0 2px #fff, 0 0 5px #fff, 0 0 7px #0073e6, 0 0 10px #0073e6; }
      }
      
      .animate-electric {
        animation: electric 0.8s ease-in-out infinite;
      }
      
      @keyframes fire-text {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .animate-fire-text {
        background-size: 200% auto;
        animation: fire-text 3s ease infinite;
      }
      
      .animate-pulse-slow {
        animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .animate-border-flow {
        background-size: 400% 400%;
        animation: gradient 3s ease infinite;
      }
      
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      /* Background Effects */
      .bg-noise {
        position: relative;
      }
      
      .bg-noise::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.15;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      }
      
      @keyframes rain {
        0% { background-position: 0 0; }
        100% { background-position: 0 100%; }
      }
      
      .rain-effect {
        position: relative;
      }
      
      .rain-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.2;
        background-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.2) 100%), 
                           url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='100' y2='100' stroke='white' stroke-width='0.5' /%3E%3Cline x1='25' y1='0' x2='125' y2='100' stroke='white' stroke-width='0.5' /%3E%3Cline x1='50' y1='0' x2='150' y2='100' stroke='white' stroke-width='0.5' /%3E%3Cline x1='75' y1='0' x2='175' y2='100' stroke='white' stroke-width='0.5' /%3E%3C/svg%3E");
        animation: rain 8s linear infinite;
      }
      
      @keyframes matrixBg {
        0% { background-position: 0 0; }
        100% { background-position: 0 100%; }
      }
      
      .matrix-effect {
        position: relative;
      }
      
      .matrix-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.3;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300FF00' fill-opacity='0.3'%3E%3Ctext x='10' y='20' font-family='monospace' font-size='20'%3E10110%3C/text%3E%3Ctext x='50' y='40' font-family='monospace' font-size='15'%3E01010%3C/text%3E%3Ctext x='30' y='60' font-family='monospace' font-size='18'%3E11001%3C/text%3E%3Ctext x='70' y='80' font-family='monospace' font-size='12'%3E10101%3C/text%3E%3Ctext x='10' y='100' font-family='monospace' font-size='14'%3E01010%3C/text%3E%3Ctext x='50' y='120' font-family='monospace' font-size='16'%3E11011%3C/text%3E%3Ctext x='30' y='140' font-family='monospace' font-size='10'%3E10101%3C/text%3E%3Ctext x='70' y='160' font-family='monospace' font-size='22'%3E01110%3C/text%3E%3Ctext x='10' y='180' font-family='monospace' font-size='18'%3E11010%3C/text%3E%3Ctext x='50' y='200' font-family='monospace' font-size='14'%3E01011%3C/text%3E%3C/g%3E%3C/svg%3E");
        animation: matrixBg 20s linear infinite;
      }
      
      .animate-matrix-bg {
        position: relative;
        overflow: hidden;
      }
      
      .animate-matrix-bg::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                           url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300FF00' fill-opacity='0.3'%3E%3Ctext x='10' y='20' font-family='monospace' font-size='20'%3E10110%3C/text%3E%3Ctext x='50' y='40' font-family='monospace' font-size='15'%3E01010%3C/text%3E%3Ctext x='30' y='60' font-family='monospace' font-size='18'%3E11001%3C/text%3E%3Ctext x='70' y='80' font-family='monospace' font-size='12'%3E10101%3C/text%3E%3Ctext x='10' y='100' font-family='monospace' font-size='14'%3E01010%3C/text%3E%3Ctext x='50' y='120' font-family='monospace' font-size='16'%3E11011%3C/text%3E%3Ctext x='30' y='140' font-family='monospace' font-size='10'%3E10101%3C/text%3E%3Ctext x='70' y='160' font-family='monospace' font-size='22'%3E01110%3C/text%3E%3Ctext x='10' y='180' font-family='monospace' font-size='18'%3E11010%3C/text%3E%3Ctext x='50' y='200' font-family='monospace' font-size='14'%3E01011%3C/text%3E%3C/g%3E%3C/svg%3E");
        animation: matrixBg 15s linear infinite;
        z-index: -1;
      }
      
      .particles-effect {
        position: relative;
      }
      
      .particles-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.3;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.5'%3E%3Ccircle cx='20' cy='30' r='1' /%3E%3Ccircle cx='60' cy='80' r='1.5' /%3E%3Ccircle cx='35' cy='50' r='1' /%3E%3Ccircle cx='90' cy='40' r='2' /%3E%3Ccircle cx='150' cy='70' r='1' /%3E%3Ccircle cx='120' cy='120' r='1.5' /%3E%3Ccircle cx='180' cy='150' r='1' /%3E%3Ccircle cx='40' cy='180' r='2' /%3E%3Ccircle cx='100' cy='170' r='1' /%3E%3Ccircle cx='160' cy='190' r='1.5' /%3E%3C/g%3E%3C/svg%3E");
      }
      
      .smoke-effect {
        position: relative;
      }
      
      .smoke-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.2;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cfilter id='a' x='-50%' y='-50%' width='200%' height='200%'%3E%3CfeGaussianBlur stdDeviation='30' /%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23a)'%3E%3Ccircle cx='50' cy='50' r='20' fill='white' /%3E%3Ccircle cx='150' cy='90' r='15' fill='white' /%3E%3Ccircle cx='90' cy='140' r='25' fill='white' /%3E%3C/g%3E%3C/svg%3E");
      }
      
      .flame-effect {
        position: relative;
      }
      
      .flame-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(0deg, rgba(255,69,0,0.3) 0%, rgba(255,140,0,0.2) 50%, rgba(255,165,0,0.1) 100%);
        filter: blur(4px);
        opacity: 0.6;
        animation: flicker 3s ease-in-out infinite alternate;
      }
      
      @keyframes flicker {
        0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 0.6; }
        20%, 24%, 55% { opacity: 0.4; }
      }
      
      .electric-effect {
        position: relative;
        overflow: hidden;
      }
      
      .electric-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, rgba(0,147,255,0.2) 0%, rgba(0,200,255,0) 50%, rgba(0,147,255,0.2) 100%);
        box-shadow: 0 0 15px 5px rgba(0,147,255,0.5);
        opacity: 0;
        animation: electricPulse 1.5s ease-in-out infinite;
      }
      
      @keyframes electricPulse {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      
      .money-rain-effect {
        position: relative;
      }
      
      .money-rain-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.2;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2392D14F'%3E%3Ctext x='20' y='20' font-family='Arial' font-weight='bold' font-size='20'%3E$%3C/text%3E%3Ctext x='80' y='50' font-family='Arial' font-weight='bold' font-size='24'%3E$%3C/text%3E%3Ctext x='140' y='30' font-family='Arial' font-weight='bold' font-size='18'%3E$%3C/text%3E%3Ctext x='35' y='80' font-family='Arial' font-weight='bold' font-size='22'%3E$%3C/text%3E%3Ctext x='160' y='90' font-family='Arial' font-weight='bold' font-size='20'%3E$%3C/text%3E%3Ctext x='15' y='130' font-family='Arial' font-weight='bold' font-size='18'%3E$%3C/text%3E%3Ctext x='100' y='140' font-family='Arial' font-weight='bold' font-size='24'%3E$%3C/text%3E%3Ctext x='170' y='150' font-family='Arial' font-weight='bold' font-size='20'%3E$%3C/text%3E%3Ctext x='50' y='180' font-family='Arial' font-weight='bold' font-size='22'%3E$%3C/text%3E%3Ctext x='120' y='190' font-family='Arial' font-weight='bold' font-size='18'%3E$%3C/text%3E%3C/g%3E%3C/svg%3E");
        animation: rain 8s linear infinite;
      }
      
      .blood-splatter-effect {
        position: relative;
      }
      
      .blood-splatter-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.3;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='blur' x='-50%' y='-50%' width='200%' height='200%'%3E%3CfeGaussianBlur stdDeviation='3' /%3E%3C/filter%3E%3C/defs%3E%3Cg fill='%23BB0A1E' filter='url(%23blur)'%3E%3Ccircle cx='20' cy='10' r='8' /%3E%3Ccircle cx='180' cy='15' r='10' /%3E%3Ccircle cx='5' cy='150' r='12' /%3E%3Ccircle cx='175' cy='185' r='9' /%3E%3Cellipse cx='10' cy='40' rx='15' ry='7' /%3E%3Cellipse cx='195' cy='80' rx='10' ry='5' /%3E%3Cellipse cx='160' cy='140' rx='14' ry='8' /%3E%3C/g%3E%3C/svg%3E");
      }
      
      .gold-dust-effect {
        position: relative;
      }
      
      .gold-dust-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.3;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFC107' fill-opacity='0.6'%3E%3Ccircle cx='20' cy='30' r='1' /%3E%3Ccircle cx='60' cy='80' r='1.5' /%3E%3Ccircle cx='35' cy='50' r='0.8' /%3E%3Ccircle cx='90' cy='40' r='1.2' /%3E%3Ccircle cx='150' cy='70' r='1' /%3E%3Ccircle cx='120' cy='120' r='1.1' /%3E%3Ccircle cx='180' cy='150' r='0.9' /%3E%3Ccircle cx='40' cy='180' r='1.3' /%3E%3Ccircle cx='100' cy='170' r='1' /%3E%3Ccircle cx='160' cy='190' r='1.2' /%3E%3Ccircle cx='10' cy='100' r='0.7' /%3E%3Ccircle cx='80' cy='10' r='1.1' /%3E%3Ccircle cx='170' cy='40' r='0.8' /%3E%3Ccircle cx='30' cy='130' r='1.2' /%3E%3Ccircle cx='130' cy='30' r='0.9' /%3E%3Ccircle cx='190' cy='110' r='1.3' /%3E%3Ccircle cx='70' cy='190' r='1' /%3E%3C/g%3E%3C/svg%3E");
      }
      
      @keyframes lights {
        0%, 100% { box-shadow: 0 0 16px rgba(255, 0, 0, 0.8), 0 0 32px rgba(255, 0, 0, 0.4), 0 0 48px rgba(255, 0, 0, 0.2); }
        50% { box-shadow: 0 0 16px rgba(0, 0, 255, 0.8), 0 0 32px rgba(0, 0, 255, 0.4), 0 0 48px rgba(0, 0, 255, 0.2); }
      }
      
      .police-lights-effect {
        position: relative;
      }
      
      .police-lights-effect::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.2;
        background: linear-gradient(-45deg, rgba(255,0,0,0.1), rgba(0,0,255,0.1));
        animation: lights 2s ease-in-out infinite;
      }
      
      /* Cherry Blossom Effect */
      .cherry-blossom-corner {
        position: relative;
      }
      
      .cherry-blossom-corner::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        opacity: 0.4;
        background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF6B81'%3E%3Cpath d='M80,10 Q85,15 80,20 Q75,25 80,30 Q85,35 80,40 Q75,45 70,40 Q65,35 70,30 Q75,25 70,20 Q65,15 70,10 Q75,5 80,10 Z' /%3E%3Cpath d='M60,15 Q65,20 60,25 Q55,30 60,35 Q65,40 60,45 Q55,50 50,45 Q45,40 50,35 Q55,30 50,25 Q45,20 50,15 Q55,10 60,15 Z' /%3E%3Cpath d='M40,30 Q45,35 40,40 Q35,45 40,50 Q45,55 40,60 Q35,65 30,60 Q25,55 30,50 Q35,45 30,40 Q25,35 30,30 Q35,25 40,30 Z' /%3E%3C/g%3E%3C/svg%3E");
      }
      
      /* Matrix code effect */
      .matrix-code {
        position: relative;
      }
      
      .matrix-code::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300FF00' fill-opacity='0.3'%3E%3Ctext x='10' y='20' font-family='monospace' font-size='20'%3E10110%3C/text%3E%3Ctext x='50' y='40' font-family='monospace' font-size='15'%3E01010%3C/text%3E%3Ctext x='30' y='60' font-family='monospace' font-size='18'%3E11001%3C/text%3E%3Ctext x='70' y='80' font-family='monospace' font-size='12'%3E10101%3C/text%3E%3Ctext x='10' y='100' font-family='monospace' font-size='14'%3E01010%3C/text%3E%3Ctext x='50' y='120' font-family='monospace' font-size='16'%3E11011%3C/text%3E%3Ctext x='30' y='140' font-family='monospace' font-size='10'%3E10101%3C/text%3E%3Ctext x='70' y='160' font-family='monospace' font-size='22'%3E01110%3C/text%3E%3Ctext x='10' y='180' font-family='monospace' font-size='18'%3E11010%3C/text%3E%3Ctext x='50' y='200' font-family='monospace' font-size='14'%3E01011%3C/text%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.15;
        animation: matrixBg 20s linear infinite;
        z-index: -1;
      }
    `}</style>
  );
}