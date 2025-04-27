import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { LucideInfo, AlertTriangle, Loader2 } from "lucide-react";
import { CasinoLayout } from "@/components/casino/CasinoLayout";
import { GameCard } from "@/components/casino/GameCard";
import { DiceGame } from "@/components/casino/DiceGame";
import { SlotMachine } from "@/components/casino/SlotMachine";
import { BetsHistory } from "@/components/casino/BetsHistory";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
type CasinoGame = {
  id: number;
  name: string;
  type: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
  isActive: boolean;
  imageUrl?: string;
};

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

type CasinoStat = {
  gameId: number;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  biggestWin: number;
  biggestLoss: number;
  game: {
    name: string;
    type: string;
  };
};

export default function NewCasinoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("games");
  const [activeGame, setActiveGame] = useState<CasinoGame | null>(null);
  const [betResult, setBetResult] = useState<any | null>(null);
  const [showBetResult, setShowBetResult] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Fetch user balance
  // In a real implementation, this would be from a user context
  useEffect(() => {
    // Simulate user balance
    setUserBalance(5000);
  }, []);

  // Fetch casino games
  const {
    data: games,
    isLoading: gamesLoading,
    error: gamesError,
  } = useQuery({
    queryKey: ["/api/casino/games"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/casino/games");
      return await res.json();
    },
  });

  // Fetch recent bets
  const {
    data: bets,
    isLoading: betsLoading,
    error: betsError,
  } = useQuery({
    queryKey: ["/api/casino/bets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/casino/bets");
      return await res.json();
    },
  });

  // Fetch casino stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/casino/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/casino/stats");
      return await res.json();
    },
  });

  // Place bet mutation
  const placeBetMutation = useMutation<
    any, 
    Error,
    { gameId: number; betAmount: number; betDetails: any }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/casino/place-bet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/casino/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      setBetResult(data);
      setShowBetResult(true);
      setUserBalance(prev => data.bet.result.win 
        ? prev + data.bet.result.amount 
        : prev - data.bet.betAmount);
      
      toast({
        title: data.bet.result.win ? "You won!" : "You lost!",
        description: data.bet.result.win
          ? `You won $${data.bet.result.amount}`
          : `You lost $${data.bet.betAmount}`,
        variant: data.bet.result.win ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bet failed",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  // Render stats section
  const renderStats = () => {
    if (statsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      );
    }

    if (!stats || stats.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg bg-black/20">
          <LucideInfo className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No stats yet</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            Play some games to see your casino statistics.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat: CasinoStat) => (
          <motion.div
            key={stat.gameId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            <div className="bg-gradient-to-b from-gray-800/60 to-transparent px-4 py-3">
              <h3 className="font-medium text-white">{stat.game.name}</h3>
              <p className="text-xs text-gray-400 capitalize">{stat.game.type} Game</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Bets</p>
                  <p className="text-lg font-mono font-semibold text-white">{stat.totalBets}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Wagered</p>
                  <p className="text-lg font-mono font-semibold text-green-500">${stat.totalWagered.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Won</p>
                  <p className="text-lg font-mono font-semibold text-green-400">${stat.totalWon.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Lost</p>
                  <p className="text-lg font-mono font-semibold text-red-400">${stat.totalLost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Biggest Win</p>
                  <p className="text-lg font-mono font-semibold text-green-500">${stat.biggestWin.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Biggest Loss</p>
                  <p className="text-lg font-mono font-semibold text-red-500">${stat.biggestLoss.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Win/Loss Ratio</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400"
                    style={{ 
                      width: `${(stat.totalWon / (stat.totalWon + stat.totalLost || 1)) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-green-500">{((stat.totalWon / (stat.totalWon + stat.totalLost || 1)) * 100).toFixed(1)}%</span>
                  <span className="text-red-500">{((stat.totalLost / (stat.totalWon + stat.totalLost || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Render game selection
  const renderGameSelection = () => {
    if (gamesLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      );
    }

    if (!games || games.length === 0) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No games available</AlertTitle>
          <AlertDescription>
            There are no casino games available. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game: CasinoGame) => (
          <GameCard
            key={game.id}
            id={game.id}
            name={game.name}
            type={game.type}
            description={game.description}
            minBet={game.minBet}
            maxBet={game.maxBet}
            houseEdge={game.houseEdge}
            imageUrl={game.imageUrl}
            active={activeGame?.id === game.id}
            onSelect={(id) => setActiveGame(games.find((g: CasinoGame) => g.id === id) || null)}
          />
        ))}
      </div>
    );
  };

  // Render active game
  const renderActiveGame = () => {
    if (!activeGame) {
      return (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg bg-black/20">
          <LucideInfo className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">Select a game</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            Choose a game from the list to start playing.
          </p>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setActiveGame(null)}
          className="absolute -top-2 -left-2 bg-black/60 hover:bg-black/80 border border-gray-800 text-gray-400 hover:text-white rounded-full p-1 text-xs z-10 transition-colors"
        >
          ← Back to games
        </button>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pt-8"
          >
            {activeGame.type === "dice" && (
              <DiceGame 
                game={activeGame} 
                onPlaceBet={placeBetMutation.mutate}
                betResult={betResult}
                isPlacingBet={placeBetMutation.isPending}
              />
            )}
            {activeGame.type === "slots" && (
              <SlotMachine 
                game={activeGame} 
                onPlaceBet={placeBetMutation.mutate}
                betResult={betResult}
                isPlacingBet={placeBetMutation.isPending}
              />
            )}
            {/* Add other game components here */}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // Main content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "games":
        return (
          <div className="space-y-8">
            {activeGame ? renderActiveGame() : renderGameSelection()}
          </div>
        );
      case "bets":
        return <BetsHistory bets={bets || []} isLoading={betsLoading} />;
      case "stats":
        return renderStats();
      default:
        return null;
    }
  };

  return (
    <CasinoLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userBalance={userBalance}
    >
      {renderTabContent()}
    </CasinoLayout>
  );
}