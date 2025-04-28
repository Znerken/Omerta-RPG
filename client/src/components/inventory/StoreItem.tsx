import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  DollarSign, 
  Award, 
  Heart, 
  Brain, 
  Lock, 
  Unlock, 
  ShoppingCart, 
  Ban, 
  Crosshair, 
  Sword, 
  Drill, 
  Shield, 
  Cherry, 
  Sparkles
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface StoreItemProps {
  item: {
    id: number;
    name: string;
    description: string;
    type: string;
    price: number;
    strengthBonus: number;
    stealthBonus: number;
    charismaBonus: number;
    intelligenceBonus: number;
    crimeSuccessBonus: number;
    jailTimeReduction: number;
    escapeChanceBonus: number;
    rarity?: string;
    imageUrl?: string;
    category?: string;
    level?: number;
  };
  onBuy: () => void;
  isBuying: boolean;
  canAfford: boolean;
}

export function StoreItem({ item, onBuy, isBuying, canAfford }: StoreItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getTypeIcon = () => {
    switch (item.type) {
      case "weapon":
        return <Sword className="h-4 w-4 mr-1" />;
      case "tool":
        return <Drill className="h-4 w-4 mr-1" />;
      case "protection":
        return <Shield className="h-4 w-4 mr-1" />;
      case "consumable":
        return <Cherry className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = () => {
    if (!item.category) return null;
    
    switch (item.category) {
      case "melee":
        return <Sword className="h-4 w-4 mr-1" />;
      case "ranged":
        return <Crosshair className="h-4 w-4 mr-1" />;
      case "armor":
        return <Shield className="h-4 w-4 mr-1" />;
      case "accessory":
        return <Sparkles className="h-4 w-4 mr-1" />;
      case "tool":
        return <Drill className="h-4 w-4 mr-1" />;
      case "consumable":
        return <Cherry className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getStatIcon = (statName: string) => {
    switch (statName.toLowerCase()) {
      case "strength":
        return <Sword className="h-3 w-3 mr-1 inline" />;
      case "stealth":
        return <Ban className="h-3 w-3 mr-1 inline" />;
      case "charisma":
        return <Heart className="h-3 w-3 mr-1 inline" />;
      case "intelligence":
        return <Brain className="h-3 w-3 mr-1 inline" />;
      case "crime success":
        return <Crosshair className="h-3 w-3 mr-1 inline" />;
      case "jail time":
        return <Lock className="h-3 w-3 mr-1 inline" />;
      case "escape chance":
        return <Unlock className="h-3 w-3 mr-1 inline" />;
      default:
        return null;
    }
  };

  const getRarityColor = () => {
    if (!item.rarity) return "";
    
    switch (item.rarity.toLowerCase()) {
      case "common":
        return "border-gray-500 bg-gray-900 bg-opacity-50 text-gray-300";
      case "uncommon":
        return "border-green-500 bg-green-900 bg-opacity-30 text-green-300";
      case "rare":
        return "border-blue-500 bg-blue-900 bg-opacity-30 text-blue-300";
      case "epic":
        return "border-purple-500 bg-purple-900 bg-opacity-30 text-purple-300";
      case "legendary":
        return "border-amber-500 bg-amber-900 bg-opacity-30 text-amber-300";
      default:
        return "";
    }
  };

  const getRarityBadgeVariant = () => {
    if (!item.rarity) return "outline";
    
    switch (item.rarity.toLowerCase()) {
      case "common":
        return "outline";
      case "uncommon":
        return "secondary";
      case "rare":
        return "default";
      case "epic":
        return "destructive";
      case "legendary":
        return "gold";
      default:
        return "outline";
    }
  };

  const getRarityGlow = () => {
    if (!item.rarity) return "";
    
    switch (item.rarity.toLowerCase()) {
      case "legendary":
        return 'shadow-[0_0_15px_rgba(245,158,11,0.5)]';
      case "epic":
        return 'shadow-[0_0_10px_rgba(139,92,246,0.4)]';
      default:
        return '';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate a default image based on item type
  const getDefaultImage = () => {
    switch (item.type) {
      case "weapon":
        // Use one of the locally extracted weapon images
        const weaponImages = [
          "/images/items/weapons/Thompson.png",
          "/images/items/weapons/BAR.png",
          "/images/items/weapons/Colt M1911.png",
          "/images/items/weapons/MP 40.png",
          "/images/items/weapons/StG 44.png"
        ];
        return weaponImages[Math.floor(Math.random() * weaponImages.length)];
      case "tool":
        return "/images/items/tools/tool.png";
      case "protection":
        return "/images/items/protection/armor.png";
      case "consumable":
        return "/images/items/consumables/potion.png";
      default:
        // Use a mafia themed placeholder
        return "/images/items/gen-mafia-gangster-organized-crime-suit-man-photoreali.webp";
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`bg-dark-lighter border overflow-hidden h-full ${getRarityColor()} ${getRarityGlow()}`}>
        <div className="relative">
          <div className="h-48 overflow-hidden relative">
            {!imageError && item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
                }}
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-800 to-gray-900">
                <img 
                  src={getDefaultImage()}
                  alt={item.name}
                  className="w-2/3 h-2/3 object-contain transition-transform duration-500 ease-in-out"
                  style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          
          <div className="absolute top-2 left-2 flex space-x-2">
            {item.rarity && (
              <Badge variant={getRarityBadgeVariant() as any} className="uppercase text-xs font-bold">
                {item.rarity}
              </Badge>
            )}
          </div>
          
          <div className="absolute top-2 right-2">
            <Badge 
              variant={canAfford ? "outline" : "destructive"} 
              className={`${canAfford ? 'bg-black/70' : 'bg-red-950/70'} backdrop-blur-sm`}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(item.price || 0)}
            </Badge>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-bold text-white text-lg tracking-tight leading-none">
                  {item.name || 'Unknown Item'}
                </h3>
                <div className="flex space-x-2 mt-1">
                  {item.category ? (
                    <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
                      {getCategoryIcon()}
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                  ) : item.type && (
                    <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
                      {getTypeIcon()}
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  )}
                  
                  {item.level && item.level > 1 && (
                    <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
                      <Award className="h-3 w-3 mr-1" />
                      Level {item.level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <p className="text-sm text-gray-400 mb-3">{item.description || 'No description available'}</p>
          
          <div className="space-y-1 mb-3">
            {item.strengthBonus !== undefined && item.strengthBonus !== 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("strength")} Strength</span>
                <span className={`font-mono px-2 py-0.5 rounded ${item.strengthBonus > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                  {item.strengthBonus > 0 ? "+" : ""}{item.strengthBonus}
                </span>
              </div>
            )}
            {item.stealthBonus !== undefined && item.stealthBonus !== 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("stealth")} Stealth</span>
                <span className={`font-mono px-2 py-0.5 rounded ${item.stealthBonus > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                  {item.stealthBonus > 0 ? "+" : ""}{item.stealthBonus}
                </span>
              </div>
            )}
            {item.charismaBonus !== undefined && item.charismaBonus !== 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("charisma")} Charisma</span>
                <span className={`font-mono px-2 py-0.5 rounded ${item.charismaBonus > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                  {item.charismaBonus > 0 ? "+" : ""}{item.charismaBonus}
                </span>
              </div>
            )}
            {item.intelligenceBonus !== undefined && item.intelligenceBonus !== 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("intelligence")} Intelligence</span>
                <span className={`font-mono px-2 py-0.5 rounded ${item.intelligenceBonus > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                  {item.intelligenceBonus > 0 ? "+" : ""}{item.intelligenceBonus}
                </span>
              </div>
            )}
            {item.crimeSuccessBonus !== undefined && item.crimeSuccessBonus > 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("crime success")} Crime Success</span>
                <span className="font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-400">+{item.crimeSuccessBonus}%</span>
              </div>
            )}
            {item.jailTimeReduction !== undefined && item.jailTimeReduction > 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("jail time")} Jail Time</span>
                <span className="font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-400">-{item.jailTimeReduction}%</span>
              </div>
            )}
            {item.escapeChanceBonus !== undefined && item.escapeChanceBonus > 0 && (
              <div className="flex justify-between text-xs items-center">
                <span>{getStatIcon("escape chance")} Escape Chance</span>
                <span className="font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-400">+{item.escapeChanceBonus}%</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            className={`w-full relative overflow-hidden group ${!canAfford ? 'bg-gray-700 hover:bg-gray-600' : 'bg-primary hover:bg-primary/80'}`}
            disabled={isBuying || !canAfford}
            onClick={onBuy}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent scale-x-150 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {isBuying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Buying...
              </>
            ) : !canAfford ? (
              "Not Enough Cash"
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" /> 
                Buy Item
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}