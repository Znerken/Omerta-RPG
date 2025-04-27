import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, PercentIcon, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GameCardProps {
  id: number;
  name: string;
  type: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
  imageUrl?: string;
  active: boolean;
  onSelect: (id: number) => void;
}

export function GameCard({
  id,
  name,
  type,
  description,
  minBet,
  maxBet,
  houseEdge,
  imageUrl,
  active,
  onSelect
}: GameCardProps) {
  // Enhanced background gradients based on game type with noir mafia aesthetic
  const defaultBackgrounds = {
    dice: "radial-gradient(circle at top right, rgba(76, 29, 149, 0.4), rgba(0, 0, 0, 0)), linear-gradient(165deg, #1a1a29, #0d0d14), repeating-linear-gradient(90deg, rgba(20, 20, 40, 0.05) 0px, rgba(20, 20, 40, 0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(20, 20, 40, 0.05) 0px, rgba(20, 20, 40, 0.05) 1px, transparent 1px, transparent 60px), linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",
    slots: "radial-gradient(circle at top right, rgba(185, 28, 28, 0.4), rgba(0, 0, 0, 0)), linear-gradient(165deg, #291a1a, #140d0d), repeating-linear-gradient(90deg, rgba(40, 20, 20, 0.05) 0px, rgba(40, 20, 20, 0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(40, 20, 20, 0.05) 0px, rgba(40, 20, 20, 0.05) 1px, transparent 1px, transparent 60px), linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",
    roulette: "radial-gradient(circle at top right, rgba(5, 102, 54, 0.4), rgba(0, 0, 0, 0)), linear-gradient(165deg, #1a291e, #0d1409), repeating-linear-gradient(90deg, rgba(20, 40, 30, 0.05) 0px, rgba(20, 40, 30, 0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(20, 40, 30, 0.05) 0px, rgba(20, 40, 30, 0.05) 1px, transparent 1px, transparent 60px), linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",
    blackjack: "radial-gradient(circle at top right, rgba(120, 53, 15, 0.4), rgba(0, 0, 0, 0)), linear-gradient(165deg, #291f1a, #140f0a), repeating-linear-gradient(90deg, rgba(40, 30, 20, 0.05) 0px, rgba(40, 30, 20, 0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(40, 30, 20, 0.05) 0px, rgba(40, 30, 20, 0.05) 1px, transparent 1px, transparent 60px), linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",
  };

  // Game icons
  const gameIcons = {
    dice: "🎲",
    slots: "🎰",
    roulette: "⚫",
    blackjack: "♠️",
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)" }}
      className={`group relative rounded-lg overflow-hidden h-full border ${
        active 
          ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
          : 'border-gray-800 hover:border-gray-700'
      }`}
      style={{ 
        background: imageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${imageUrl})` 
          : defaultBackgrounds[type as keyof typeof defaultBackgrounds] || defaultBackgrounds.dice,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top game badge */}
      <div className="absolute top-3 left-3 flex items-center space-x-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-filter backdrop-blur-sm text-lg">
          {gameIcons[type as keyof typeof gameIcons] || "🎮"}
        </div>
        <Badge variant="outline" className="bg-black/60 backdrop-filter backdrop-blur-sm text-amber-300 border-amber-900/50">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      </div>

      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-3 font-bold text-xl text-white">{name}</div>
        <p className="text-sm text-gray-300 mb-4">{description}</p>

        {/* Game stats */}
        <div className="mt-auto space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center text-gray-400">
              <DollarSign className="h-3.5 w-3.5 mr-1 text-green-500" />
              <span>Bet Range</span>
            </div>
            <div className="font-medium text-green-400">${minBet} - ${maxBet}</div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center text-gray-400">
              <PercentIcon className="h-3.5 w-3.5 mr-1 text-red-500" />
              <span>House Edge</span>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 ml-1 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/80 border-gray-800 text-white text-xs">
                    <p>Lower is better for players</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="font-medium text-gray-300">{houseEdge}%</div>
          </div>
        </div>

        {/* Button */}
        <Button 
          variant={active ? "default" : "secondary"} 
          size="sm" 
          className={`mt-4 w-full ${
            active 
              ? 'bg-amber-700 hover:bg-amber-600 text-white border border-amber-500/30' 
              : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
          }`}
          onClick={() => onSelect(id)}
        >
          {active ? "Currently Playing" : "Play Now"}
        </Button>
      </div>

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
    </motion.div>
  );
}