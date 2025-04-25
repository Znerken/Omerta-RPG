import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MafiaLayout } from "@/components/layout/mafia-layout";
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
  type: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number;
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
            Deal
          </Button>
        </form>
      </Form>
    );
  };

  // Result Dialog
  const BetResultDialog = () => {
    if (!betResult) return null;

    const { bet } = betResult;
    const result = bet.result;

    return (
      <Dialog open={showBetResult} onOpenChange={setShowBetResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {result.win ? "You Won!" : "You Lost"}
            </DialogTitle>
            <DialogDescription>
              {result.win
                ? `You won $${result.amount}`
                : `You lost $${bet.betAmount}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {result.details && (
              <div className="space-y-2">
                {bet.game.type === "dice" && (
                  <div>
                    <p>Dice rolled: <strong>{result.details.diceValue}</strong></p>
                    <p>Your prediction: <strong>{result.details.prediction} than {result.details.targetNumber}</strong></p>
                    <p>Result: <strong>{result.details.success ? "Success" : "Failure"}</strong></p>
                  </div>
                )}

                {bet.game.type === "slots" && (
                  <div>
                    <p className="font-semibold">Slot Results:</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 font-mono">
                      {result.details.reels.map((reel: string[], i: number) => (
                        <div key={i} className="space-y-1">
                          {reel.map((symbol: string, j: number) => (
                            <div key={j} className="bg-secondary p-1 rounded text-center">
                              {symbol}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3">Winning Lines: {result.details.payLines.filter((line: any) => line.win).length}</p>
                    <p>Total Win: ${result.details.totalWin}</p>
                  </div>
                )}

                {bet.game.type === "roulette" && (
                  <div>
                    <p>Number: <strong>{result.details.number}</strong></p>
                    <p>Color: <strong className={result.details.color === "red" ? "text-red-500" : result.details.color === "black" ? "text-black" : "text-green-500"}>
                      {result.details.color}
                    </strong></p>
                    <p>Bet Type: <strong>{result.details.betType}</strong></p>
                    <p>Payout: <strong>{result.details.payout}:1</strong></p>
                  </div>
                )}

                {bet.game.type === "blackjack" && (
                  <div>
                    <p>Player Hand: <strong>{result.details.playerHandValues[0]}</strong></p>
                    <p>Dealer Hand: <strong>{result.details.dealerHandValue}</strong></p>
                    <p>Outcome: <strong>{result.details.outcome}</strong></p>
                    {result.details.blackjack && <p className="text-green-500 font-bold">BLACKJACK!</p>}
                    {result.details.bust && <p className="text-red-500 font-bold">BUST!</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBetResult(false)}
            >
              Close
            </Button>
            <Button type="button" onClick={() => setShowBetResult(false)}>
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (gamesLoading) {
    return (
      <MafiaLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </MafiaLayout>
    );
  }

  if (gamesError) {
    return (
      <MafiaLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-500">
            Error loading casino games
          </h2>
          <p className="mt-2">Please try again later</p>
        </div>
      </MafiaLayout>
    );
  }

  return (
    <MafiaLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Mafia Casino</h1>
          <p className="text-muted-foreground mt-2">
            Test your luck and win big in our exclusive underground casino.
          </p>
        </div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="history">Bet History</TabsTrigger>
            <TabsTrigger value="stats">Your Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {games?.map((game: CasinoGame) => (
                <Card key={game.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>
                      {game.description || `Play ${game.name} and win big!`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Min Bet:</span>
                        <span className="font-medium">${game.minBet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Bet:</span>
                        <span className="font-medium">${game.maxBet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>House Edge:</span>
                        <span className="font-medium">
                          {(game.houseEdge * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => setActiveGame(game)}
                        >
                          Play Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{activeGame?.name}</DialogTitle>
                          <DialogDescription>
                            Place your bet and test your luck!
                          </DialogDescription>
                        </DialogHeader>
                        {activeGame?.type === "dice" && (
                          <DiceGame game={activeGame} />
                        )}
                        {activeGame?.type === "slots" && (
                          <SlotMachine game={activeGame} />
                        )}
                        {activeGame?.type === "roulette" && (
                          <Roulette game={activeGame} />
                        )}
                        {activeGame?.type === "blackjack" && (
                          <Blackjack game={activeGame} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Bets</CardTitle>
                <CardDescription>
                  Track your gambling history and results
                </CardDescription>
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
                                {bet.status === "won" ? (
                                  <span className="text-green-500 font-medium">
                                    +${bet.result.amount}
                                  </span>
                                ) : bet.status === "lost" ? (
                                  <span className="text-red-500 font-medium">
                                    -${bet.betAmount}
                                  </span>
                                ) : (
                                  <span className="text-yellow-500 font-medium">
                                    {bet.status}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                {formatDistanceToNow(
                                  new Date(bet.createdAt),
                                  { addSuffix: true }
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No bets yet. Start playing to see your history!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Your Casino Statistics</CardTitle>
                <CardDescription>
                  Your gambling performance across all games
                </CardDescription>
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
    </MafiaLayout>
  );
}