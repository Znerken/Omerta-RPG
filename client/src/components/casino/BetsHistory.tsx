import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Check, X, Dices, Clock, SquareStack, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types
type CasinoBet = {
  id: number;
  gameId: number;
  userId: number;
  betAmount: number;
  status: string;
  result: {
    win: boolean;
    amount: number;
    details?: {
      [key: string]: any;
    };
  };
  createdAt: string;
  settledAt: string;
  game: {
    name: string;
    type: string;
  };
};

interface BetsHistoryProps {
  bets: CasinoBet[];
  isLoading: boolean;
}

export function BetsHistory({ bets, isLoading }: BetsHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-amber-500 border-r-2 border-amber-500/30 border-b-2 border-amber-500/10 border-l-2 border-amber-500/50"></div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg bg-black/20">
        <Dices className="h-12 w-12 mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-400">No bets yet</h3>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
          Your betting history will appear here once you've played some games.
        </p>
      </div>
    );
  }

  // Function to get game-specific icon
  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case "dice":
        return <Dices className="h-4 w-4" />;
      case "slots":
        return <SquareStack className="h-4 w-4" />;
      case "roulette":
        return <div className="h-4 w-4 rounded-full border border-current"></div>;
      case "blackjack":
        return <BarChart className="h-4 w-4" />;
      default:
        return <Dices className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {bets.map((bet, index) => (
        <motion.div
          key={bet.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="rounded-lg border border-gray-800 bg-black/30 backdrop-blur-sm overflow-hidden shadow-md"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  bet.result.win 
                    ? "bg-green-900/30 text-green-500 border border-green-600/30" 
                    : "bg-red-900/30 text-red-500 border border-red-600/30"
                }`}>
                  {bet.result.win ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-white">{bet.game.name}</h4>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Badge 
                      variant="outline" 
                      className="mr-2 px-2 py-0 h-5 flex items-center space-x-1 bg-black/40 border-gray-800"
                    >
                      {getGameIcon(bet.game.type)}
                      <span className="capitalize ml-1">{bet.game.type}</span>
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">{format(new Date(bet.createdAt), "PPpp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${
                  bet.result.win ? "text-green-500" : "text-red-500"
                }`}>
                  {bet.result.win ? "+" : "-"}${bet.result.win ? bet.result.amount : bet.betAmount}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {bet.result.win ? "Win" : "Loss"} · Bet: ${bet.betAmount}
                </div>
              </div>
            </div>
            
            {/* Details (show if available) */}
            {bet.result.details && Object.keys(bet.result.details).length > 0 && (
              <>
                <Separator className="my-3 bg-gray-800/40" />
                <div className="text-xs text-gray-500 bg-gray-900/30 rounded-md p-2">
                  {bet.game.type === "dice" && bet.result.details.diceValue && (
                    <div className="flex justify-between">
                      <span>Rolled: {bet.result.details.diceValue}</span>
                      <span>Prediction: {bet.result.details.prediction} than {bet.result.details.targetNumber}</span>
                    </div>
                  )}
                  {bet.game.type === "slots" && bet.result.details.reels && (
                    <div className="flex justify-between">
                      <span>Lines: {bet.result.details.lines}</span>
                      <span>Winning lines: {bet.result.details.winningLines?.length || 0}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}