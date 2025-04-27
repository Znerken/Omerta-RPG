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

  // Mock casino games for development
  const mockGames: CasinoGame[] = [
    {
      id: 1,
      name: "Lucky Dice",
      type: "dice",
      description: "Predict if the dice will roll higher, lower, or exactly your target number.",
      minBet: 10,
      maxBet: 10000,
      houseEdge: 0.05,
      isActive: true,
      imageUrl: "https://i.imgur.com/jYCFwkP.png"
    },
    {
      id: 2,
      name: "Mafia Slots",
      type: "slots",
      description: "Match symbols to win big in this classic slot machine game.",
      minBet: 25,
      maxBet: 5000,
      houseEdge: 0.08,
      isActive: true,
      imageUrl: "https://i.imgur.com/S1JbRQ1.png"
    },
    {
      id: 3,
      name: "Family Roulette",
      type: "roulette",
      description: "Place your bets on where the ball will land.",
      minBet: 50,
      maxBet: 20000,
      houseEdge: 0.053,
      isActive: true,
      imageUrl: "https://i.imgur.com/PZTJnhY.png"
    },
    {
      id: 4,
      name: "Consigliere Blackjack",
      type: "blackjack",
      description: "Beat the dealer's hand without going over 21.",
      minBet: 100,
      maxBet: 50000,
      houseEdge: 0.02,
      isActive: true,
      imageUrl: "https://i.imgur.com/Q2pXfDY.png"
    }
  ];
  
  // Fetch casino games with fallback to mock data during development
  const {
    data: games,
    isLoading: gamesLoading,
    error: gamesError,
  } = useQuery({
    queryKey: ["/api/casino/games"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/casino/games");
        const data = await res.json();
        // If we get an empty array or error, fall back to mock data
        return data && data.length > 0 ? data : mockGames;
      } catch (error) {
        console.log("Using mock casino games during development");
        return mockGames;
      }
    },
    initialData: mockGames // Use mock data immediately while fetching
  });

  // Mock bets for development
  const mockBets: CasinoBet[] = [
    {
      id: 1,
      gameId: 1,
      userId: 1,
      betAmount: 100,
      status: "won",
      result: {
        win: true,
        amount: 180,
        details: {
          target: 50,
          roll: 65,
          prediction: "higher"
        }
      },
      createdAt: "2025-04-20T15:32:10Z",
      settledAt: "2025-04-20T15:32:12Z",
      game: {
        name: "Lucky Dice",
        type: "dice"
      }
    },
    {
      id: 2,
      gameId: 2,
      userId: 1,
      betAmount: 50,
      status: "lost",
      result: {
        win: false,
        amount: 0,
        details: {
          symbols: ["cherry", "lemon", "orange"]
        }
      },
      createdAt: "2025-04-20T14:22:45Z",
      settledAt: "2025-04-20T14:22:48Z",
      game: {
        name: "Mafia Slots",
        type: "slots"
      }
    },
    {
      id: 3,
      gameId: 1,
      userId: 1,
      betAmount: 200,
      status: "won",
      result: {
        win: true,
        amount: 350,
        details: {
          target: 30,
          roll: 12,
          prediction: "lower"
        }
      },
      createdAt: "2025-04-19T23:12:03Z",
      settledAt: "2025-04-19T23:12:06Z",
      game: {
        name: "Lucky Dice",
        type: "dice"
      }
    }
  ];
  
  // Fetch recent bets with fallback to mock data
  const {
    data: bets,
    isLoading: betsLoading,
    error: betsError,
  } = useQuery({
    queryKey: ["/api/casino/bets"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/casino/bets");
        const data = await res.json();
        return data && data.length > 0 ? data : mockBets;
      } catch (error) {
        console.log("Using mock bets during development");
        return mockBets;
      }
    },
    initialData: mockBets
  });

  // Mock stats for development
  const mockStats: CasinoStat[] = [
    {
      gameId: 1,
      totalBets: 22,
      totalWagered: 2400,
      totalWon: 3800,
      totalLost: 1200,
      biggestWin: 500,
      biggestLoss: 300,
      game: {
        name: "Lucky Dice",
        type: "dice"
      }
    },
    {
      gameId: 2,
      totalBets: 15,
      totalWagered: 1800,
      totalWon: 1200,
      totalLost: 1900,
      biggestWin: 350,
      biggestLoss: 250,
      game: {
        name: "Mafia Slots",
        type: "slots"
      }
    }
  ];
  
  // Fetch casino stats with fallback to mock data
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/casino/stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/casino/stats");
        const data = await res.json();
        return data && data.length > 0 ? data : mockStats;
      } catch (error) {
        console.log("Using mock stats during development");
        return mockStats;
      }
    },
    initialData: mockStats
  });

  // Place bet mutation with mock response during development
  const placeBetMutation = useMutation<
    any, 
    Error,
    { gameId: number; betAmount: number; betDetails: any }
  >({
    mutationFn: async (data) => {
      try {
        const res = await apiRequest("POST", "/api/casino/place-bet", data);
        return await res.json();
      } catch (error) {
        console.log("Using mock bet response during development");
        // Simulate API response based on bet type
        const isWin = Math.random() > 0.5; // 50% chance of winning for testing
        let winAmount = 0;
        let resultDetails = {};
        
        if (data.gameId === 1) { // Dice game
          const prediction = data.betDetails.prediction;
          const target = data.betDetails.target;
          const roll = Math.floor(Math.random() * 100) + 1;
          
          let win = false;
          if (prediction === "higher" && roll > target) win = true;
          if (prediction === "lower" && roll < target) win = true;
          if (prediction === "equal" && roll === target) win = true;
          
          winAmount = win ? data.betAmount * (prediction === "equal" ? 10 : 1.8) : 0;
          
          resultDetails = {
            target,
            roll,
            prediction
          };
        } else if (data.gameId === 2) { // Slot machine
          const symbols = ["cherry", "lemon", "orange", "grapes", "seven", "bar"];
          const result = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
          ];
          
          // Check for winning combinations
          let win = false;
          if (result[0] === result[1] && result[1] === result[2]) {
            win = true;
            // Multiplier based on symbol value
            const multiplier = result[0] === "seven" ? 20 :
                             result[0] === "bar" ? 15 :
                             result[0] === "grapes" ? 10 :
                             result[0] === "orange" ? 8 :
                             result[0] === "lemon" ? 5 : 3;
            winAmount = data.betAmount * multiplier;
          }
          
          resultDetails = { symbols: result };
        }
        
        const mockResponse = {
          bet: {
            id: Math.floor(Math.random() * 10000) + 1,
            gameId: data.gameId,
            userId: 1,
            betAmount: data.betAmount,
            status: isWin ? "won" : "lost",
            result: {
              win: isWin,
              amount: isWin ? winAmount : 0,
              details: resultDetails
            },
            createdAt: new Date().toISOString(),
            settledAt: new Date().toISOString(),
            game: {
              name: data.gameId === 1 ? "Lucky Dice" : "Mafia Slots",
              type: data.gameId === 1 ? "dice" : "slots"
            }
          }
        };
        
        return mockResponse;
      }
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
      
      // Add bet to local mock bets for development
      if (mockBets) {
        mockBets.unshift(data.bet);
        if (mockBets.length > 10) mockBets.pop();
      }
      
      // Update mock stats for development
      if (mockStats) {
        const gameId = data.bet.gameId;
        const statIndex = mockStats.findIndex(s => s.gameId === gameId);
        if (statIndex >= 0) {
          const stat = mockStats[statIndex];
          stat.totalBets += 1;
          stat.totalWagered += data.bet.betAmount;
          
          if (data.bet.result.win) {
            stat.totalWon += data.bet.result.amount;
            stat.biggestWin = Math.max(stat.biggestWin, data.bet.result.amount);
          } else {
            stat.totalLost += data.bet.betAmount;
            stat.biggestLoss = Math.max(stat.biggestLoss, data.bet.betAmount);
          }
        }
      }
      
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