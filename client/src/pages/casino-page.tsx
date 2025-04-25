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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Sparkles } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  DollarSign, 
  Dices, 
  Loader2, 
  Plus, 
  PlusCircle, 
  RefreshCw, 
  RotateCw,
  RotateCcw,
  Coins, 
  SquareAsterisk, 
  Award, 
  ArrowUp, 
  ArrowDown, 
  SquareStack, 
  Circle, 
  Hand, 
  Scissors,
  TrendingUp, 
  Trophy, 
  History, 
  AlertTriangle, 
  Dice1, 
  Dice5, 
  BarChart, 
  ChevronsUp,
  ChevronsDown
} from "lucide-react";

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
    "corner",
    "red",
    "black",
    "even",
    "odd",
    "low",
    "high",
    "1st12",
    "2nd12",
    "3rd12",
    "column1",
    "column2",
    "column3",
    "zero"
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

  // Calculate roulette win chances and payouts
  const calculateRouletteWinChance = (betType: string) => {
    switch (betType) {
      case "red":
      case "black":
      case "even":
      case "odd":
      case "low":
      case "high":
        return 18/37 * 100; // 18 out of 37 pockets, ~48.65% chance
      case "1st12":
      case "2nd12":
      case "3rd12":
      case "column1":
      case "column2":
      case "column3":
        return 12/37 * 100; // 12 out of 37 pockets, ~32.43% chance
      case "straight":
        return 1/37 * 100; // 1 out of 37 pockets, ~2.7% chance
      case "split":
        return 2/37 * 100; // 2 out of 37 pockets, ~5.4% chance
      case "corner":
        return 4/37 * 100; // 4 out of 37 pockets, ~10.81% chance
      case "zero":
        return 1/37 * 100; // 1 out of 37 pockets, ~2.7% chance
      default:
        return 0;
    }
  };
  
  const calculateRoulettePayout = (betType: string, betAmount: number) => {
    const payouts: Record<string, number> = {
      "red": 2, "black": 2, "even": 2, "odd": 2, "low": 2, "high": 2, 
      "1st12": 3, "2nd12": 3, "3rd12": 3, 
      "column1": 3, "column2": 3, "column3": 3,
      "straight": 36, "split": 18, "corner": 9, "zero": 36
    };
    
    return betAmount * payouts[betType] || 0;
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
    
    const [wheelSpinning, setWheelSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballPosition, setBallPosition] = useState(0);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    
    const watchedBetType = form.watch("betType");
    const watchedBetAmount = form.watch("betAmount");
    const watchedNumbers = form.watch("numbers") || [];
    
    const winChance = calculateRouletteWinChance(watchedBetType);
    const potentialPayout = calculateRoulettePayout(watchedBetType, watchedBetAmount);
    
    // Import SVG assets
    const wheelSvgPath = "/src/assets/casino/roulette-wheel.svg";
    const tableSvgPath = "/src/assets/casino/roulette-table.svg";
    
    // Determine betting area highlight based on bet type
    const getBetHighlightArea = () => {
      // This would return a className or JSX to highlight the appropriate betting area
      return watchedBetType === "red" ? "bg-red-500/20" : watchedBetType === "black" ? "bg-black/20" : "";
    };

    function onSubmit(values: z.infer<typeof rouletteFormSchema>) {
      // Animate wheel spinning
      setWheelSpinning(true);
      
      // Spin wheel animation - rotate a random amount
      const randomSpin = Math.floor(Math.random() * 360) + 1080; // at least 3 full rotations + random position
      
      // Animate the wheel spinning
      let currentRotation = 0;
      const spinInterval = setInterval(() => {
        const increment = Math.max(10, 50 * Math.exp(-currentRotation / 720)); // Slow down gradually
        currentRotation += increment;
        setWheelRotation(currentRotation % 360);
        
        if (currentRotation >= randomSpin) {
          clearInterval(spinInterval);
          // Set ball position after the wheel stops
          setBallPosition(Math.floor(Math.random() * 37));
        }
      }, 30);
      
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
        case "1st12":
          numbers = Array.from({ length: 12 }, (_, i) => i + 1);
          break;
        case "2nd12":
          numbers = Array.from({ length: 12 }, (_, i) => i + 13);
          break;
        case "3rd12":
          numbers = Array.from({ length: 12 }, (_, i) => i + 25);
          break;
        case "column1":
          numbers = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
          break;
        case "column2":
          numbers = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
          break;
        case "column3":
          numbers = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
          break;
        case "zero":
          numbers = [0];
          break;
        // For straight, split, corner, etc. the user needs to select the numbers
      }
      
      // Visually select a random number for simulation
      const randomIndex = Math.floor(Math.random() * numbers.length);
      const randomSelectedNumber = numbers.length > 0 ? numbers[randomIndex] : null;
      setSelectedNumber(randomSelectedNumber);

      // Submit the bet after animation
      setTimeout(() => {
        placeBetMutation.mutate({
          gameId: game.id,
          betAmount: values.betAmount,
          betDetails: {
            betType: values.betType,
            numbers,
          },
        });
        
        setTimeout(() => {
          setWheelSpinning(false);
          setWheelRotation(0);
          setBallPosition(0);
          setSelectedNumber(null);
        }, 1000);
      }, 3000);
    }
    
    // Get bet type label for display
    const getBetTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        "red": "Red", "black": "Black", "even": "Even", "odd": "Odd",
        "low": "Low (1-18)", "high": "High (19-36)",
        "1st12": "First Dozen (1-12)", "2nd12": "Second Dozen (13-24)", "3rd12": "Third Dozen (25-36)",
        "column1": "First Column", "column2": "Second Column", "column3": "Third Column",
        "straight": "Straight (Single Number)", "split": "Split (2 Numbers)", 
        "corner": "Corner (4 Numbers)", "zero": "Zero (0)"
      };
      return labels[type] || type;
    };
    
    // Get payout label for display
    const getPayoutLabel = (type: string) => {
      const labels: Record<string, string> = {
        "red": "1:1", "black": "1:1", "even": "1:1", "odd": "1:1", "low": "1:1", "high": "1:1",
        "1st12": "2:1", "2nd12": "2:1", "3rd12": "2:1", 
        "column1": "2:1", "column2": "2:1", "column3": "2:1",
        "straight": "35:1", "split": "17:1", "corner": "8:1", "zero": "35:1"
      };
      return labels[type] || "";
    };

    return (
      <div className="space-y-8 relative">
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-gray-800/60">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Roulette</h3>
            <p className="text-muted-foreground text-sm">
              Betting on: <span className="text-amber-200">{getBetTypeLabel(watchedBetType)}</span> 
              <span className="ml-2 text-green-400">{getPayoutLabel(watchedBetType)}</span>
            </p>
          </div>
          
          {/* Roulette wheel visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col justify-center items-center">
              <div className={cn(
                "relative w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 transition-transform duration-[3s]",
                wheelSpinning && "animate-spin-slow"
              )}>
                <img 
                  src={wheelSvgPath} 
                  alt="Roulette Wheel" 
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                  className="w-full h-full"
                />
                {selectedNumber !== null && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10">
                    <span className={cn(
                      "text-2xl font-bold",
                      [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(selectedNumber) 
                        ? "text-red-600" 
                        : selectedNumber === 0 ? "text-green-600" : "text-black"
                    )}>
                      {selectedNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Roulette table */}
            <div className="hidden md:block relative border border-amber-900/30 rounded overflow-hidden">
              <img 
                src={tableSvgPath} 
                alt="Roulette Table" 
                className="w-full h-auto"
              />
              
              {/* Highlight based on bet type */}
              {watchedBetType === "red" && (
                <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />
              )}
              {watchedBetType === "black" && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              )}
              {watchedBetType === "even" && (
                <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2 mt-4">
            <p className="text-sm font-medium">Win Chance</p>
            <Badge 
              variant={winChance > 30 ? "default" : (winChance > 10 ? "outline" : "destructive")}
            >
              {winChance.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            className="h-2" 
            value={winChance} 
            indicatorColor={winChance > 30 ? "bg-green-500" : (winChance > 10 ? "bg-amber-500" : "bg-red-500")}
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
                      <SelectTrigger className="bg-gray-950/80 border-gray-800">
                        <SelectValue placeholder="Select a bet type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Outside Bets</SelectLabel>
                        <SelectItem value="red">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-red-600 mr-2" />
                            <span>Red (1:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="black">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-black mr-2" />
                            <span>Black (1:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="even">
                          <div className="flex items-center">
                            <SquareStack className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Even (1:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="odd">
                          <div className="flex items-center">
                            <Circle className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Odd (1:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center">
                            <ArrowDown className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Low 1-18 (1:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center">
                            <ArrowUp className="h-4 w-4 mr-2 text-amber-500" />
                            <span>High 19-36 (1:1)</span>
                          </div>
                        </SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Dozen Bets (2:1)</SelectLabel>
                        <SelectItem value="1st12">1st Dozen (1-12)</SelectItem>
                        <SelectItem value="2nd12">2nd Dozen (13-24)</SelectItem>
                        <SelectItem value="3rd12">3rd Dozen (25-36)</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Column Bets (2:1)</SelectLabel>
                        <SelectItem value="column1">Column 1</SelectItem>
                        <SelectItem value="column2">Column 2</SelectItem>
                        <SelectItem value="column3">Column 3</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Inside Bets</SelectLabel>
                        <SelectItem value="zero">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-green-600 mr-2" />
                            <span>Zero (35:1)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="straight">Straight - Single Number (35:1)</SelectItem>
                        <SelectItem value="split">Split - 2 Numbers (17:1)</SelectItem>
                        <SelectItem value="corner">Corner - 4 Numbers (8:1)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {["straight", "split", "corner"].includes(
              form.watch("betType")
            ) && (
              <div className="space-y-4 p-3 border border-amber-900/20 bg-black/20 rounded-md">
                <FormLabel>Select Numbers</FormLabel>
                <p className="text-sm text-muted-foreground">
                  {form.watch("betType") === "straight" &&
                    "Select 1 number"}
                  {form.watch("betType") === "split" &&
                    "Select 2 adjacent numbers"}
                  {form.watch("betType") === "corner" &&
                    "Select 4 adjacent numbers"}
                </p>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "bg-green-950/20 border-green-900",
                      watchedNumbers.includes(0) && "bg-green-900/70 border-green-500"
                    )}
                    onClick={() => {
                      const currentNums = form.watch("numbers") || [];
                      let newNums: number[] = [];

                      if (currentNums.includes(0)) {
                        newNums = currentNums.filter((n) => n !== 0);
                      } else {
                        if (form.watch("betType") === "straight") {
                          newNums = [0];
                        } else {
                          newNums = [...currentNums, 0];
                          if (
                            (form.watch("betType") === "split" && newNums.length > 2) ||
                            (form.watch("betType") === "corner" && newNums.length > 4)
                          ) {
                            newNums = newNums.slice(1);
                          }
                        }
                      }

                      form.setValue("numbers", newNums);
                    }}
                  >
                    0
                  </Button>
                  
                  {[...Array(36).keys()].map((num) => (
                    <Button
                      key={num + 1}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num + 1)
                          ? "bg-red-950/20 border-red-900"
                          : "bg-black/30 border-gray-800",
                        watchedNumbers.includes(num + 1) && 
                          ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num + 1)
                            ? "bg-red-900/70 border-red-500"
                            : "bg-gray-950 border-gray-400")
                      )}
                      onClick={() => {
                        const currentNums = form.watch("numbers") || [];
                        let newNums: number[] = [];

                        if (currentNums.includes(num + 1)) {
                          newNums = currentNums.filter((n) => n !== num + 1);
                        } else {
                          if (form.watch("betType") === "straight") {
                            newNums = [num + 1];
                          } else {
                            newNums = [...currentNums, num + 1];
                            if (
                              (form.watch("betType") === "split" && newNums.length > 2) ||
                              (form.watch("betType") === "corner" && newNums.length > 4)
                            ) {
                              newNums = newNums.slice(1);
                            }
                          }
                        }

                        form.setValue("numbers", newNums);
                      }}
                    >
                      {num + 1}
                    </Button>
                  ))}
                </div>
                
                {/* Selected numbers */}
                {watchedNumbers.length > 0 && (
                  <div className="mt-4">
                    <FormLabel>Selected Numbers</FormLabel>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {watchedNumbers.map((num) => (
                        <Badge key={num} variant="outline" className="text-base">
                          {num}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Sparkles intensity="low" sparkleColor="rgba(245, 158, 11, 0.6)">
              <Button
                type="submit"
                disabled={placeBetMutation.isPending || wheelSpinning || 
                  (["straight", "split", "corner"].includes(watchedBetType) && watchedNumbers.length === 0)}
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white border-amber-950",
                  wheelSpinning && "animate-pulse"
                )}
              >
                {placeBetMutation.isPending || wheelSpinning ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin mr-2" />
                    {wheelSpinning ? "Spinning Wheel..." : "Placing Bet..."}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Spin the Wheel
                  </>
                )}
              </Button>
            </Sparkles>
          </form>
        </Form>
      </div>
    );
  };

  // Calculate blackjack probabilities and payouts
  const calculateBlackjackWinChance = (playerCards: string[], dealerUpCard: string) => {
    // This is a simplified calculation
    // In a real game, it would depend on card counting and probability analysis
    
    // Convert face cards to 10 and aces to 11 initially
    const convertCardValue = (card: string) => {
      if (['J', 'Q', 'K'].includes(card[0])) return 10;
      if (card[0] === 'A') return 11;
      return parseInt(card);
    };
    
    // Calculate player's hand value
    const playerValues = playerCards.map(convertCardValue);
    const playerSum = playerValues.reduce((sum, val) => sum + val, 0);
    
    // Calculate dealer's visible card value
    const dealerValue = convertCardValue(dealerUpCard);
    
    // Basic strategy win chances:
    if (playerSum === 21) return 90; // Blackjack
    if (playerSum >= 17) return 50; // Stand with high hand
    if (playerSum <= 11) return 70; // Always hit - good chances
    
    // Dealer showing low card is better for player
    if (dealerValue >= 7) return 35;
    
    // Medium hands against low dealer card
    return 55;
  };
  
  const calculateBlackjackPayout = (betAmount: number, hasBlackjack: boolean) => {
    if (hasBlackjack) {
      return betAmount * 2.5; // Blackjack typically pays 3:2
    }
    return betAmount * 2; // Normal win pays 1:1
  };

  const Blackjack = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof blackjackFormSchema>>({
      resolver: zodResolver(blackjackFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        action: "bet",
      },
    });
    
    // Game state
    const [gameStage, setGameStage] = useState<'betting' | 'playing' | 'result'>('betting');
    const [playerCards, setPlayerCards] = useState<string[]>([]);
    const [dealerCards, setDealerCards] = useState<string[]>([]);
    const [playerScore, setPlayerScore] = useState(0);
    const [dealerScore, setDealerScore] = useState(0);
    const [dealerCardHidden, setDealerCardHidden] = useState(true);
    const [gameResult, setGameResult] = useState<'win' | 'lose' | 'push' | null>(null);
    const [animatingCards, setAnimatingCards] = useState(false);
    
    const watchedAction = form.watch("action");
    const watchedBetAmount = form.watch("betAmount");
    
    // Import SVG assets for cards and table
    const cardSvgPath = "/src/assets/casino/playing-card.svg";
    const tableSvgPath = "/src/assets/casino/blackjack-table.svg";
    
    // Calculate the current hand score
    const calculateHandScore = (cards: string[]) => {
      let score = 0;
      let aces = 0;
      
      // Count non-aces first
      cards.forEach(card => {
        const value = card[0];
        if (value === 'A') {
          aces++;
        } else if (['J', 'Q', 'K', '1'].includes(value)) { // 10 is represented as '10'
          score += 10;
        } else {
          score += parseInt(value);
        }
      });
      
      // Add aces optimally
      for (let i = 0; i < aces; i++) {
        if (score + 11 <= 21) {
          score += 11;
        } else {
          score += 1;
        }
      }
      
      return score;
    };
    
    // Get a random card (simplified)
    const getRandomCard = () => {
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      const suits = ['♥', '♦', '♣', '♠'];
      const value = values[Math.floor(Math.random() * values.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      return value + suit;
    };
    
    // Deal initial cards
    const dealInitialCards = () => {
      const pCards = [getRandomCard(), getRandomCard()];
      const dCards = [getRandomCard(), getRandomCard()];
      
      setAnimatingCards(true);
      
      // Animate dealing cards
      setTimeout(() => {
        setPlayerCards([pCards[0]]);
        
        setTimeout(() => {
          setDealerCards([dCards[0]]);
          
          setTimeout(() => {
            setPlayerCards(pCards);
            
            setTimeout(() => {
              setDealerCards(dCards);
              setAnimatingCards(false);
              
              // Calculate scores
              const pScore = calculateHandScore(pCards);
              const dScore = calculateHandScore([dCards[0]]); // Only count visible dealer card
              
              setPlayerScore(pScore);
              setDealerScore(dScore);
              
              // Check for blackjack
              if (pScore === 21) {
                handleDealerTurn(pCards, dCards);
              }
            }, 300);
          }, 300);
        }, 300);
      }, 300);
    };
    
    // Handle player hitting
    const handleHit = () => {
      if (gameStage !== 'playing' || animatingCards) return;
      
      setAnimatingCards(true);
      const newCard = getRandomCard();
      
      setTimeout(() => {
        const updatedCards = [...playerCards, newCard];
        setPlayerCards(updatedCards);
        
        const newScore = calculateHandScore(updatedCards);
        setPlayerScore(newScore);
        
        setAnimatingCards(false);
        
        // Check if player busts
        if (newScore > 21) {
          setTimeout(() => {
            setGameResult('lose');
            setGameStage('result');
            setDealerCardHidden(false);
            setDealerScore(calculateHandScore(dealerCards));
            
            // Submit the result
            placeBetMutation.mutate({
              gameId: game.id,
              betAmount: watchedBetAmount,
              betDetails: {
                action: 'stand',
                playerCards: updatedCards,
                dealerCards,
                playerScore: newScore,
                dealerScore: calculateHandScore(dealerCards),
                result: 'lose'
              },
            });
          }, 500);
        }
      }, 500);
    };
    
    // Handle dealer's turn
    const handleDealerTurn = (finalPlayerCards: string[], currentDealerCards: string[]) => {
      let updatedDealerCards = [...currentDealerCards];
      let dealerFinalScore = calculateHandScore(updatedDealerCards);
      
      // Dealer must hit on 16 or less
      while (dealerFinalScore < 17) {
        updatedDealerCards.push(getRandomCard());
        dealerFinalScore = calculateHandScore(updatedDealerCards);
      }
      
      setDealerCards(updatedDealerCards);
      setDealerCardHidden(false);
      setDealerScore(dealerFinalScore);
      
      // Determine the result
      const playerFinalScore = calculateHandScore(finalPlayerCards);
      
      let result: 'win' | 'lose' | 'push';
      if (playerFinalScore > 21) {
        result = 'lose';
      } else if (dealerFinalScore > 21) {
        result = 'win';
      } else if (playerFinalScore > dealerFinalScore) {
        result = 'win';
      } else if (playerFinalScore < dealerFinalScore) {
        result = 'lose';
      } else {
        result = 'push';
      }
      
      setGameResult(result);
      setGameStage('result');
      
      // Submit the result
      placeBetMutation.mutate({
        gameId: game.id,
        betAmount: watchedBetAmount,
        betDetails: {
          action: 'stand',
          playerCards: finalPlayerCards,
          dealerCards: updatedDealerCards,
          playerScore: playerFinalScore,
          dealerScore: dealerFinalScore,
          result
        },
      });
    };
    
    // Handle standing
    const handleStand = () => {
      if (gameStage !== 'playing' || animatingCards) return;
      handleDealerTurn(playerCards, dealerCards);
    };
    
    // Reset the game
    const resetGame = () => {
      setGameStage('betting');
      setPlayerCards([]);
      setDealerCards([]);
      setPlayerScore(0);
      setDealerScore(0);
      setDealerCardHidden(true);
      setGameResult(null);
      setAnimatingCards(false);
      form.setValue('action', 'bet');
    };
    
    // Handle form submission
    function onSubmit(values: z.infer<typeof blackjackFormSchema>) {
      if (gameStage === 'betting') {
        // Start new game
        setGameStage('playing');
        dealInitialCards();
      } else if (gameStage === 'playing') {
        // Handle game actions
        switch (values.action) {
          case 'hit':
            handleHit();
            break;
          case 'stand':
            handleStand();
            break;
          case 'double':
            // Double bet, take one card and stand
            placeBetMutation.mutate({
              gameId: game.id,
              betAmount: values.betAmount * 2,
              betDetails: {
                action: 'double',
              },
            });
            break;
          case 'split':
            // Split hand into two separate hands
            placeBetMutation.mutate({
              gameId: game.id,
              betAmount: values.betAmount,
              betDetails: {
                action: 'split',
              },
            });
            break;
          default:
            break;
        }
      } else if (gameStage === 'result') {
        // Reset game after showing result
        resetGame();
      }
    }
    
    // Format cards for display
    const formatCard = (card: string, hidden: boolean = false) => {
      if (hidden) {
        return (
          <div className="relative w-12 h-16 md:w-16 md:h-20 rounded-md bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-800 shadow-lg">
            <div className="absolute inset-0 flex items-center justify-center text-gold text-xs opacity-50">
              ?
            </div>
            <div className="absolute inset-0 bg-pattern-diamond opacity-20"></div>
          </div>
        );
      }
      
      const value = card[0] === '1' ? '10' : card[0]; // Handle 10
      const suit = card.slice(-1);
      const color = ['♥', '♦'].includes(suit) ? 'text-red-600' : 'text-black';
      
      return (
        <div className="relative w-12 h-16 md:w-16 md:h-20 rounded-md bg-white border border-gray-300 shadow-lg flex flex-col justify-between p-1">
          <div className={`text-xs font-bold ${color}`}>{value}</div>
          <div className={`text-center text-xl ${color}`}>{suit}</div>
          <div className={`text-xs font-bold self-end ${color}`}>{value}</div>
        </div>
      );
    };
    
    // Calculate win chances (only relevant during play)
    const winChance = gameStage === 'playing' && playerCards.length > 0 && dealerCards.length > 0
      ? calculateBlackjackWinChance(playerCards, dealerCards[0])
      : 45; // Default chance
    
    // Calculate potential payout
    const hasBlackjack = playerCards.length === 2 && playerScore === 21;
    const potentialPayout = calculateBlackjackPayout(watchedBetAmount, hasBlackjack);

    return (
      <div className="space-y-8 relative">
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-gray-800/60">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Blackjack</h3>
            <p className="text-muted-foreground text-sm">
              {gameStage === 'betting' && "Place your bet to start playing"}
              {gameStage === 'playing' && `Current hand: ${playerScore}`}
              {gameStage === 'result' && gameResult === 'win' && 
                <span className="text-green-500">You won!</span>}
              {gameStage === 'result' && gameResult === 'lose' && 
                <span className="text-red-500">You lost!</span>}
              {gameStage === 'result' && gameResult === 'push' && 
                <span className="text-amber-500">Push - bet returned</span>}
            </p>
          </div>
          
          {/* Blackjack table visualization */}
          <div className="relative w-full h-48 md:h-56 border border-amber-900/30 rounded-lg overflow-hidden bg-green-900 mb-6">
            {/* Table background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={tableSvgPath} 
                alt="Blackjack Table" 
                className="object-cover w-full h-full"
              />
            </div>
            
            {/* Dealer's cards */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center">
              <div className="text-amber-200 text-xs absolute -top-4 left-1/2 transform -translate-x-1/2 font-bold">
                Dealer {dealerCardHidden ? `(${dealerScore})` : `(${dealerScore})`}
              </div>
              <div className="flex space-x-1">
                {dealerCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="transition-all duration-300 transform"
                    style={{ 
                      transform: `rotate(${(index - dealerCards.length / 2) * 5}deg)`,
                      zIndex: index
                    }}
                  >
                    {formatCard(card, index === 1 && dealerCardHidden)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Player's cards */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center">
              <div className="text-amber-200 text-xs absolute -bottom-4 left-1/2 transform -translate-x-1/2 font-bold">
                Player ({playerScore})
              </div>
              <div className="flex space-x-1">
                {playerCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="transition-all duration-300 transform"
                    style={{ 
                      transform: `rotate(${(index - playerCards.length / 2) * 5}deg)`,
                      zIndex: index
                    }}
                  >
                    {formatCard(card)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Result overlay */}
            {gameStage === 'result' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className={cn(
                  "text-3xl font-bold px-6 py-3 rounded-lg",
                  gameResult === 'win' ? "bg-green-900/80 text-green-300" : 
                  gameResult === 'lose' ? "bg-red-900/80 text-red-300" : 
                  "bg-amber-900/80 text-amber-300"
                )}>
                  {gameResult === 'win' ? "You Win!" : 
                   gameResult === 'lose' ? "Dealer Wins" : "Push"}
                </div>
              </div>
            )}
          </div>
          
          {/* Game statistics */}
          {(gameStage === 'playing' || gameStage === 'betting') && (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Win Chance</p>
                <Badge 
                  variant={winChance > 50 ? "default" : "outline"}
                >
                  {winChance.toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                className="h-2" 
                value={winChance} 
                indicatorColor={winChance > 50 ? "bg-green-500" : "bg-amber-500"}
              />

              <div className="flex justify-between items-center mt-4 mb-2">
                <p className="text-sm font-medium">Potential Payout</p>
                <Badge variant="outline" className="bg-green-900/30">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {potentialPayout.toFixed(2)}
                </Badge>
              </div>
            </>
          )}
          
          <Separator className="my-4 opacity-30" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bet amount field - only shown during betting phase */}
            {gameStage === 'betting' && (
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
            )}

            {/* Game actions - only shown during playing phase */}
            {gameStage === 'playing' && (
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        variant={field.value === 'hit' ? "default" : "outline"}
                        className={field.value === 'hit' ? "bg-green-800" : "bg-gray-950/80 border-gray-800"}
                        onClick={() => field.onChange('hit')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Hit
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={field.value === 'stand' ? "default" : "outline"}
                        className={field.value === 'stand' ? "bg-red-800" : "bg-gray-950/80 border-gray-800"}
                        onClick={() => field.onChange('stand')}
                      >
                        <Hand className="h-4 w-4 mr-2" />
                        Stand
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={field.value === 'double' ? "default" : "outline"}
                        className={field.value === 'double' ? "bg-amber-800" : "bg-gray-950/80 border-gray-800"}
                        onClick={() => field.onChange('double')}
                        disabled={playerCards.length > 2} // Can only double on initial hand
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Double
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={field.value === 'split' ? "default" : "outline"}
                        className={field.value === 'split' ? "bg-blue-800" : "bg-gray-950/80 border-gray-800"}
                        onClick={() => field.onChange('split')}
                        disabled={playerCards.length !== 2 || playerCards[0][0] !== playerCards[1][0]} // Can only split pairs
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Split
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Sparkles intensity="low" sparkleColor="rgba(245, 158, 11, 0.6)">
              <Button
                type="submit"
                disabled={placeBetMutation.isPending || animatingCards}
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white border-amber-950",
                  animatingCards && "animate-pulse"
                )}
              >
                {placeBetMutation.isPending || animatingCards ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin mr-2" />
                    {animatingCards ? "Dealing cards..." : "Processing..."}
                  </>
                ) : gameStage === 'betting' ? (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Place Bet
                  </>
                ) : gameStage === 'playing' ? (
                  <>
                    {watchedAction === 'hit' && <Plus className="h-5 w-5 mr-2" />}
                    {watchedAction === 'stand' && <Hand className="h-5 w-5 mr-2" />}
                    {watchedAction === 'double' && <DollarSign className="h-5 w-5 mr-2" />}
                    {watchedAction === 'split' && <Scissors className="h-5 w-5 mr-2" />}
                    {watchedAction}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Play Again
                  </>
                )}
              </Button>
            </Sparkles>
          </form>
        </Form>
      </div>
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