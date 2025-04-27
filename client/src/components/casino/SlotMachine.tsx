import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  RotateCw,
  Target,
  Percent,
  Sparkles as SparklesIcon,
  Loader2,
  Layers
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";

// Define game type
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

// Form schema
const slotFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  lines: z.number().min(1).max(5),
});

type SlotMachineProps = {
  game: CasinoGame;
  onPlaceBet: (data: {
    gameId: number;
    betAmount: number;
    betDetails: any;
  }) => Promise<any>;
  betResult: any | null;
  isPlacingBet: boolean;
};

// Icons for slot machine with fancy SVG versions
const slotIcons = [
  { name: "cherry", value: 1, color: "#e53e3e", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4C12 4 14 6 14 8C14 10 12.5 10.5 12 12C11.5 10.5 10 10 10 8C10 6 12 4 12 4Z" fill="#4ade80"/><circle cx="8" cy="14" r="4" fill="#e53e3e"/><circle cx="16" cy="14" r="4" fill="#e53e3e"/></svg> },
  { name: "lemon", value: 2, color: "#ecc94b", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.7339 4.43527C14.9011 4.13581 17.1168 4.97164 18.4523 6.71544C18.8335 7.21539 19.1246 7.77868 19.3136 8.36878C19.5025 8.95888 19.5863 9.57242 19.5614 10.1863C19.5366 10.8001 19.4035 11.4057 19.1686 11.9708C18.9336 12.5359 18.6006 13.0502 18.1864 13.4899C16.0254 15.9114 13.7217 18.1865 11.2847 20.2995C10.8417 20.7104 10.3245 21.0409 9.7599 21.273C9.19528 21.5052 8.59297 21.6349 7.98258 21.6558C7.37218 21.6767 6.76183 21.5885 6.18366 21.396C5.60548 21.2035 5.06936 20.9103 4.60434 20.5302C2.87416 19.1737 2.07059 16.9359 2.38795 14.7491C2.70531 12.5623 4.30513 10.5118 6.5736 9.71344C7.77675 9.27577 9.09139 9.2139 10.3307 9.53651C9.74342 8.45864 9.56966 7.20595 9.84196 6.01172C10.1143 4.81749 10.8135 3.75619 11.8103 3.0144C12.099 3.19928 12.4231 3.3272 12.7339 3.39999L13.0499 3.49023L12.9614 3.80541C12.7187 4.75509 12.6348 4.88252 12.7339 4.43527Z" fill="#ecc94b" stroke="#0d0e12" strokeWidth="1" strokeLinejoin="round"/></svg> },
  { name: "orange", value: 3, color: "#ed8936", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#ed8936"/><path d="M12 4C12 4 14 5 14 7C14 9 10 9 10 7C10 5 12 4 12 4Z" fill="#4ade80"/></svg> },
  { name: "grapes", value: 4, color: "#805ad5", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="10" r="2" fill="#805ad5"/><circle cx="10" cy="10" r="2" fill="#805ad5"/><circle cx="12" cy="14" r="2" fill="#805ad5"/><circle cx="16" cy="14" r="2" fill="#805ad5"/><circle cx="8" cy="14" r="2" fill="#805ad5"/><path d="M12 4C12 4 14 5 14 7C14 8 13 9 12 9C11 9 10 8 10 7C10 5 12 4 12 4Z" fill="#4ade80"/></svg> },
  { name: "diamond", value: 5, color: "#3182ce", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L20 12L12 20L4 12L12 4Z" fill="#3182ce" stroke="#0d0e12" strokeWidth="1"/></svg> },
  { name: "seven", value: 6, color: "#e53e3e", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#111" stroke="#e53e3e" strokeWidth="1"/><path d="M8 8H16L11 18" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { name: "jackpot", value: 7, color: "#f6e05e", svg: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="16" height="12" rx="2" fill="#111" stroke="#f6e05e" strokeWidth="1"/><circle cx="8" cy="10" r="1.5" fill="#f6e05e"/><circle cx="12" cy="10" r="1.5" fill="#f6e05e"/><circle cx="16" cy="10" r="1.5" fill="#f6e05e"/><circle cx="8" cy="14" r="1.5" fill="#f6e05e"/><circle cx="12" cy="14" r="1.5" fill="#f6e05e"/><circle cx="16" cy="14" r="1.5" fill="#f6e05e"/></svg> },
];

export function SlotMachine({ game, onPlaceBet, betResult, isPlacingBet }: SlotMachineProps) {
  const form = useForm<z.infer<typeof slotFormSchema>>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      betAmount: game.minBet,
      lines: 1,
    },
  });
  
  const [spinning, setSpinning] = useState(false);
  const [reelPositions, setReelPositions] = useState<number[][]>([
    [0, 1, 2], // reel 1 (visible positions)
    [3, 4, 5], // reel 2
    [1, 2, 3]  // reel 3
  ]);
  const [lastWin, setLastWin] = useState<{ amount: number; timestamp: number } | null>(null);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  
  const watchedLines = form.watch("lines");
  const watchedBetAmount = form.watch("betAmount");
  
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
  
  const winChance = calculateSlotsWinChance(watchedLines);
  const potentialPayout = calculateSlotsPayout(watchedBetAmount, watchedLines);

  // Update reel positions and last win when bet result changes
  useEffect(() => {
    if (betResult && betResult.bet && betResult.bet.gameId === game.id) {
      // Extract reels from result or generate random ones if not available
      const resultReels = betResult.bet.result.details?.reels || [
        [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)],
        [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)],
        [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)]
      ];
      
      // Animate the reels
      animateReels(resultReels);
      
      // Extract winning lines if available
      const resultWinningLines = betResult.bet.result.details?.winningLines || [];
      setWinningLines(resultWinningLines);
      
      if (betResult.bet.result.win) {
        setLastWin({
          amount: betResult.bet.result.amount,
          timestamp: Date.now()
        });
      }
    }
  }, [betResult, game.id]);

  // Function to animate the reels with a slot machine effect
  const animateReels = (finalPositions: number[][]) => {
    setSpinning(true);
    
    // Create a sequence of random positions for the animation
    const animationFrames = 20; // Number of frames in the animation
    let animationCounter = 0;
    
    const animationInterval = setInterval(() => {
      if (animationCounter < animationFrames) {
        // Generate random positions during animation
        setReelPositions([
          [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)],
          [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)],
          [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)]
        ]);
        animationCounter++;
      } else {
        // Set final positions and stop animation
        setReelPositions(finalPositions);
        setSpinning(false);
        clearInterval(animationInterval);
      }
    }, 100);
  };

  async function onSubmit(values: z.infer<typeof slotFormSchema>) {
    setSpinning(true);
    setWinningLines([]);
    
    try {
      await onPlaceBet({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          lines: values.lines,
        },
      });
    } catch (error) {
      setSpinning(false);
    }
  }

  // Render a single slot reel
  const renderReel = (reelIndex: number) => {
    return (
      <div className="relative h-40 w-[80px] overflow-hidden rounded-md bg-black/70 border border-gray-800">
        {/* Shadow overlay at top and bottom for 3D effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent z-10"></div>
        
        {/* Symbols container */}
        <div className="relative h-full flex flex-col items-center justify-center gap-2 py-2">
          {reelPositions[reelIndex].map((iconIndex, position) => (
            <div 
              key={position}
              className={cn(
                "flex items-center justify-center h-12 w-12 rounded-md transition-all duration-100",
                spinning ? "animate-pulse" : "",
                position === 1 && winningLines.includes(reelIndex) ? "bg-amber-900/30 ring-2 ring-amber-500" : ""
              )}
            >
              {slotIcons[iconIndex].svg}
            </div>
          ))}
        </div>
        
        {/* Center line indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-yellow-500/40 transform -translate-y-1/2 z-5"></div>
      </div>
    );
  };

  // Render payout table
  const renderPayoutTable = () => {
    return (
      <div className="grid grid-cols-3 gap-1 mt-4 text-xs text-gray-400">
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[0].svg}</div>
          <span>x3: 5x</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[1].svg}</div>
          <span>x3: 10x</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[2].svg}</div>
          <span>x3: 15x</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[3].svg}</div>
          <span>x3: 20x</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[4].svg}</div>
          <span>x3: 25x</span>
        </div>
        <div className="flex items-center">
          <div className="mr-1">{slotIcons[5].svg}</div>
          <span>x3: 40x</span>
        </div>
        <div className="flex items-center col-span-3">
          <div className="mr-1">{slotIcons[6].svg}</div>
          <span>x3: 100x (JACKPOT!)</span>
        </div>
      </div>
    );
  };

  // Animation variants for last win notification
  const winNotificationVariants = {
    initial: { opacity: 0, y: -10, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.9 }
  };

  return (
    <div className="space-y-8 relative">
      {/* Win notification */}
      <AnimatePresence>
        {lastWin && Date.now() - lastWin.timestamp < 5000 && (
          <motion.div
            variants={winNotificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-900/80 to-amber-700/80 text-amber-100 py-2 px-4 rounded-md shadow-lg border border-amber-500/40 text-center backdrop-blur-sm z-10"
          >
            <SparklesIcon className="inline-block h-4 w-4 mr-2 text-amber-300" />
            <span className="font-bold">You won ${lastWin.amount.toLocaleString()}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game visualization area */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30 shadow-lg">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-amber-200">Lucky Slots</h3>
          <p className="text-gray-400 text-sm">
            Line up symbols to win big prizes!
          </p>
        </div>
        
        {/* Slot machine display */}
        <div className="relative mx-auto rounded-lg bg-gray-900/80 p-6 border border-gray-800 shadow-inner max-w-md">
          <div className="flex justify-around items-center space-x-4 mb-4">
            {[0, 1, 2].map((reelIndex) => renderReel(reelIndex))}
          </div>
          
          {/* Lines display */}
          <div className="flex justify-between items-center mt-6">
            <Badge className="bg-amber-900/60 text-amber-200 border-amber-700/50">
              <Layers className="h-3 w-3 mr-1.5" />
              {watchedLines} {watchedLines === 1 ? 'line' : 'lines'} active
            </Badge>
            <Badge className="bg-green-900/60 text-green-200 border-green-700/50">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {watchedBetAmount} per line
            </Badge>
          </div>
          
          {/* Payout information */}
          {renderPayoutTable()}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-300 flex items-center">
                <Percent className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Win Chance
              </p>
              <Badge 
                variant={winChance > 30 ? "default" : (winChance > 15 ? "outline" : "destructive")}
                className={winChance > 30 ? "bg-green-900 text-green-100" : winChance > 15 ? "border-amber-700 text-amber-200" : ""}
              >
                {winChance.toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              className="h-2" 
              value={winChance} 
              indicatorColor={winChance > 30 ? "bg-green-500" : (winChance > 15 ? "bg-amber-500" : "bg-red-500")}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-300 flex items-center">
                <Target className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                Max Payout
              </p>
              <Badge variant="outline" className="bg-green-950/50 border-green-700/50 text-green-300">
                ${potentialPayout.toFixed(2)}
              </Badge>
            </div>
            <Progress 
              className="h-2" 
              value={(potentialPayout / (watchedBetAmount * 10)) * 100} 
              indicatorColor="bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/60 shadow-md">
              <FormField
                control={form.control}
                name="betAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Bet Amount (per line)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <Input
                            type="number"
                            min={game.minBet}
                            max={game.maxBet}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-gray-950/80 border-gray-800 focus:border-amber-900/50"
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
                    <p className="text-xs text-amber-200/70 mt-1">Total bet: ${watchedBetAmount * watchedLines}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/60 shadow-md">
              <FormField
                control={form.control}
                name="lines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Number of Lines</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-gray-950/80 border-gray-800 focus:border-amber-900/50"
                        />
                        <Slider
                          value={[field.value]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-2"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-1">More lines increase win chance but lower potential payouts</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Sparkles intensity="low" sparkleColor="rgba(245, 158, 11, 0.7)">
            <Button
              type="submit"
              disabled={isPlacingBet || spinning}
              className={cn(
                "w-full py-6 text-lg font-semibold",
                "bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800",
                "border border-amber-500/30 shadow-lg"
              )}
            >
              {isPlacingBet || spinning ? (
                <>
                  <RotateCw className="h-5 w-5 animate-spin mr-2" />
                  {spinning ? "Spinning Reels..." : "Placing Bet..."}
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2 text-amber-300" />
                  Spin the Reels
                </>
              )}
            </Button>
          </Sparkles>
        </form>
      </Form>
    </div>
  );
}