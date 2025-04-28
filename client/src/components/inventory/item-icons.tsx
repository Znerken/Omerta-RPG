import { 
  Sword, 
  Shield, 
  Drill, 
  Cherry, 
  AlertTriangle, 
  Crosshair, 
  Sparkles, 
  Circle, 
  FileQuestion
} from "lucide-react";

// Type definitions
type ItemType = "weapon" | "tool" | "protection" | "consumable";
type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type ItemCategory = "melee" | "ranged" | "armor" | "accessory" | "tool" | "consumable" | "vehicle";

// Item icon mapping
export const getItemTypeIcon = (type: ItemType | string) => {
  switch (type?.toLowerCase()) {
    case "weapon":
      return <Sword className="h-full w-full" />;
    case "tool":
      return <Drill className="h-full w-full" />;
    case "protection":
      return <Shield className="h-full w-full" />;
    case "consumable":
      return <Cherry className="h-full w-full" />;
    default:
      return <FileQuestion className="h-full w-full" />;
  }
};

export const getCategoryIcon = (category: ItemCategory | string) => {
  switch (category?.toLowerCase()) {
    case "melee":
      return <Sword className="h-full w-full" />;
    case "ranged":
      return <Crosshair className="h-full w-full" />;
    case "armor":
      return <Shield className="h-full w-full" />;
    case "accessory":
      return <Sparkles className="h-full w-full" />;
    case "tool":
      return <Drill className="h-full w-full" />;
    case "consumable":
      return <Cherry className="h-full w-full" />;
    case "vehicle":
      return <Circle className="h-full w-full" />;
    default:
      return <AlertTriangle className="h-full w-full" />;
  }
};

// Rarity colors
export const getRarityColor = (rarity: ItemRarity | string | undefined) => {
  if (!rarity) return "";
  
  switch (rarity.toLowerCase()) {
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

export const getRarityBadgeVariant = (rarity: ItemRarity | string | undefined) => {
  if (!rarity) return "outline";
  
  switch (rarity.toLowerCase()) {
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

export const getRarityGlow = (rarity: ItemRarity | string | undefined) => {
  if (!rarity) return "";
  
  switch (rarity.toLowerCase()) {
    case "legendary":
      return 'shadow-[0_0_15px_rgba(245,158,11,0.5)]';
    case "epic":
      return 'shadow-[0_0_10px_rgba(139,92,246,0.4)]';
    default:
      return '';
  }
};

// Generic fallback item image placeholder component
interface ItemPlaceholderProps {
  type?: ItemType | string;
  rarity?: ItemRarity | string;
  size?: number;
  className?: string;
}

export const ItemPlaceholder = ({ 
  type = "weapon", 
  rarity = "common", 
  size = 64,
  className = ""
}: ItemPlaceholderProps) => {
  // Get appropriate icon
  const ItemIcon = () => getItemTypeIcon(type);
  
  // Get rarity color
  const bgColor = (() => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-gray-800";
      case "uncommon":
        return "bg-green-900";
      case "rare":
        return "bg-blue-900";
      case "epic":
        return "bg-purple-900";
      case "legendary":
        return "bg-amber-900";
      default:
        return "bg-gray-800";
    }
  })();
  
  const borderColor = (() => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "border-gray-500";
      case "uncommon":
        return "border-green-500";
      case "rare":
        return "border-blue-500";
      case "epic":
        return "border-purple-500";
      case "legendary":
        return "border-amber-500";
      default:
        return "border-gray-500";
    }
  })();
  
  return (
    <div 
      className={`flex items-center justify-center ${bgColor} ${borderColor} border-2 rounded-md overflow-hidden ${className}`} 
      style={{ width: size, height: size }}
    >
      <div className="opacity-70 w-3/5 h-3/5 text-white">
        <ItemIcon />
      </div>
    </div>
  );
};