import React, { useState } from "react";
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
import { Loader2, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Types
type CasinoGame = {
  id: number;
  name: string;
  type: string; // This is actually game_type in the database
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
  isActive: boolean; // This is actually enabled in the database
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

    function onSubmit(values: z.infer<typeof diceFormSchema>) {
      placeBetMutation.mutate({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          prediction: values.prediction,
          targetNumber: values.targetNumber,
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
            name="prediction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prediction</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prediction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="higher">Higher</SelectItem>
                    <SelectItem value="lower">Lower</SelectItem>
                    <SelectItem value="exact">Exact</SelectItem>
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
                  <Input
                    type="number"
                    min={1}
                    max={6}
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
            Place Bet
          </Button>
        </form>
      </Form>
    );
  };

  const SlotMachine = ({ game }: { game: CasinoGame }) => {
    const form = useForm<z.infer<typeof slotFormSchema>>({
      resolver: zodResolver(slotFormSchema),
      defaultValues: {
        betAmount: game.minBet,
        lines: 1,
      },
    });

    function onSubmit(values: z.infer<typeof slotFormSchema>) {
      placeBetMutation.mutate({
        gameId: game.id,
        betAmount: values.betAmount,
        betDetails: {
          lines: values.lines,
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
            name="lines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay Lines</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={5}
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

    const handleClose = () => {
      setShowBetResult(false);
      setBetResult(null);
    };

    return (
      <Dialog open={showBetResult} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={betResult?.bet?.result?.win ? "text-green-500" : "text-red-500"}>
              {betResult?.bet?.result?.win ? "You Won!" : "You Lost!"}
            </DialogTitle>
            <DialogDescription>
              {betResult?.bet?.result?.win
                ? `Congratulations! You won $${betResult?.bet?.result?.amount}`
                : `Better luck next time! You lost $${betResult?.bet?.betAmount}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Game</h4>
                <p className="text-sm">{betResult?.bet?.game?.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Bet Amount</h4>
                <p className="text-sm">${betResult?.bet?.betAmount}</p>
              </div>
            </div>

            {betResult?.bet?.result?.details && (
              <div>
                <h4 className="text-sm font-medium">Details</h4>
                {betResult.bet.game.type === "dice" && (
                  <div className="text-sm">
                    <p>Your prediction: {betResult.bet.result.details.prediction}</p>
                    <p>Target number: {betResult.bet.result.details.targetNumber}</p>
                    <p>Result: {betResult.bet.result.details.result}</p>
                  </div>
                )}
                {betResult.bet.game.type === "slots" && (
                  <div className="text-sm">
                    <p>Lines: {betResult.bet.result.details.lines}</p>
                    <p>Symbols: {betResult.bet.result.details.symbols?.join(", ")}</p>
                    <p>Matches: {betResult.bet.result.details.matches}</p>
                  </div>
                )}
                {betResult.bet.game.type === "roulette" && (
                  <div className="text-sm">
                    <p>Bet type: {betResult.bet.result.details.betType}</p>
                    <p>Numbers: {betResult.bet.result.details.numbers?.join(", ")}</p>
                    <p>Result: {betResult.bet.result.details.result}</p>
                  </div>
                )}
                {betResult.bet.game.type === "blackjack" && (
                  <div className="text-sm">
                    <p>Player hand: {betResult.bet.result.details.playerHand?.join(", ")}</p>
                    <p>Dealer hand: {betResult.bet.result.details.dealerHand?.join(", ")}</p>
                    <p>Player score: {betResult.bet.result.details.playerScore}</p>
                    <p>Dealer score: {betResult.bet.result.details.dealerScore}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render the main casino page
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Casino</h1>
        <Button size="sm" variant="outline">
          <DollarSign className="h-4 w-4 mr-2" />
          ${userBalance || 0}
        </Button>
      </div>

      <Tabs defaultValue="games">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="bets">Your Bets</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-6">
          {gamesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : games?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games?.map((game: CasinoGame) => (
                <Card key={game.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Bet:</span>
                        <span>${game.minBet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Bet:</span>
                        <span>${game.maxBet}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
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
            <Card>
              <CardHeader>
                <CardTitle>{activeGame.name}</CardTitle>
                <CardDescription>{activeGame.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {activeGame.type === "dice" && <DiceGame game={activeGame} />}
                {activeGame.type === "slots" && <SlotMachine game={activeGame} />}
                {activeGame.type === "roulette" && <Roulette game={activeGame} />}
                {activeGame.type === "blackjack" && <Blackjack game={activeGame} />}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveGame(null)}>
                  Back to Games
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bets">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bets</CardTitle>
              <CardDescription>Your betting history</CardDescription>
            </CardHeader>
            <CardContent>
              {betsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-border" />
                </div>
              ) : bets?.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Game</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Result</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bets.map((bet: CasinoBet) => (
                          <tr
                            key={bet.id}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-2">{bet.game.name}</td>
                            <td className="p-2">${bet.betAmount}</td>
                            <td className="p-2">
                              {bet.result?.win ? (
                                <span className="text-green-500 font-medium">
                                  Won ${bet.result.amount}
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium">
                                  Lost ${bet.betAmount}
                                </span>
                              )}
                            </td>
                            <td className="p-2">
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
                <div className="text-center py-6 text-muted-foreground">
                  No bets yet. Start playing to see your betting history!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Your Statistics</CardTitle>
              <CardDescription>See how you're doing at our casino</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-border" />
                </div>
              ) : stats?.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Game</th>
                          <th className="p-2 text-left">Bets</th>
                          <th className="p-2 text-left">Wagered</th>
                          <th className="p-2 text-left">Won</th>
                          <th className="p-2 text-left">Lost</th>
                          <th className="p-2 text-left">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((stat: CasinoStat) => (
                          <tr
                            key={stat.gameId}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-2">{stat.game.name}</td>
                            <td className="p-2">{stat.totalBets}</td>
                            <td className="p-2">${stat.totalWagered}</td>
                            <td className="p-2 text-green-500">
                              ${stat.totalWon}
                            </td>
                            <td className="p-2 text-red-500">
                              ${stat.totalLost}
                            </td>
                            <td className="p-2">
                              <span
                                className={
                                  stat.totalWon > stat.totalLost
                                    ? "text-green-500 font-medium"
                                    : "text-red-500 font-medium"
                                }
                              >
                                ${stat.totalWon - stat.totalLost}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No stats yet. Start playing to see your statistics!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BetResultDialog />
    </div>
  );
}