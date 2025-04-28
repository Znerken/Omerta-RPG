import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sword, Drill, Shield, Cherry, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ItemProps {
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
    equipped: boolean;
    quantity: number;
  };
  onToggleEquip: () => void;
  isEquipping: boolean;
}

export function InventoryItem({ item, onToggleEquip, isEquipping }: ItemProps) {
  const getTypeIcon = () => {
    if (!item.type) return null;
    
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

  const getTypeColor = () => {
    if (!item.type) return "";
    
    switch (item.type) {
      case "weapon":
        return "bg-red-900 bg-opacity-20 text-red-400";
      case "tool":
        return "bg-green-900 bg-opacity-20 text-green-400";
      case "protection":
        return "bg-blue-900 bg-opacity-20 text-blue-400";
      case "consumable":
        return "bg-purple-900 bg-opacity-20 text-purple-400";
      default:
        return "";
    }
  };

  return (
    <Card className="bg-dark-lighter border-gray-700 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.name || 'Unknown Item'}</CardTitle>
            <div className="flex space-x-2 mt-1">
              <Badge variant="outline" className={getTypeColor()}>
                {getTypeIcon()}
                {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item'}
              </Badge>
              {item.equipped && (
                <Badge variant="default" className="bg-secondary text-black">
                  <Check className="h-3 w-3 mr-1" />
                  Equipped
                </Badge>
              )}
              {item.quantity !== undefined && item.quantity > 1 && (
                <Badge variant="outline">
                  x{item.quantity}
                </Badge>
              )}
            </div>
          </div>
          <Badge className="font-mono">
            Value: {formatCurrency(item.price || 0)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-gray-400 mb-3">{item.description || 'No description available'}</p>
        
        <div className="space-y-1 mb-3">
          {item.strengthBonus !== undefined && item.strengthBonus !== 0 && (
            <div className="flex justify-between text-xs">
              <span>Strength</span>
              <span className={item.strengthBonus > 0 ? "text-green-500" : "text-red-500"}>
                {item.strengthBonus > 0 ? "+" : ""}{item.strengthBonus}
              </span>
            </div>
          )}
          {item.stealthBonus !== undefined && item.stealthBonus !== 0 && (
            <div className="flex justify-between text-xs">
              <span>Stealth</span>
              <span className={item.stealthBonus > 0 ? "text-green-500" : "text-red-500"}>
                {item.stealthBonus > 0 ? "+" : ""}{item.stealthBonus}
              </span>
            </div>
          )}
          {item.charismaBonus !== undefined && item.charismaBonus !== 0 && (
            <div className="flex justify-between text-xs">
              <span>Charisma</span>
              <span className={item.charismaBonus > 0 ? "text-green-500" : "text-red-500"}>
                {item.charismaBonus > 0 ? "+" : ""}{item.charismaBonus}
              </span>
            </div>
          )}
          {item.intelligenceBonus !== undefined && item.intelligenceBonus !== 0 && (
            <div className="flex justify-between text-xs">
              <span>Intelligence</span>
              <span className={item.intelligenceBonus > 0 ? "text-green-500" : "text-red-500"}>
                {item.intelligenceBonus > 0 ? "+" : ""}{item.intelligenceBonus}
              </span>
            </div>
          )}
          {item.crimeSuccessBonus !== undefined && item.crimeSuccessBonus > 0 && (
            <div className="flex justify-between text-xs">
              <span>Crime Success</span>
              <span className="text-green-500">+{item.crimeSuccessBonus}%</span>
            </div>
          )}
          {item.jailTimeReduction !== undefined && item.jailTimeReduction > 0 && (
            <div className="flex justify-between text-xs">
              <span>Jail Time</span>
              <span className="text-green-500">-{item.jailTimeReduction}%</span>
            </div>
          )}
          {item.escapeChanceBonus !== undefined && item.escapeChanceBonus > 0 && (
            <div className="flex justify-between text-xs">
              <span>Escape Chance</span>
              <span className="text-green-500">+{item.escapeChanceBonus}%</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {item.type === "consumable" ? (
          <Button 
            className="w-full bg-primary hover:bg-primary/80" 
            disabled={isEquipping}
            onClick={onToggleEquip}
          >
            {isEquipping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Using...
              </>
            ) : (
              <>
                <Cherry className="mr-2 h-4 w-4" /> 
                Use Item
              </>
            )}
          </Button>
        ) : (
          <Button 
            className={`w-full ${item.equipped ? 'bg-dark hover:bg-dark/80' : 'bg-primary hover:bg-primary/80'}`} 
            disabled={isEquipping}
            onClick={onToggleEquip}
          >
            {isEquipping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {item.equipped ? "Unequipping..." : "Equipping..."}
              </>
            ) : (
              <>
                {item.equipped ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> 
                    Unequip
                  </>
                ) : (
                  <>
                    {getTypeIcon()}
                    Equip Item
                  </>
                )}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
