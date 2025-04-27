import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  ChevronsUp,
  ChevronsDown,
  BarChart,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Target,
  Percent,
  Sparkles as SparklesIcon
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const diceFormSchema = z.object({
  betAmount: z.number().min(10).max(10000),
  prediction: z.enum(["higher", "lower", "exact"]),
  targetNumber: z.number().min(1).max(6),
});

type DiceGameProps = {
  game: CasinoGame;
  onPlaceBet: (data: {
    gameId: number;
    betAmount: number;
    betDetails: any;
  }) => void;
  betResult: any | null;
  isPlacingBet: boolean;
};

export function DiceGame({ game, onPlaceBet, betResult, isPlacingBet }: DiceGameProps) {
  const form = useForm<z.infer<typeof diceFormSchema>>({
    resolver: zodResolver(diceFormSchema),
    defaultValues: {
      betAmount: game.minBet,
      prediction: "higher",
      targetNumber: 3,
    },
  });

  const [animatingDice, setAnimatingDice] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; timestamp: number } | null>(null);
  
  const watchedPrediction = form.watch("prediction");
  const watchedTarget = form.watch("targetNumber");
  const watchedBetAmount = form.watch("betAmount");
  
  // Reset dice animation when form values change
  useEffect(() => {
    setDiceValue(null);
  }, [watchedPrediction, watchedTarget, watchedBetAmount]);

  // Update dice value and last win when bet result changes
  useEffect(() => {
    if (betResult && betResult.bet && betResult.bet.gameId === game.id) {
      const diceRoll = betResult.bet.result.details?.diceValue || Math.floor(Math.random() * 6) + 1;
      setDiceValue(diceRoll);
      
      if (betResult.bet.result.win) {
        setLastWin({
          amount: betResult.bet.result.amount,
          timestamp: Date.now()
        });
      }
    }
  }, [betResult, game.id]);

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

  const winChance = calculateWinChance(watchedPrediction, watchedTarget);
  const potentialPayout = calculatePayout(watchedPrediction, watchedBetAmount);

  async function onSubmit(values: z.infer<typeof diceFormSchema>) {
    setAnimatingDice(true);
    
    try {
      await onPlaceBet({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          prediction: values.prediction,
          targetNumber: values.targetNumber,
        },
      });
    } finally {
      setTimeout(() => {
        setAnimatingDice(false);
      }, 500);
    }
  }

  // Render 3D dice
  const renderDice = (value: number | null, animate: boolean = false) => {
    const faces = [
      // 1 - Front face
      <div key="front" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
      </div>,
      // 2 - Back face
      <div key="back" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-8 w-full h-full p-4">
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
          <div className="w-3 h-3 bg-white rounded-full shadow-inner self-end justify-self-end" />
        </div>
      </div>,
      // 3 - Right face
      <div key="right" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-3">
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-0 h-0" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-center" />
          <div className="w-0 h-0" />
          <div className="w-0 h-0" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-end justify-self-end" />
        </div>
      </div>,
      // 4 - Left face
      <div key="left" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
        </div>
      </div>,
      // 5 - Top face
      <div key="top" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-3">
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-center" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
        </div>
      </div>,
      // 6 - Bottom face
      <div key="bottom" className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-2 w-full h-full p-3">
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
          <div className="w-0 h-0" />
          <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
        </div>
      </div>,
    ];

    let faceToShow = value !== null ? faces[value - 1] : faces[2]; // Default to 3 if no value

    return (
      <div className="perspective-600 my-8">
        <motion.div
          className="relative w-24 h-24 mx-auto preserve-3d shadow-lg rounded-lg"
          initial={animate ? { rotateX: 0, rotateY: 0 } : false}
          animate={
            animate
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 360, 720, 1080],
                }
              : false
          }
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* All six faces */}
          {value === null ? (
            <>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateY(0deg) translateZ(12px)" }}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateY(180deg) translateZ(12px)" }}
              >
                <div className="grid grid-cols-2 gap-8 w-full h-full p-4">
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner self-end justify-self-end" />
                </div>
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateY(90deg) translateZ(12px)" }}
              >
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-3">
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-0 h-0" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-center" />
                  <div className="w-0 h-0" />
                  <div className="w-0 h-0" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-end justify-self-end" />
                </div>
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateY(-90deg) translateZ(12px)" }}
              >
                <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
                  <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
                </div>
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateX(90deg) translateZ(12px)" }}
              >
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-3">
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner place-self-center" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                </div>
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center"
                style={{ transform: "rotateX(-90deg) translateZ(12px)" }}
              >
                <div className="grid grid-cols-3 grid-rows-2 w-full h-full p-3">
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                  <div className="w-0 h-0" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                </div>
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-red-950 flex items-center justify-center rounded-lg"
            >
              {faceToShow}
            </div>
          )}

          {/* Edge highlight */}
          <div className="absolute inset-0 rounded-lg border border-red-500/50" />
        </motion.div>

        {/* Visual guide for dice face numbers */}
        <div className="flex justify-center mt-6 space-x-2">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div 
              key={num} 
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold",
                diceValue === num 
                  ? "bg-red-800/70 border-2 border-red-500/70 text-white" 
                  : "bg-black/30 border border-gray-700/70 text-gray-400",
                num === watchedTarget 
                  ? "ring-2 ring-amber-500/40" 
                  : "",
                ((watchedPrediction === "higher" && num > watchedTarget) || 
                (watchedPrediction === "lower" && num < watchedTarget) || 
                (watchedPrediction === "exact" && num === watchedTarget))
                  ? "bg-green-950/25 border-green-800/40" 
                  : ""
              )}
            >
              {num}
            </div>
          ))}
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
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-red-900/30 shadow-lg">
        <div className="text-center mb-2">
          <h3 className="text-xl font-semibold text-red-200">Dice Challenge</h3>
          <p className="text-gray-400 text-sm">
            {watchedPrediction === "higher" && `Roll will be HIGHER than ${watchedTarget}`}
            {watchedPrediction === "lower" && `Roll will be LOWER than ${watchedTarget}`}
            {watchedPrediction === "exact" && `Roll will be EXACTLY ${watchedTarget}`}
          </p>
        </div>
        
        {renderDice(diceValue, animatingDice)}
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-300 flex items-center">
                <Percent className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Win Chance
              </p>
              <Badge 
                variant={winChance > 50 ? "default" : (winChance > 20 ? "outline" : "destructive")}
                className={winChance > 50 ? "bg-green-900 text-green-100" : winChance > 20 ? "border-amber-700 text-amber-200" : ""}
              >
                {winChance.toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              className="h-2" 
              value={winChance} 
              indicatorColor={winChance > 50 ? "bg-green-500" : (winChance > 20 ? "bg-amber-500" : "bg-red-500")}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-300 flex items-center">
                <Target className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                Potential Win
              </p>
              <Badge variant="outline" className="bg-green-950/50 border-green-700/50 text-green-300">
                ${potentialPayout.toFixed(2)}
              </Badge>
            </div>
            <Progress 
              className="h-2" 
              value={(potentialPayout / (watchedBetAmount * 5)) * 100} 
              indicatorColor="bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/60 shadow-md">
            <FormField
              control={form.control}
              name="betAmount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel className="text-gray-200">Bet Amount</FormLabel>
                    <div className="text-sm text-gray-400">
                      Min: ${game.minBet} | Max: ${game.maxBet}
                    </div>
                  </div>
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
                          className="bg-gray-950/80 border-gray-800 focus:border-red-900/50"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/60 shadow-md">
              <FormField
                control={form.control}
                name="prediction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Prediction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-950/80 border-gray-800 focus:border-red-900/50">
                          <SelectValue placeholder="Select a prediction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-950 border-gray-800">
                        <SelectItem value="higher">
                          <div className="flex items-center">
                            <ChevronsUp className="h-4 w-4 mr-2 text-green-500" />
                            <span>Higher than target</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="lower">
                          <div className="flex items-center">
                            <ChevronsDown className="h-4 w-4 mr-2 text-red-500" />
                            <span>Lower than target</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="exact">
                          <div className="flex items-center">
                            <BarChart className="h-4 w-4 mr-2 text-yellow-500" />
                            <span>Exact match</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800/60 shadow-md">
              <FormField
                control={form.control}
                name="targetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Target Number</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-r-none border-gray-800 bg-gray-950/80"
                            onClick={() => field.onChange(Math.max(1, field.value - 1))}
                            disabled={field.value <= 1}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={6}
                            className="rounded-none text-center bg-gray-950/80 border-gray-800"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-l-none border-gray-800 bg-gray-950/80"
                            onClick={() => field.onChange(Math.min(6, field.value + 1))}
                            disabled={field.value >= 6}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Sparkles intensity="low" sparkleColor="rgba(255, 215, 0, 0.7)">
            <Button
              type="submit"
              disabled={isPlacingBet || animatingDice}
              className={cn(
                "w-full py-6 text-lg font-semibold",
                "bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800",
                "border border-red-500/30 shadow-lg"
              )}
            >
              {isPlacingBet || animatingDice ? (
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
}