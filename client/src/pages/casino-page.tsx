import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Loader2, 
  DollarSign, 
  TrendingUp, 
  Trophy, 
  History, 
  AlertTriangle, 
  Dice1, 
  Dice5, 
  BarChart, 
  ChevronsUp,
  ChevronsDown,
  RotateCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "@/components/ui/sparkles";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

// Form schemas
const diceFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  prediction: z.enum(["higher", "lower", "exact"]),
  targetNumber: z.number().min(1).max(6),
});

const slotFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  lines: z.number().min(1).max(5),
});

const rouletteFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  betType: z.enum([
    "straight",
    "split",
    "street",
    "corner",
    "line",
    "column",
    "dozen",
    "red",
    "black",
    "even",
    "odd",
    "low",
    "high",
  ]),
  numbers: z.array(z.number()).optional(),
});

const blackjackFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  action: z.enum(["bet", "hit", "stand", "double", "split"]),
});

// Main component
export default function CasinoPage() {
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState<CasinoGame | null>(null);
  const [betResult, setBetResult] = useState<any | null>(null);
  const [showBetResult, setShowBetResult] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

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
  const placeBetMutation = useMutation({
    mutationFn: async (data: {
      gameId: number;
      betAmount: number;
      betDetails: any;
    }) => {
      const res = await apiRequest("POST", "/api/casino/place-bet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/casino/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/casino/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      setBetResult(data);
      setShowBetResult(true);
      
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

  // Calculate win chances and payouts
  const calculateWinChance = (prediction: string, targetNumber: number) => {
    switch (prediction) {
      case "higher":
        return ((6 - targetNumber) / 6) * 100;
      case "lower":
        return ((targetNumber - 1) / 6) * 100;
      case "exact":
        return (1 / 6) * 100;
      default:
        return 0;
    }
  };
  
  const calculatePayout = (prediction: string, betAmount: number) => {
    switch (prediction) {
      case "higher":
      case "lower":
        return betAmount * 1.8; // 80% payout above the bet amount
      case "exact":
        return betAmount * 5; // 5x payout for exact prediction
      default:
        return 0;
    }
  };

  // Game components
  const DiceGame = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof diceFormSchema>>({
      resolver: zodResolver(diceFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        prediction: "higher",
        targetNumber: 3,
      },
    });
    
    const [animatingDice, setAnimatingDice] = useState(false);
    const watchedPrediction = form.watch("prediction");
    const watchedTarget = form.watch("targetNumber");
    const watchedBetAmount = form.watch("betAmount");
    
    const winChance = calculateWinChance(watchedPrediction, watchedTarget);
    const potentialPayout = calculatePayout(watchedPrediction, watchedBetAmount);

    function onSubmit(values: z.infer<typeof diceFormSchema>) {
      setAnimatingDice(true);
      setTimeout(() => {
        placeBetMutation.mutate({
          gameId: game.id,
          betAmount: values.betAmount,
          betDetails: {
            prediction: values.prediction,
            targetNumber: values.targetNumber,
          },
        });
        setAnimatingDice(false);
      }, 1500);
    }

    const formatDice = (num: number) => {
      switch (num) {
        case 1: return <Dice1 className="h-8 w-8" />;
        case 2: return <div className="grid grid-cols-2 gap-2 p-1">
          {[...Array(2)].map((_, i) => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
        </div>;
        case 3: return <div className="grid grid-cols-2 gap-2 p-1">
          {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
        </div>;
        case 4: return <div className="grid grid-cols-2 gap-2 p-1">
          {[...Array(4)].map((_, i) => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
        </div>;
        case 5: return <Dice5 className="h-8 w-8" />;
        case 6: return <div className="grid grid-cols-3 gap-1 p-1">
          {[...Array(6)].map((_, i) => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
        </div>;
        default: return null;
      }
    };

    const renderDiceRow = () => {
      return (
        <div className="flex justify-center my-6 space-x-2">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div 
              key={num} 
              className={cn(
                "w-12 h-12 rounded-lg border-2 flex items-center justify-center",
                num === watchedTarget 
                  ? "border-yellow-500 bg-yellow-950/40" 
                  : "border-gray-700 bg-black/40", 
                ((watchedPrediction === "higher" && num > watchedTarget) || 
                (watchedPrediction === "lower" && num < watchedTarget) || 
                (watchedPrediction === "exact" && num === watchedTarget))
                  ? "bg-green-950/25" 
                  : ""
              )}
            >
              {formatDice(num)}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-8 relative">
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-gray-800/60">
          <div className="text-center">
            <h3 className="text-xl font-semibold">Your Prediction</h3>
            <p className="text-muted-foreground text-sm">
              {watchedPrediction === "higher" && `Roll will be HIGHER than ${watchedTarget}`}
              {watchedPrediction === "lower" && `Roll will be LOWER than ${watchedTarget}`}
              {watchedPrediction === "exact" && `Roll will be EXACTLY ${watchedTarget}`}
            </p>
          </div>
          
          {renderDiceRow()}
          
          <div className="flex justify-between items-center mb-2 mt-4">
            <p className="text-sm font-medium">Win Chance</p>
            <Badge 
              variant={winChance > 50 ? "default" : (winChance > 20 ? "outline" : "destructive")}
            >
              {winChance.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            className="h-2" 
            value={winChance} 
            indicatorColor={winChance > 50 ? "bg-green-500" : (winChance > 20 ? "bg-amber-500" : "bg-red-500")}
          />

          <div className="flex justify-between items-center mt-4 mb-2">
            <p className="text-sm font-medium">Potential Payout</p>
            <Badge variant="outline" className="bg-green-900/30">
              <DollarSign className="h-3 w-3 mr-1" />
              {potentialPayout.toFixed(2)}
            </Badge>
          </div>
          
          <Separator className="my-4 opacity-30" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="betAmount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Bet Amount</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Min: ${game.minBet} | Max: ${game.maxBet}
                    </div>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min={game.minBet}
                          max={game.maxBet}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-gray-950/80 border-gray-800"
                        />
                      </div>
                      <Slider
                        value={[field.value]}
                        min={game.minBet}
                        max={game.maxBet}
                        step={10}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-2"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prediction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prediction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-950/80 border-gray-800">
                          <SelectValue placeholder="Select a prediction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="higher">
                          <div className="flex items-center">
                            <ChevronsUp className="h-4 w-4 mr-2 text-green-500" />
                            <span>Higher</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="lower">
                          <div className="flex items-center">
                            <ChevronsDown className="h-4 w-4 mr-2 text-red-500" />
                            <span>Lower</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="exact">
                          <div className="flex items-center">
                            <BarChart className="h-4 w-4 mr-2 text-yellow-500" />
                            <span>Exact</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Number</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-gray-950/80 border-gray-800"
                        />
                        <Slider
                          value={[field.value]}
                          min={1}
                          max={6}
                          step={1}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Sparkles intensity="low" sparkleColor="rgba(255, 215, 0, 0.7)">
              <Button
                type="submit"
                disabled={placeBetMutation.isPending || animatingDice}
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white border-amber-950",
                  animatingDice && "animate-pulse"
                )}
              >
                {placeBetMutation.isPending || animatingDice ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin mr-2" />
                    {animatingDice ? "Rolling Dice..." : "Placing Bet..."}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Roll the Dice
                  </>
                )}
              </Button>
            </Sparkles>
          </form>
        </Form>
      </div>
    );
  };

  // Calculate slots win chance and payouts
  const calculateSlotsWinChance = (lines: number) => {
    // More lines = higher chance to win but smaller individual payouts
    return Math.min(lines * 9, 45); // Base 9% per line, max 45%
  };
  
  const calculateSlotsPayout = (betAmount: number, lines: number) => {
    // Higher potential payout with fewer lines (higher risk)
    const baseMultiplier = 3 + (5 - lines) * 0.6;
    return betAmount * baseMultiplier;
  };

  const SlotMachine = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof slotFormSchema>>({
      resolver: zodResolver(slotFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        lines: 1,
      },
    });
    
    const [spinning, setSpinning] = useState(false);
    const [reelPositions, setReelPositions] = useState([0, 0, 0]);
    const watchedLines = form.watch("lines");
    const watchedBetAmount = form.watch("betAmount");
    
    const winChance = calculateSlotsWinChance(watchedLines);
    const potentialPayout = calculateSlotsPayout(watchedBetAmount, watchedLines);
    
    // Icons for slot machine
    const slotIcons = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣", "🎰"];
    
    function onSubmit(values: z.infer<typeof slotFormSchema>) {
      // Animate spinning before submitting
      setSpinning(true);
      
      // Simulate slot machine spinning
      const spinInterval = setInterval(() => {
        setReelPositions([
          Math.floor(Math.random() * slotIcons.length),
          Math.floor(Math.random() * slotIcons.length),
          Math.floor(Math.random() * slotIcons.length)
        ]);
      }, 100);
      
      // Submit the bet after animation
      setTimeout(() => {
        clearInterval(spinInterval);
        placeBetMutation.mutate({
          gameId: game.id,
          betAmount: values.betAmount,
          betDetails: {
            lines: values.lines,
          },
        });
        
        setTimeout(() => {
          setSpinning(false);
        }, 500);
      }, 2000);
    }
    
    const totalCost = watchedBetAmount * watchedLines;

    return (
      <div className="space-y-8 relative">
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-gray-800/60">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Lucky Slots</h3>
            <p className="text-muted-foreground text-sm">
              Play {watchedLines} line{watchedLines !== 1 ? 's' : ''} for ${totalCost}
            </p>
          </div>
          
          {/* Slot Machine Visualization */}
          <div className="relative my-6 bg-gradient-to-b from-gray-950 to-gray-900 border-2 border-amber-950 rounded-lg overflow-hidden p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0wIDBoMXY0MGgtMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48cGF0aCBkPSJNMCAwdjFoNDB2LTF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')]"></div>
            
            <div className="relative z-10 flex justify-center space-x-2">
              {[0, 1, 2].map((reelIndex) => (
                <div key={reelIndex} className="relative">
                  <div 
                    className={cn(
                      "w-16 h-20 bg-black rounded-md border-2 border-amber-800/50 flex items-center justify-center",
                      spinning && "animate-pulse"
                    )}
                  >
                    <span className={cn(
                      "text-4xl transition-all duration-75",
                      spinning && "blur-sm"
                    )}>
                      {slotIcons[reelPositions[reelIndex]]}
                    </span>
                  </div>
                  
                  {/* Pay line indicators */}
                  <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
                    {Array.from({length: watchedLines}).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1 h-1 rounded-full",
                          i < watchedLines ? "bg-yellow-500" : "bg-gray-700"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pay table */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="text-amber-500">3 × 🍒 = 5x</div>
              <div className="text-amber-500">3 × 🍋 = 8x</div>
              <div className="text-amber-500">3 × 🍊 = 10x</div>
              <div className="text-amber-500">3 × 🍇 = 15x</div>
              <div className="text-amber-500">3 × 💎 = 25x</div>
              <div className="text-amber-500">3 × 7️⃣ = 50x</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Win Chance</p>
            <Badge 
              variant={winChance > 30 ? "default" : "outline"}
            >
              {winChance.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            className="h-2" 
            value={winChance} 
            indicatorColor={winChance > 30 ? "bg-amber-500" : "bg-amber-700"}
          />

          <div className="flex justify-between items-center mt-4 mb-2">
            <p className="text-sm font-medium">Max Potential Payout</p>
            <Badge variant="outline" className="bg-green-900/30">
              <DollarSign className="h-3 w-3 mr-1" />
              {potentialPayout.toFixed(2)}
            </Badge>
          </div>
          
          <Separator className="my-4 opacity-30" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="betAmount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Bet Per Line</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Min: ${game.minBet} | Max: ${game.maxBet}
                    </div>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min={game.minBet}
                          max={game.maxBet}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-gray-950/80 border-gray-800"
                        />
                      </div>
                      <Slider
                        value={[field.value]}
                        min={game.minBet}
                        max={game.maxBet}
                        step={10}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-2"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lines"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Pay Lines</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Total Cost: ${watchedBetAmount * field.value}
                    </div>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="bg-gray-950/80 border-gray-800"
                      />
                      <Slider
                        value={[field.value]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-2"
                      />
                      
                      {/* Visual representation of lines */}
                      <div className="flex justify-between py-2">
                        {[1, 2, 3, 4, 5].map((lineNum) => (
                          <div 
                            key={lineNum}
                            className={cn(
                              "w-10 h-1 rounded-full transition-colors", 
                              lineNum <= field.value 
                                ? "bg-amber-500" 
                                : "bg-gray-700"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Sparkles intensity="medium" sparkleColor="rgba(245, 158, 11, 0.6)">
              <Button
                type="submit"
                disabled={placeBetMutation.isPending || spinning}
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white border-amber-950",
                  spinning && "animate-pulse"
                )}
              >
                {placeBetMutation.isPending || spinning ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin mr-2" />
                    {spinning ? "Spinning..." : "Placing Bet..."}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Spin The Reels
                  </>
                )}
              </Button>
            </Sparkles>
          </form>
        </Form>
      </div>
    );
  };

  const Roulette = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof rouletteFormSchema>>({
      resolver: zodResolver(rouletteFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        betType: "red",
        numbers: [],
      },
    });

    function onSubmit(values: z.infer<typeof rouletteFormSchema>) {
      // Set default numbers for bet types that don't need explicit number selection
      let numbers: number[] = values.numbers || [];
      
      switch (values.betType) {
        case "red":
          numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
          break;
        case "black":
          numbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
          break;
        case "even":
          numbers = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
          break;
        case "odd":
          numbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
          break;
        case "low":
          numbers = Array.from({ length: 18 }, (_, i) => i + 1);
          break;
        case "high":
          numbers = Array.from({ length: 18 }, (_, i) => i + 19);
          break;
        // Other bet types require manual number input in the UI
      }
      
      placeBetMutation.mutate({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          betType: values.betType,
          numbers,
        },
      });
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="betAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bet Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={game.minBet}
                    max={game.maxBet}
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="betType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bet Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bet type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="even">Even</SelectItem>
                    <SelectItem value="odd">Odd</SelectItem>
                    <SelectItem value="low">Low (1-18)</SelectItem>
                    <SelectItem value="high">High (19-36)</SelectItem>
                    <SelectItem value="straight">Straight (Single Number)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("betType") === "straight" && (
            <FormField
              control={form.control}
              name="numbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange([Number(value)])}
                      defaultValue={field.value?.[0]?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 37 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            disabled={placeBetMutation.isPending}
            className="w-full"
          >
            {placeBetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Spin
          </Button>
        </form>
      </Form>
    );
  };

  const Blackjack = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof blackjackFormSchema>>({
      resolver: zodResolver(blackjackFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        action: "bet",
      },
    });

    function onSubmit(values: z.infer<typeof blackjackFormSchema>) {
      placeBetMutation.mutate({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          action: values.action,
        },
      });
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="betAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bet Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={game.minBet}
                    max={game.maxBet}
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bet">Bet</SelectItem>
                    <SelectItem value="hit">Hit</SelectItem>
                    <SelectItem value="stand">Stand</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={placeBetMutation.isPending}
            className="w-full"
          >
            {placeBetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            {form.watch("action") === "bet" ? "Place Bet" : form.watch("action")}
          </Button>
        </form>
      </Form>
    );
  };

  // Bet result dialog
  const BetResultDialog = () => {
    if (!betResult) return null;
    
    const [showAnimation, setShowAnimation] = useState(true);
    
    // Start with animation, then show result
    useEffect(() => {
      if (showBetResult) {
        setShowAnimation(true);
        const timer = setTimeout(() => {
          setShowAnimation(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [showBetResult]);

    const handleClose = () => {
      setShowBetResult(false);
      setBetResult(null);
    };
    
    const isWin = betResult?.bet?.result?.win;
    const getResultIcon = () => {
      if (showAnimation) {
        return <RotateCw className="h-24 w-24 animate-spin text-amber-400" />;
      }
      
      return isWin ? (
        <div className="text-green-500 bg-green-900/20 h-24 w-24 rounded-full flex items-center justify-center">
          <Trophy className="h-16 w-16" />
        </div>
      ) : (
        <div className="text-red-500 bg-red-900/20 h-24 w-24 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-16 w-16" />
        </div>
      )
    };
    
    const formatDiceResult = (details: any) => {
      const diceValue = details.diceRoll;
      const targetNumber = details.targetNumber;
      const prediction = details.prediction;
      
      return (
        <div className="space-y-4">
          <div className="flex justify-center space-x-6 items-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Target</p>
              <div className="w-16 h-16 rounded-lg border-2 border-amber-600 bg-black flex items-center justify-center">
                <span className="text-3xl">{targetNumber}</span>
              </div>
              <p className="text-amber-400 mt-2">{prediction}</p>
            </div>
            
            <div className="text-4xl font-light text-muted-foreground">VS</div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Dice Roll</p>
              <div 
                className={cn(
                  "w-16 h-16 rounded-lg border-2 flex items-center justify-center",
                  isWin 
                    ? "border-green-500 bg-green-950/40" 
                    : "border-red-500 bg-red-950/40"
                )}
              >
                <span className="text-3xl">{diceValue}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Badge 
              variant={isWin ? "default" : "destructive"}
              className="text-base px-4 py-1"
            >
              {isWin 
                ? `${diceValue} is ${prediction} than ${targetNumber}` 
                : `${diceValue} is not ${prediction} than ${targetNumber}`}
            </Badge>
          </div>
        </div>
      );
    };
    
    const formatSlotsResult = (details: any) => {
      const symbols = details.symbols || ["🎰", "🎰", "🎰"];
      const lines = details.lines || 1;
      const matches = details.matches || 0;
      
      return (
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            {symbols.map((symbol: string, i: number) => (
              <div 
                key={i}
                className={cn(
                  "w-16 h-20 rounded-md border-2 flex items-center justify-center",
                  isWin ? "border-green-500 bg-green-950/20" : "border-amber-800 bg-black"
                )}
              >
                <span className="text-4xl">{symbol}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center space-y-2">
            <p>
              <span className="text-muted-foreground">Lines Played:</span>{" "}
              <span className="text-amber-200">{lines}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Matches:</span>{" "}
              <Badge variant={matches > 0 ? "default" : "outline"}>
                {matches}
              </Badge>
            </p>
          </div>
        </div>
      );
    };
    
    const formatRouletteResult = (details: any) => {
      const result = details.result;
      const betType = details.betType;
      
      return (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div 
              className={cn(
                "w-20 h-20 rounded-full border-4 flex items-center justify-center",
                result % 2 === 0 ? "bg-black border-white" : "bg-red-600 border-white",
                result === 0 ? "bg-green-600 border-white" : ""
              )}
            >
              <span className="text-4xl text-white font-bold">{result}</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground mb-1">Bet Type</p>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {betType.charAt(0).toUpperCase() + betType.slice(1)}
            </Badge>
          </div>
        </div>
      );
    };
    
    const formatBlackjackResult = (details: any) => {
      const playerCards = details.playerHand || [];
      const dealerCards = details.dealerHand || [];
      const playerScore = details.playerScore || 0;
      const dealerScore = details.dealerScore || 0;
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Your Hand ({playerScore})</p>
              <div className="flex justify-center space-x-[-0.5rem]">
                {playerCards.map((card: string, i: number) => (
                  <div 
                    key={i}
                    style={{ transform: `rotate(${(i - playerCards.length / 2) * 5}deg)` }}
                    className="w-10 h-14 bg-white text-black rounded border border-black flex items-center justify-center text-xs font-bold"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Dealer Hand ({dealerScore})</p>
              <div className="flex justify-center space-x-[-0.5rem]">
                {dealerCards.map((card: string, i: number) => (
                  <div 
                    key={i}
                    style={{ transform: `rotate(${(i - dealerCards.length / 2) * 5}deg)` }}
                    className="w-10 h-14 bg-white text-black rounded border border-black flex items-center justify-center text-xs font-bold"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Badge 
              variant={isWin ? "default" : "destructive"}
              className="text-base px-4 py-1"
            >
              {isWin 
                ? playerScore > dealerScore 
                  ? `You win with higher score (${playerScore} vs ${dealerScore})` 
                  : `Dealer busted (${dealerScore} > 21)`
                : playerScore > 21 
                  ? `You busted (${playerScore} > 21)` 
                  : `Dealer wins (${dealerScore} vs ${playerScore})`}
            </Badge>
          </div>
        </div>
      );
    };
    
    const renderGameDetails = () => {
      if (!betResult?.bet?.result?.details) return null;
      
      const details = betResult.bet.result.details;
      const gameType = betResult.bet.game.type;
      
      switch (gameType) {
        case "dice":
          return formatDiceResult(details);
        case "slots":
          return formatSlotsResult(details);
        case "roulette":
          return formatRouletteResult(details);
        case "blackjack":
          return formatBlackjackResult(details);
        default:
          return (
            <pre className="text-xs bg-black/50 p-2 rounded overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          );
      }
    };

    return (
      <Dialog open={showBetResult} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] border-amber-950/60 bg-gradient-to-b from-gray-950 to-black backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0wIDBoMXY0MGgtMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48cGF0aCBkPSJNMCAwdjFoNDB2LTF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')]"></div>
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="absolute top-6 right-6">
              <Sparkles 
                intensity={isWin ? 'high' : 'low'} 
                sparkleColor={isWin ? "rgba(74, 222, 128, 0.6)" : "rgba(245, 158, 11, 0.4)"}
              >
                <Badge 
                  variant={isWin ? "default" : "destructive"}
                  className="text-lg px-4 py-1"
                >
                  {isWin ? "WIN" : "LOSE"}
                </Badge>
              </Sparkles>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              {getResultIcon()}
              
              <DialogTitle 
                className={cn(
                  "text-2xl mt-4",
                  isWin ? "text-green-500" : "text-red-500"
                )}
              >
                {showAnimation 
                  ? "Calculating Results..." 
                  : (isWin ? "You Won!" : "You Lost!")}
              </DialogTitle>
              
              <DialogDescription className="text-center mt-1">
                {showAnimation ? (
                  "Please wait..."
                ) : (
                  isWin
                    ? <span className="text-green-400">Congratulations! You won <strong className="text-green-300 font-mono">${betResult?.bet?.result?.amount}</strong></span>
                    : <span className="text-amber-400">Better luck next time! You lost <strong className="text-red-300 font-mono">${betResult?.bet?.betAmount}</strong></span>
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          {!showAnimation && (
            <div className="space-y-6 relative z-10">
              <div className="bg-black/40 rounded-lg border border-amber-900/30 p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-amber-200">Game</h4>
                    <p className="text-sm">{betResult?.bet?.game?.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-200">Bet Amount</h4>
                    <p className="text-sm font-mono">${betResult?.bet?.betAmount}</p>
                  </div>
                </div>
                
                <Separator className="opacity-30" />
                
                {renderGameDetails()}
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleClose} 
                  className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-amber-950"
                >
                  {isWin ? "Collect Winnings" : "Try Again"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Fetch user balance for display
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await apiRequest("GET", "/api/user/profile");
        const userData = await res.json();
        setUserBalance(userData.cash || 0);
      } catch (error) {
        console.error("Failed to fetch user balance", error);
      }
    };
    
    fetchUserData();
  }, []);

  // Render the main casino page
  return (
    <div className="container py-6 space-y-6 relative">
      {/* Background styling */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxIiBmaWxsPSJyZ2JhKDIwMCwgMTUwLCA1MCwgMC4zKSIvPjwvc3ZnPg==')]"></div>
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-amber-200 to-amber-600 bg-clip-text text-transparent">
              Lucky Strike Casino
            </h1>
            <p className="text-muted-foreground">Try your luck in our establishment</p>
          </div>
          <Sparkles intensity="low" sparkleColor="rgba(245, 158, 11, 0.6)">
            <Button size="lg" variant="outline" className="border-amber-800/50 bg-black/30">
              <DollarSign className="h-4 w-4 mr-2 text-amber-500" />
              <span className="font-mono text-amber-200">${userBalance.toLocaleString() || 0}</span>
            </Button>
          </Sparkles>
        </div>

        <div className="relative">
          <Tabs defaultValue="games" className="relative z-10">
            <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-amber-950/60">
              <TabsTrigger value="games" className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-200">
                Games
              </TabsTrigger>
              <TabsTrigger value="bets" className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-200">
                Your Bets
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-200">
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="space-y-6 pt-6">
              {gamesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : games?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games?.map((game: CasinoGame) => (
                    <Card key={game.id} className="overflow-hidden border-amber-950/60 bg-black/30 backdrop-blur-sm hover:border-amber-700/60 transition-colors">
                      <CardHeader className="pb-3 bg-gradient-to-b from-amber-950/80 to-black/0">
                        <CardTitle>{game.name}</CardTitle>
                        <CardDescription>{game.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min Bet:</span>
                            <span className="text-amber-200">${game.minBet}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Bet:</span>
                            <span className="text-amber-200">${game.maxBet}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">House Edge:</span>
                            <span className="text-amber-200">{game.houseEdge}%</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-amber-950" 
                          onClick={() => setActiveGame(game)}
                          disabled={!game.isActive}
                        >
                          {game.isActive ? "Play Now" : "Coming Soon"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No casino games available
                </div>
              )}

              {activeGame && (
                <Card className="border-amber-950/60 bg-black/30 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-b from-amber-950/80 to-black/0 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActiveGame(null)} 
                      className="absolute right-2 top-2 text-amber-200 hover:text-amber-100 hover:bg-amber-900/20"
                    >
                      ×
                    </Button>
                    <CardTitle className="text-2xl text-amber-200">{activeGame.name}</CardTitle>
                    <CardDescription>{activeGame.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {activeGame.type === "dice" && <DiceGame game={activeGame} />}
                    {activeGame.type === "slots" && <SlotMachine game={activeGame} />}
                    {activeGame.type === "roulette" && <Roulette game={activeGame} />}
                    {activeGame.type === "blackjack" && <Blackjack game={activeGame} />}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bets" className="pt-6">
              <Card className="border-amber-950/60 bg-black/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-b from-amber-950/80 to-black/0">
                  <CardTitle className="text-amber-200">Recent Bets</CardTitle>
                  <CardDescription>Your betting history</CardDescription>
                </CardHeader>
                <CardContent>
                  {betsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                  ) : bets?.length > 0 ? (
                    <div className="rounded-md border border-amber-900/30">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-amber-950/50">
                              <th className="p-3 text-left text-amber-200 font-medium">Game</th>
                              <th className="p-3 text-left text-amber-200 font-medium">Amount</th>
                              <th className="p-3 text-left text-amber-200 font-medium">Result</th>
                              <th className="p-3 text-left text-amber-200 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bets.map((bet: CasinoBet) => (
                              <tr
                                key={bet.id}
                                className="border-t border-amber-900/30 hover:bg-amber-950/30 transition-colors"
                              >
                                <td className="p-3">{bet.game.name}</td>
                                <td className="p-3">${bet.betAmount}</td>
                                <td className="p-3">
                                  {bet.result?.win ? (
                                    <span className="text-green-500 font-medium flex items-center">
                                      <TrendingUp className="h-4 w-4 mr-1" />
                                      Won ${bet.result.amount}
                                    </span>
                                  ) : (
                                    <span className="text-red-500 font-medium flex items-center">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Lost ${bet.betAmount}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {formatDistanceToNow(new Date(bet.createdAt), {
                                    addSuffix: true,
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 rounded-md border border-amber-900/20">
                      <History className="h-12 w-12 mx-auto text-amber-800/50 mb-3" />
                      <p className="text-muted-foreground">No bets yet. Start playing to see your betting history!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="pt-6">
              <Card className="border-amber-950/60 bg-black/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-b from-amber-950/80 to-black/0">
                  <CardTitle className="text-amber-200">Your Statistics</CardTitle>
                  <CardDescription>See how you're doing at our casino</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                  ) : stats?.length > 0 ? (
                    <div className="space-y-6">
                      <div className="rounded-md border border-amber-900/30">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-amber-950/50">
                                <th className="p-3 text-left text-amber-200 font-medium">Game</th>
                                <th className="p-3 text-left text-amber-200 font-medium">Bets</th>
                                <th className="p-3 text-left text-amber-200 font-medium">Wagered</th>
                                <th className="p-3 text-left text-amber-200 font-medium">Won</th>
                                <th className="p-3 text-left text-amber-200 font-medium">Lost</th>
                                <th className="p-3 text-left text-amber-200 font-medium">Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.map((stat: CasinoStat) => (
                                <tr
                                  key={stat.gameId}
                                  className="border-t border-amber-900/30 hover:bg-amber-950/30 transition-colors"
                                >
                                  <td className="p-3">{stat.game.name}</td>
                                  <td className="p-3">{stat.totalBets}</td>
                                  <td className="p-3">${stat.totalWagered.toLocaleString()}</td>
                                  <td className="p-3 text-green-500">
                                    ${stat.totalWon.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-red-500">
                                    ${stat.totalLost.toLocaleString()}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={
                                        stat.totalWon > stat.totalLost
                                          ? "text-green-500 font-medium"
                                          : "text-red-500 font-medium"
                                      }
                                    >
                                      ${(stat.totalWon - stat.totalLost).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Stats Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-black/40 border-amber-900/40">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center">
                              <Trophy className="h-4 w-4 mr-2 text-amber-400" />
                              Biggest Win
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-green-500">
                              ${Math.max(...stats.map(s => s.biggestWin)).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-black/40 border-amber-900/40">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2 text-amber-400" />
                              Total Profit/Loss
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const totalProfit = stats.reduce((acc, s) => acc + (s.totalWon - s.totalLost), 0);
                              return (
                                <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                                  ${totalProfit.toLocaleString()}
                                </p>
                              );
                            })()}
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-black/40 border-amber-900/40">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center">
                              <BarChart className="h-4 w-4 mr-2 text-amber-400" />
                              Win Rate
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const totalBets = stats.reduce((acc, s) => acc + s.totalBets, 0);
                              const totalWins = stats.reduce((acc, s) => {
                                const winRate = s.totalWon / (s.totalWagered || 1);
                                const approxWins = Math.round(s.totalBets * winRate);
                                return acc + approxWins;
                              }, 0);
                              const winRate = totalWins / (totalBets || 1) * 100;
                              return (
                                <div className="space-y-2">
                                  <p className="text-2xl font-bold text-amber-400">
                                    {winRate.toFixed(1)}%
                                  </p>
                                  <Progress value={winRate} className="h-2" />
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 rounded-md border border-amber-900/20">
                      <BarChart className="h-12 w-12 mx-auto text-amber-800/50 mb-3" />
                      <p className="text-muted-foreground">No stats yet. Start playing to see your statistics!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BetResultDialog />
    </div>
  );
}