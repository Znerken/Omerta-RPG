import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { format, differenceInMilliseconds, formatDuration, intervalToDuration } from "date-fns";
import {
  Brain,
  Boxes,
  Cherry,
  Flask,
  ShoppingBag,
  Map,
  PlusCircle,
  MinusCircle,
  Info,
  AlertCircle,
  Zap,
  Plus,
  Lock,
  Package,
  CheckCircle2,
  BarChart4,
  Building,
  Target,
  ThumbsUp,
  Timer,
  ArrowUpRight,
  Skull,
  Beaker,
  TestTube
} from "lucide-react";

// Helper function to format timer display
function calculateProductionTimer(completesAt: string, startedAt: string) {
  const now = new Date();
  const complete = new Date(completesAt);
  const started = new Date(startedAt);
  
  const totalDuration = differenceInMilliseconds(complete, started);
  const remainingDuration = differenceInMilliseconds(complete, now);
  
  // If complete, return 100% progress and "Complete" text
  if (remainingDuration <= 0) {
    return {
      percentComplete: 100,
      timeDisplay: "Complete",
      timeRemaining: "Ready to collect"
    };
  }
  
  // Calculate percentage complete
  const percentComplete = Math.min(100, Math.max(0, ((totalDuration - remainingDuration) / totalDuration) * 100));
  
  // Format remaining time
  const duration = intervalToDuration({ start: now, end: complete });
  const formattedDuration = formatDuration(duration, {
    format: ['hours', 'minutes', 'seconds'],
    delimiter: ', ',
    zero: false,
    paddedWith0: true
  });
  
  return {
    percentComplete,
    timeDisplay: formattedDuration || "< 1 second",
    timeRemaining: `${formattedDuration || "< 1 second"} remaining`
  };
}

// Drug type
type Drug = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  riskLevel: number;
  addictionRate: number;
  strengthBonus: number;
  stealthBonus: number;
  charismaBonus: number;
  intelligenceBonus: number;
  cashGainBonus: number;
  durationHours: number;
  sideEffects: string;
  image: string;
};

// DrugWithQuantity type (drug with user-owned quantity)
type DrugWithQuantity = Drug & {
  quantity: number;
};

// Ingredient type
type Ingredient = {
  id: number;
  name: string;
  description: string;
  price: number;
  rarity: number;
  image: string;
};

// UserIngredient type (ingredient with user-owned quantity)
type UserIngredient = {
  id: number;
  userId: number;
  ingredientId: number;
  quantity: number;
  ingredient: Ingredient;
};

// Lab type (user drug lab)
type Lab = {
  id: number;
  userId: number;
  name: string;
  level: number;
  securityLevel: number;
  capacity: number;
  discoveryChance: number;
  costToUpgrade: number;
  createdAt: string;
};

// Production type (drug production in progress)
type Production = {
  id: number;
  labId: number;
  drugId: number;
  quantity: number;
  startedAt: string;
  completesAt: string;
  isCompleted: boolean;
  successRate: number;
  drug: Drug;
};

// DrugDeal type (drug market listing)
type DrugDeal = {
  id: number;
  sellerId: number;
  buyerId: number | null;
  drugId: number;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: string;
  isPublic: boolean;
  riskLevel: number;
  createdAt: string;
  completedAt: string | null;
  drug: Drug;
};

// MarketDeal type (drug deal with seller info)
type MarketDeal = DrugDeal & {
  seller: {
    username: string;
  };
};

// Addiction type (drug addiction)
type Addiction = {
  id: number;
  userId: number;
  drugId: number;
  level: number;
  withdrawalEffect: string;
  lastDosage: string;
  createdAt: string;
  drug: Drug;
};

// WithdrawalEffect type (drug withdrawal effects)
type WithdrawalEffect = {
  drugId: number;
  drugName: string;
  effect: string;
  severity: number;
};

// Territory type (drug territory)
type Territory = {
  id: number;
  name: string;
  description: string;
  profitModifier: number;
  riskModifier: number;
  reputationRequired: number;
  controlledBy: number | null;
};

// Main component
export default function DrugsPage() {
  const [activeTab, setActiveTab] = useState<string>("inventory");
  
  // Optimized prefetching using useEffect to load the initial data
  useEffect(() => {
    // Prefetch user drugs for the inventory
    queryClient.prefetchQuery({
      queryKey: ['/api/user/drugs'],
    });
    
    // Prefetch user ingredients
    queryClient.prefetchQuery({
      queryKey: ['/api/user/ingredients'],
    });
    
    // Prefetch user drug labs
    queryClient.prefetchQuery({
      queryKey: ['/api/user/drug-labs'],
    });
  }, []);
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <div className="mr-auto">
          <h1 className="text-3xl font-bold">Drug Operations</h1>
          <p className="text-muted-foreground">Manage your drug business operations</p>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="inventory" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="labs" className="flex items-center space-x-2">
            <Flask className="h-4 w-4" />
            <span>Labs</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Market</span>
          </TabsTrigger>
          <TabsTrigger value="territories" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Territories</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Effects</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryTab />
        </TabsContent>
        
        <TabsContent value="labs" className="space-y-4">
          <LabsTab />
        </TabsContent>
        
        <TabsContent value="market" className="space-y-4">
          <MarketTab />
        </TabsContent>
        
        <TabsContent value="territories" className="space-y-4">
          <TerritoriesTab />
        </TabsContent>
        
        <TabsContent value="effects" className="space-y-4">
          <EffectsTab />
        </TabsContent>
        
        {/* Admin tab only shown to admins */}
        <TabsContent value="admin" className="space-y-4">
          <AdminTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Optimize the InventoryTab component
const InventoryTab = React.memo(function InventoryTab() {
  const { data: userDrugs, isLoading: drugsLoading } = useQuery<DrugWithQuantity[]>({
    queryKey: ['/api/user/drugs'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const { data: userIngredients, isLoading: ingredientsLoading } = useQuery<UserIngredient[]>({
    queryKey: ['/api/user/ingredients'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const [activeDrugId, setActiveDrugId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const useDrugMutation = useMutation({
    mutationFn: async (drugId: number) => {
      const res = await apiRequest('POST', `/api/user/drugs/use/${drugId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Drug Used",
          description: data.message,
        });
      } else {
        toast({
          title: "Failed to Use Drug",
          description: data.message || "An error occurred while using the drug",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/user/drugs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const hasIngredients = userIngredients && userIngredients.length > 0;
  const hasDrugs = userDrugs && userDrugs.length > 0;
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Drugs</h2>
        
        {drugsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : hasDrugs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDrugs!.map((drug) => (
              <Card 
                key={drug.id} 
                className={`overflow-hidden ${activeDrugId === drug.id ? 'border-primary' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{drug.name}</CardTitle>
                    <Badge className={getRiskLevelColor(drug.riskLevel)}>
                      Risk: {drug.riskLevel}/10
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-1">
                    <Boxes className="h-4 w-4" />
                    <span>Quantity: {drug.quantity}</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-0">
                  <p className="text-sm mb-4 line-clamp-2">{drug.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="flex flex-col space-y-1 p-2 rounded bg-card">
                      <span className="font-semibold">Base Price</span>
                      <span className="text-green-500 font-bold">${drug.basePrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1 p-2 rounded bg-card">
                      <span className="font-semibold">Addiction Rate</span>
                      <span className="text-amber-500 font-bold">{drug.addictionRate}%</span>
                    </div>
                    <div className="flex flex-col space-y-1 p-2 rounded bg-card">
                      <span className="font-semibold">Duration</span>
                      <span className="font-bold">{drug.durationHours} hours</span>
                    </div>
                    <div className="flex flex-col space-y-1 p-2 rounded bg-card">
                      <span className="font-semibold">Total Value</span>
                      <span className="text-green-500 font-bold">${drug.basePrice * drug.quantity}</span>
                    </div>
                  </div>
                  
                  {activeDrugId === drug.id && (
                    <div className="text-sm space-y-2 mb-4">
                      <h4 className="font-semibold">Effects & Bonuses:</h4>
                      <div className="space-y-1 ml-2">
                        {drug.strengthBonus !== 0 && (
                          <div className="flex justify-between">
                            <span>Strength:</span>
                            <span className={drug.strengthBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                              {drug.strengthBonus > 0 ? '+' : ''}{drug.strengthBonus}%
                            </span>
                          </div>
                        )}
                        {drug.stealthBonus !== 0 && (
                          <div className="flex justify-between">
                            <span>Stealth:</span>
                            <span className={drug.stealthBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                              {drug.stealthBonus > 0 ? '+' : ''}{drug.stealthBonus}%
                            </span>
                          </div>
                        )}
                        {drug.charismaBonus !== 0 && (
                          <div className="flex justify-between">
                            <span>Charisma:</span>
                            <span className={drug.charismaBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                              {drug.charismaBonus > 0 ? '+' : ''}{drug.charismaBonus}%
                            </span>
                          </div>
                        )}
                        {drug.intelligenceBonus !== 0 && (
                          <div className="flex justify-between">
                            <span>Intelligence:</span>
                            <span className={drug.intelligenceBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                              {drug.intelligenceBonus > 0 ? '+' : ''}{drug.intelligenceBonus}%
                            </span>
                          </div>
                        )}
                        {drug.cashGainBonus !== 0 && (
                          <div className="flex justify-between">
                            <span>Cash Gain:</span>
                            <span className={drug.cashGainBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                              {drug.cashGainBonus > 0 ? '+' : ''}{drug.cashGainBonus}%
                            </span>
                          </div>
                        )}
                        {drug.sideEffects && (
                          <div className="pt-1">
                            <span className="text-red-500 font-medium">Side Effects: {drug.sideEffects}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex-col space-y-2 pt-1">
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveDrugId(activeDrugId === drug.id ? null : drug.id)}
                    >
                      {activeDrugId === drug.id ? "Hide Details" : "View Details"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => useDrugMutation.mutate(drug.id)}
                      disabled={useDrugMutation.isPending}
                    >
                      Use Drug
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You don't have any drugs in your inventory</p>
              <p className="text-sm text-muted-foreground mt-2">Visit the Labs tab to start producing drugs or the Market tab to purchase some</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Ingredients</h2>
        
        {ingredientsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : hasIngredients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userIngredients!.map((userIngredient) => (
              <Card key={userIngredient.id} className="overflow-hidden">
                <div className="flex items-center p-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <Cherry className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{userIngredient.ingredient.name}</h3>
                        <p className="text-xs text-muted-foreground">{userIngredient.ingredient.description}</p>
                      </div>
                      <Badge variant="outline">x{userIngredient.quantity}</Badge>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-muted-foreground">Value: ${userIngredient.ingredient.price}/unit</span>
                      <span className="text-muted-foreground">Rarity: {userIngredient.ingredient.rarity}/10</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You don't have any ingredients in your inventory</p>
              <p className="text-sm text-muted-foreground mt-2">Visit other locations to gather ingredients</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

// Optimize the LabsTab component
const LabsTab = React.memo(function LabsTab() {
  const [activeLab, setActiveLab] = useState<number | null>(null);
  
  // Use a more efficient approach for timer updates by using requestAnimationFrame
  // This helps prevent excessive re-renders and is better synchronized with the browser's render cycle
  const [refreshTimer, setRefreshTimer] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const updateTimer = useCallback(() => {
    setRefreshTimer(prev => prev + 1);
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, []);
  
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateTimer);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateTimer]);
  
  // Optimize queries with staleTime settings to prevent unnecessary refetches
  const { data: labs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/user/drug-labs'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const { data: userIngredients, isLoading: ingredientsLoading } = useQuery<UserIngredient[]>({
    queryKey: ['/api/user/ingredients'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const { data: drugs, isLoading: drugsLoading } = useQuery<Drug[]>({
    queryKey: ['/api/drugs'],
    staleTime: 60000, // 1 minute cache
  });
  
  // Create a more efficient approach for loading productions - only request when lab is selected
  const { data: productions, isLoading: productionsLoading } = useQuery<Production[]>({
    queryKey: ['/api/user/drug-labs', activeLab, 'production'],
    enabled: !!activeLab,
    staleTime: 5000, // 5 seconds cache
    refetchInterval: 10000, // Only refetch every 10 seconds
  });
  
  const { toast } = useToast();
  
  // States for production form
  const [selectedDrug, setSelectedDrug] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Create lab mutation
  const createLabMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/user/drug-labs', {
        name: `Lab #${(labs?.length || 0) + 1}`
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Lab Created",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs'] });
      } else {
        toast({
          title: "Failed to Create Lab",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upgrade lab mutation
  const upgradeLabMutation = useMutation({
    mutationFn: async (labId: number) => {
      const res = await apiRequest('PATCH', `/api/user/drug-labs/${labId}/upgrade`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Lab Upgraded",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs'] });
      } else {
        toast({
          title: "Failed to Upgrade Lab",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Start production mutation
  const startProductionMutation = useMutation({
    mutationFn: async ({ labId, drugId, quantity }: { labId: number, drugId: number, quantity: number }) => {
      const res = await apiRequest('POST', `/api/user/drug-labs/${labId}/production`, {
        drugId,
        quantity
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Production Started",
          description: data.message,
        });
        // Reset form
        setSelectedDrug(null);
        setQuantity(1);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs', activeLab, 'production'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/ingredients'] });
      } else {
        toast({
          title: "Failed to Start Production",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Collect production mutation
  const collectProductionMutation = useMutation({
    mutationFn: async (productionId: number) => {
      const res = await apiRequest('POST', '/api/user/drug-labs/collect-production', {
        productionId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Production Collected",
          description: data.message,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs', activeLab, 'production'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/drugs'] });
      } else {
        toast({
          title: "Collection Failed",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const hasLabs = labs && labs.length > 0;
  const selectedLab = activeLab !== null && labs ? labs.find(lab => lab.id === activeLab) : null;
  const hasActiveProductions = productions && productions.length > 0;
  
  // Calculate capacity usage for the selected lab
  const labCapacityUsed = productions?.reduce((total, production) => total + production.quantity, 0) || 0;
  const labCapacityPercentage = selectedLab ? (labCapacityUsed / selectedLab.capacity) * 100 : 0;
  
  return (
    <div className="space-y-8">
      {/* Lab Selection Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Drug Labs</h2>
          <Button onClick={() => createLabMutation.mutate()} disabled={createLabMutation.isPending}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Setup New Lab
          </Button>
        </div>
        
        {labsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : hasLabs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs!.map((lab) => (
              <Card 
                key={lab.id}
                className={`overflow-hidden hover:border-primary cursor-pointer transition-colors ${activeLab === lab.id ? 'border-primary' : ''}`}
                onClick={() => setActiveLab(lab.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{lab.name}</CardTitle>
                    <Badge>Level {lab.level}</Badge>
                  </div>
                  <CardDescription>Created on {format(new Date(lab.createdAt), "MMM d, yyyy")}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Flask className="h-4 w-4 mr-1 text-blue-500" /> Capacity
                      </span>
                      <span className="font-medium">{lab.capacity} units</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1 text-red-500" /> Risk
                      </span>
                      <span className="font-medium">{lab.discoveryChance}% discovery chance</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Lock className="h-4 w-4 mr-1 text-green-500" /> Security
                      </span>
                      <span className="font-medium">Level {lab.securityLevel}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      upgradeLabMutation.mutate(lab.id);
                    }}
                    disabled={upgradeLabMutation.isPending}
                  >
                    Upgrade (${lab.costToUpgrade})
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You don't have any drug labs yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create a new lab to start producing drugs</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Production Management Section - Only shown when a lab is selected */}
      {selectedLab && (
        <div className="space-y-6">
          <Separator />
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Lab Management: {selectedLab.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production overview card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Lab Overview</CardTitle>
                <CardDescription>Status and capacity information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Capacity Usage:</span>
                    <span className="text-sm font-bold">{labCapacityUsed} / {selectedLab.capacity} units</span>
                  </div>
                  <Progress value={labCapacityPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Production Efficiency:</span>
                    <span>{100 + (selectedLab.level * 5)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Quality Rating:</span>
                    <span>{selectedLab.level * 10}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Drug Strength:</span>
                    <span>+{selectedLab.level * 2}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Risk Reduction:</span>
                    <span>-{selectedLab.securityLevel * 5}%</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-amber-500">Risk Assessment</p>
                      <p className="mt-1">Your lab has a {selectedLab.discoveryChance}% chance of being discovered by law enforcement with each production cycle.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Start new production card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Start New Production</CardTitle>
                <CardDescription>Available Capacity: {selectedLab.capacity - labCapacityUsed} units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {labCapacityUsed >= selectedLab.capacity ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-500">Lab at Full Capacity</p>
                      <p className="mt-1 text-sm">You need to collect completed productions before starting new ones.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="drug-select" className="text-sm font-medium block mb-2">
                        Select Drug to Produce
                      </label>
                      <select
                        id="drug-select"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedDrug || ''}
                        onChange={(e) => setSelectedDrug(parseInt(e.target.value))}
                      >
                        <option value="">Select a drug type to produce</option>
                        {drugs?.map((drug) => (
                          <option key={drug.id} value={drug.id}>
                            {drug.name} (Base: ${drug.basePrice}, Risk: {drug.riskLevel}/10)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="quantity" className="text-sm font-medium block mb-2">
                        Quantity (Capacity Units)
                      </label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(selectedLab.capacity - labCapacityUsed, parseInt(e.target.value))))}
                          className="h-8"
                          min={1}
                          max={selectedLab.capacity - labCapacityUsed}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQuantity(Math.min(selectedLab.capacity - labCapacityUsed, quantity + 1))}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {selectedDrug && drugs && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Required Ingredients:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-3 bg-primary/5 rounded-md flex justify-between">
                            <span className="text-sm">Placeholder Ingredient 1</span>
                            <span className="text-sm font-medium">x{quantity}</span>
                          </div>
                          <div className="p-3 bg-primary/5 rounded-md flex justify-between">
                            <span className="text-sm">Placeholder Ingredient 2</span>
                            <span className="text-sm font-medium">x{quantity * 2}</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-secondary/20 rounded-md space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Est. Completion Time:</span>
                            <span className="text-sm font-medium">{Math.round(quantity * 0.5)} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Success Rate:</span>
                            <span className="text-sm font-medium">{Math.min(95, 70 + selectedLab.level * 5)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Final Risk Level:</span>
                            <span className="text-sm font-medium">
                              {Math.max(1, drugs.find(d => d.id === selectedDrug)?.riskLevel - selectedLab.securityLevel)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full mt-4"
                      disabled={!selectedDrug || quantity < 1 || startProductionMutation.isPending}
                      onClick={() => {
                        if (activeLab !== null && selectedDrug !== null) {
                          startProductionMutation.mutate({
                            labId: activeLab,
                            drugId: selectedDrug,
                            quantity
                          });
                        }
                      }}
                    >
                      {startProductionMutation.isPending ? (
                        <>Starting Production...</>
                      ) : (
                        <>Start Production</>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Active productions section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Active Productions</h3>
            
            {productionsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : hasActiveProductions ? (
              <div className="space-y-4">
                {productions!.map((production) => {
                  const timer = calculateProductionTimer(production.completesAt, production.startedAt);
                  const isComplete = new Date(production.completesAt) <= new Date();
                  
                  return (
                    <Card key={production.id} className={`overflow-hidden ${isComplete ? 'border-green-500' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{production.drug.name} x{production.quantity}</CardTitle>
                          <Badge variant={isComplete ? "default" : "secondary"}>
                            {isComplete ? "Complete" : "In Progress"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Started on {format(new Date(production.startedAt), "MMM d, h:mm a")}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Success Rate:</span>
                            <span className="font-medium">{production.successRate}%</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span>Expected Value:</span>
                            <span className="font-medium">${production.drug.basePrice * production.quantity}</span>
                          </div>
                          
                          {!isComplete && (
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{timer.timeRemaining}</span>
                                <span>{Math.round(timer.percentComplete)}%</span>
                              </div>
                              <Progress value={timer.percentComplete} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter>
                        {isComplete ? (
                          <Button 
                            className="w-full"
                            onClick={() => collectProductionMutation.mutate(production.id)}
                            disabled={collectProductionMutation.isPending}
                          >
                            Collect Production
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            {timer.timeDisplay} Remaining
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border border-dashed">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No active productions in this lab</p>
                  <p className="text-sm text-muted-foreground mt-2">Start a new production to begin manufacturing drugs</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// Optimize the MarketTab component
const MarketTab = React.memo(function MarketTab() {
  const { data: marketDeals, isLoading: marketLoading } = useQuery<MarketDeal[]>({
    queryKey: ['/api/drug-market'],
    staleTime: 10000, // 10 seconds cache
  });
  
  const { data: userDeals, isLoading: userDealsLoading } = useQuery<DrugDeal[]>({
    queryKey: ['/api/drug-deals'],
    staleTime: 10000, // 10 seconds cache
  });
  
  const { data: userDrugs, isLoading: drugsLoading } = useQuery<DrugWithQuantity[]>({
    queryKey: ['/api/user/drugs'],
    // Data should already be available from preload in parent component
  });
  
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'browse' | 'my-deals'>('browse');
  const [selectedDrug, setSelectedDrug] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  
  const buyDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      const res = await apiRequest('POST', `/api/drug-deals/${dealId}/buy`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Deal Purchased",
          description: data.message,
        });
      } else {
        toast({
          title: "Purchase Failed",
          description: data.message || "Failed to purchase deal",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/drug-market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drugs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const cancelDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      const res = await apiRequest('POST', `/api/drug-deals/${dealId}/cancel`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deal Cancelled",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drugs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createDealMutation = useMutation({
    mutationFn: async (dealData: { drugId: number, quantity: number, pricePerUnit: number, isPublic: boolean }) => {
      const res = await apiRequest('POST', '/api/drug-deals', {
        ...dealData,
        totalPrice: dealData.quantity * dealData.pricePerUnit,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deal Listed",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drugs'] });
      
      // Reset form
      setSelectedDrug(null);
      setQuantity(1);
      setPricePerUnit(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateDeal = () => {
    if (selectedDrug === null || quantity <= 0 || pricePerUnit <= 0) return;
    
    createDealMutation.mutate({
      drugId: selectedDrug,
      quantity,
      pricePerUnit,
      isPublic: true,
    });
  };
  
  const selectedDrugDetails = userDrugs?.find(drug => drug.id === selectedDrug);
  const totalPrice = quantity * pricePerUnit;
  
  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'browse' | 'my-deals')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Market</TabsTrigger>
          <TabsTrigger value="my-deals">My Deals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Create New Listing</CardTitle>
                <CardDescription>Sell your drugs on the market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="drug-select" className="text-sm font-medium block mb-2">
                    Select Drug
                  </label>
                  <select
                    id="drug-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedDrug || ''}
                    onChange={(e) => setSelectedDrug(parseInt(e.target.value))}
                  >
                    <option value="">Select a drug</option>
                    {userDrugs?.map((drug) => (
                      <option key={drug.id} value={drug.id}>
                        {drug.name} (Qty: {drug.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="text-sm font-medium block mb-2">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    min={1}
                    max={selectedDrugDetails?.quantity || 1}
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="text-sm font-medium block mb-2">
                    Price Per Unit ($)
                  </label>
                  <input
                    id="price"
                    type="number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(parseInt(e.target.value))}
                    min={1}
                  />
                </div>
                
                {selectedDrugDetails && (
                  <div className="text-sm space-y-2 p-4 bg-secondary/20 rounded-md">
                    <div className="flex justify-between">
                      <span>Base Value:</span>
                      <span>${selectedDrugDetails.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Price:</span>
                      <span>${pricePerUnit}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Sale Value:</span>
                      <span>${totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-amber-500">
                      <span>Risk Level:</span>
                      <span>{selectedDrugDetails.riskLevel}/10</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleCreateDeal} 
                  className="w-full"
                  disabled={!selectedDrug || quantity <= 0 || pricePerUnit <= 0 || createDealMutation.isPending}
                >
                  List on Market
                </Button>
              </CardContent>
            </Card>
            
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold">Available Deals</h2>
              
              {marketLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : marketDeals && marketDeals.length > 0 ? (
                <div className="space-y-4">
                  {marketDeals.map((deal) => (
                    <Card key={deal.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{deal.drug.name} x{deal.quantity}</CardTitle>
                          <Badge variant={getRiskBadgeVariant(deal.drug.riskLevel)}>
                            Risk: {deal.drug.riskLevel}
                          </Badge>
                        </div>
                        <CardDescription>Seller: {deal.seller.username}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Listed on {format(new Date(deal.createdAt), "MMM d, h:mm a")}
                          </span>
                          <span className="font-bold">${deal.pricePerUnit} per unit</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Total Price:</span>
                            <span className="font-medium">${deal.totalPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Value:</span>
                            <span className="font-medium">${deal.drug.basePrice * deal.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Markup:</span>
                            <span className={`font-medium ${deal.totalPrice > deal.drug.basePrice * deal.quantity ? 'text-red-500' : 'text-green-500'}`}>
                              {Math.round((deal.totalPrice / (deal.drug.basePrice * deal.quantity) * 100) - 100)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => buyDealMutation.mutate(deal.id)}
                          disabled={buyDealMutation.isPending}
                        >
                          Buy Now (${deal.totalPrice})
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border border-dashed">
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No active drug deals on the market</p>
                    <p className="text-sm text-muted-foreground mt-2">Be the first to list your drugs for sale</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="my-deals" className="space-y-6 mt-6">
          <h2 className="text-2xl font-bold">Your Active Listings</h2>
          
          {userDealsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : userDeals && userDeals.length > 0 ? (
            <div className="space-y-4">
              {userDeals.map((deal) => (
                <Card key={deal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{deal.drug.name} x{deal.quantity}</CardTitle>
                      <Badge variant={getDealStatusBadgeVariant(deal.status)}>
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Listed on {format(new Date(deal.createdAt), "MMM d, h:mm a")}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Price per unit:</span>
                        <span className="font-medium">${deal.pricePerUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total value:</span>
                        <span className="font-medium">${deal.totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium">
                          {deal.status === 'completed' ? 'Sold' : 
                           deal.status === 'pending' ? 'Available' : 
                           deal.status === 'cancelled' ? 'Cancelled' : deal.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    {deal.status === 'pending' && (
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={() => cancelDealMutation.mutate(deal.id)}
                        disabled={cancelDealMutation.isPending}
                      >
                        Cancel Listing
                      </Button>
                    )}
                    {deal.status === 'completed' && (
                      <div className="w-full text-center text-sm text-muted-foreground">
                        Sold on {deal.completedAt ? format(new Date(deal.completedAt), "MMM d, h:mm a") : 'unknown date'}
                      </div>
                    )}
                    {deal.status === 'cancelled' && (
                      <div className="w-full text-center text-sm text-muted-foreground">
                        Cancelled
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">You have no active drug listings</p>
                <p className="text-sm text-muted-foreground mt-2">Create listings to sell your drugs on the market</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Memoize the TerritoriesTab component
const TerritoriesTab = React.memo(function TerritoriesTab() {
  const { data: territories, isLoading } = useQuery<Territory[]>({
    queryKey: ['/api/drug-territories'],
    staleTime: 60000, // 1 minute cache
  });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </>
        ) : territories && territories.length > 0 ? (
          territories.map((territory) => (
            <Card key={territory.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{territory.name}</CardTitle>
                <CardDescription className="line-clamp-2">{territory.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <BarChart4 className="h-4 w-4 mr-1 text-green-500" /> Profit Modifier
                    </span>
                    <span className="font-medium">
                      {territory.profitModifier > 100 ? '+' : ''}{territory.profitModifier - 100}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1 text-red-500" /> Risk Modifier
                    </span>
                    <span className="font-medium">
                      {territory.riskModifier > 100 ? '+' : ''}{territory.riskModifier - 100}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1 text-blue-500" /> Reputation Required
                    </span>
                    <span className="font-medium">{territory.reputationRequired}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm pt-2">
                    <span className="flex items-center">
                      <span>Controlled By</span>
                    </span>
                    <Badge>
                      {territory.controlledBy ? "Gang #" + territory.controlledBy : "Unclaimed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  Battle for Control
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="border border-dashed col-span-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No territories found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

// Memoize to improve performance
const EffectsTab = React.memo(function EffectsTab() {
  const { data: addictions, isLoading: addictionsLoading } = useQuery<Addiction[]>({
    queryKey: ['/api/user/addictions'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const { data: withdrawalEffects, isLoading: withdrawalLoading } = useQuery<WithdrawalEffect[]>({
    queryKey: ['/api/user/withdrawal-effects'],
    staleTime: 30000, // 30 seconds cache
  });
  
  const hasWithdrawalEffects = withdrawalEffects && withdrawalEffects.length > 0;
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Addictions</h2>
        
        {addictionsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : addictions && addictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addictions.map((addiction) => (
              <Card key={addiction.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{addiction.drug.name}</CardTitle>
                    <Badge variant="destructive">Level {addiction.level}</Badge>
                  </div>
                  <CardDescription>
                    Last used on {format(new Date(addiction.lastDosage), "MMM d, h:mm a")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Brain className="h-4 w-4 mr-1 text-red-500" /> Withdrawal Effect
                      </span>
                      <span className="font-medium">{addiction.withdrawalEffect}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-amber-500" /> Addiction Rate
                      </span>
                      <span className="font-medium">{addiction.drug.addictionRate}%</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Timer className="h-4 w-4 mr-1 text-blue-500" /> Duration
                      </span>
                      <span className="font-medium">{addiction.drug.durationHours} hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You have no drug addictions</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Active Withdrawal Effects</h2>
        
        {withdrawalLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : hasWithdrawalEffects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {withdrawalEffects!.map((effect) => (
              <Card key={effect.drugId}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{effect.drugName} Withdrawal</CardTitle>
                    <Badge variant={getSeverityBadgeVariant(effect.severity)}>
                      Severity: {effect.severity}/10
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-red-500 font-medium mb-4">{effect.effect}</p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Active withdrawal symptoms are affecting your character's performance:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Crime success rates reduced by {effect.severity * 2}%</li>
                      <li>Stat training effectiveness reduced by {effect.severity * 5}%</li>
                      <li>Energy recovery reduced by {effect.severity * 3}%</li>
                    </ul>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" disabled>Use {effect.drugName} to Ease Symptoms</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You're not experiencing any withdrawal effects</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

function getRiskBadgeVariant(riskLevel: number): "default" | "secondary" | "destructive" | "outline" {
  if (riskLevel <= 3) return "default";
  if (riskLevel <= 6) return "secondary";
  return "destructive";
}

function getRiskLevelColor(riskLevel: number): string {
  if (riskLevel <= 3) return "bg-green-500/80 text-white";
  if (riskLevel <= 6) return "bg-amber-500/80 text-white";
  if (riskLevel <= 8) return "bg-orange-500/80 text-white";
  return "bg-red-500/80 text-white";
}

function getDealStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function getSeverityBadgeVariant(severity: number): "default" | "secondary" | "destructive" | "outline" {
  if (severity <= 3) return "default";
  if (severity <= 7) return "secondary";
  return "destructive";
}

// AdminTab component for drug management
function AdminTab() {
  const [activeSection, setActiveSection] = useState<'drugs' | 'ingredients' | 'recipes'>('drugs');
  const { toast } = useToast();
  
  // Fetch data
  const { data: drugs, isLoading: drugsLoading, refetch: refetchDrugs } = useQuery<Drug[]>({
    queryKey: ['/api/drugs'],
  });
  
  const { data: ingredients, isLoading: ingredientsLoading, refetch: refetchIngredients } = useQuery<Ingredient[]>({
    queryKey: ['/api/drug-ingredients'],
  });
  
  // Create drug form states
  const [newDrug, setNewDrug] = useState({
    name: '',
    description: '',
    basePrice: 1000,
    riskLevel: 5,
    addictionRate: 10,
    strengthBonus: 0,
    stealthBonus: 0,
    charismaBonus: 0,
    intelligenceBonus: 0,
    cashGainBonus: 0,
    durationHours: 1,
    sideEffects: ''
  });
  
  // Create ingredient form states
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    description: '',
    price: 500,
    rarity: 1
  });
  
  // Create recipe form states
  const [newRecipe, setNewRecipe] = useState({
    drugId: 0,
    ingredientId: 0,
    quantity: 1
  });
  
  // Create drug mutation
  const createDrugMutation = useMutation({
    mutationFn: async (drugData: any) => {
      const response = await apiRequest('POST', '/api/admin/drugs', drugData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create drug');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Drug created successfully",
      });
      // Reset form
      setNewDrug({
        name: '',
        description: '',
        basePrice: 1000,
        riskLevel: 5,
        addictionRate: 10,
        strengthBonus: 0,
        stealthBonus: 0,
        charismaBonus: 0,
        intelligenceBonus: 0,
        cashGainBonus: 0,
        durationHours: 1,
        sideEffects: ''
      });
      refetchDrugs();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create ingredient mutation
  const createIngredientMutation = useMutation({
    mutationFn: async (ingredientData: any) => {
      const response = await apiRequest('POST', '/api/admin/drug-ingredients', ingredientData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ingredient');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ingredient created successfully",
      });
      // Reset form
      setNewIngredient({
        name: '',
        description: '',
        price: 500,
        rarity: 1
      });
      refetchIngredients();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      const response = await apiRequest('POST', '/api/admin/drug-recipes', recipeData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recipe');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recipe entry created successfully",
      });
      // Reset form
      setNewRecipe({
        drugId: 0,
        ingredientId: 0,
        quantity: 1
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleCreateDrug = (e: React.FormEvent) => {
    e.preventDefault();
    createDrugMutation.mutate(newDrug);
  };
  
  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    createIngredientMutation.mutate(newIngredient);
  };
  
  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecipe.drugId && newRecipe.ingredientId) {
      createRecipeMutation.mutate(newRecipe);
    }
  };
  
  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDrug(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'description' || name === 'sideEffects' ? value : Number(value)
    }));
  };
  
  const handleIngredientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewIngredient(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'description' ? value : Number(value)
    }));
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Drug System Administration</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Drug System</CardTitle>
          <CardDescription>Add and configure drugs, ingredients, and recipes</CardDescription>
        </CardHeader>
        
        <CardContent>
          <ToggleGroup type="single" value={activeSection} onValueChange={(value) => value && setActiveSection(value as any)}>
            <ToggleGroupItem value="drugs" className="flex-1">
              <TestTube className="h-4 w-4 mr-2" />
              Drugs
            </ToggleGroupItem>
            <ToggleGroupItem value="ingredients" className="flex-1">
              <Cherry className="h-4 w-4 mr-2" />
              Ingredients
            </ToggleGroupItem>
            <ToggleGroupItem value="recipes" className="flex-1">
              <Beaker className="h-4 w-4 mr-2" />
              Recipes
            </ToggleGroupItem>
          </ToggleGroup>
          
          <div className="mt-6">
            {activeSection === 'drugs' && (
              <div className="space-y-6">
                <Card className="border border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle>Create New Drug</CardTitle>
                    <CardDescription>Define properties for a new drug type</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCreateDrug} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">Drug Name</label>
                          <Input 
                            id="name" 
                            name="name"
                            value={newDrug.name} 
                            onChange={handleDrugInputChange} 
                            placeholder="e.g., Adrenaline Boost"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="basePrice" className="text-sm font-medium">Base Price ($)</label>
                          <Input 
                            id="basePrice" 
                            name="basePrice"
                            type="number" 
                            value={newDrug.basePrice} 
                            onChange={handleDrugInputChange} 
                            min={1}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <textarea 
                          id="description"
                          name="description"
                          value={newDrug.description}
                          onChange={handleDrugInputChange}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="A detailed description of the drug and its effects"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="riskLevel" className="text-sm font-medium">Risk Level (1-10)</label>
                          <Input 
                            id="riskLevel" 
                            name="riskLevel"
                            type="number" 
                            value={newDrug.riskLevel} 
                            onChange={handleDrugInputChange} 
                            min={1}
                            max={10}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="addictionRate" className="text-sm font-medium">Addiction Rate (%)</label>
                          <Input 
                            id="addictionRate" 
                            name="addictionRate"
                            type="number" 
                            value={newDrug.addictionRate} 
                            onChange={handleDrugInputChange} 
                            min={0}
                            max={100}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="durationHours" className="text-sm font-medium">Duration (hours)</label>
                          <Input 
                            id="durationHours" 
                            name="durationHours"
                            type="number" 
                            value={newDrug.durationHours} 
                            onChange={handleDrugInputChange} 
                            min={1}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="sideEffects" className="text-sm font-medium">Side Effects</label>
                        <Input 
                          id="sideEffects" 
                          name="sideEffects"
                          value={newDrug.sideEffects} 
                          onChange={handleDrugInputChange} 
                          placeholder="e.g., Paranoia, Hallucinations, Reduced Focus"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-3">Stat Bonuses (%)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="strengthBonus" className="text-xs font-medium">Strength</label>
                            <Input 
                              id="strengthBonus" 
                              name="strengthBonus"
                              type="number" 
                              value={newDrug.strengthBonus} 
                              onChange={handleDrugInputChange} 
                              min={-100}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="stealthBonus" className="text-xs font-medium">Stealth</label>
                            <Input 
                              id="stealthBonus" 
                              name="stealthBonus"
                              type="number" 
                              value={newDrug.stealthBonus} 
                              onChange={handleDrugInputChange} 
                              min={-100}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="charismaBonus" className="text-xs font-medium">Charisma</label>
                            <Input 
                              id="charismaBonus" 
                              name="charismaBonus"
                              type="number" 
                              value={newDrug.charismaBonus} 
                              onChange={handleDrugInputChange} 
                              min={-100}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="intelligenceBonus" className="text-xs font-medium">Intelligence</label>
                            <Input 
                              id="intelligenceBonus" 
                              name="intelligenceBonus"
                              type="number" 
                              value={newDrug.intelligenceBonus} 
                              onChange={handleDrugInputChange} 
                              min={-100}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="cashGainBonus" className="text-xs font-medium">Cash Gain</label>
                            <Input 
                              id="cashGainBonus" 
                              name="cashGainBonus"
                              type="number" 
                              value={newDrug.cashGainBonus} 
                              onChange={handleDrugInputChange} 
                              min={-100}
                              max={100}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createDrugMutation.isPending}
                      >
                        {createDrugMutation.isPending ? 'Creating...' : 'Create New Drug'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Existing Drugs</h3>
                  
                  {drugsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : drugs && drugs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {drugs.map((drug) => (
                        <Card key={drug.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{drug.name}</h4>
                              <Badge variant={getRiskBadgeVariant(drug.riskLevel)}>
                                Risk: {drug.riskLevel}/10
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{drug.description}</p>
                            <div className="flex justify-between text-xs mt-2">
                              <span>Price: ${drug.basePrice}</span>
                              <span>Addiction: {drug.addictionRate}%</span>
                              <span>Duration: {drug.durationHours}h</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border border-dashed">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">No drugs have been created yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            
            {activeSection === 'ingredients' && (
              <div className="space-y-6">
                <Card className="border border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle>Create New Ingredient</CardTitle>
                    <CardDescription>Define properties for a new drug ingredient</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCreateIngredient} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="ingName" className="text-sm font-medium">Ingredient Name</label>
                          <Input 
                            id="ingName" 
                            name="name"
                            value={newIngredient.name} 
                            onChange={handleIngredientInputChange} 
                            placeholder="e.g., Pure Ephedrine"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
                          <Input 
                            id="price" 
                            name="price"
                            type="number" 
                            value={newIngredient.price} 
                            onChange={handleIngredientInputChange} 
                            min={1}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="ingDescription" className="text-sm font-medium">Description</label>
                        <textarea 
                          id="ingDescription"
                          name="description"
                          value={newIngredient.description}
                          onChange={handleIngredientInputChange}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="A description of this ingredient"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="rarity" className="text-sm font-medium">Rarity (1-10)</label>
                        <Input 
                          id="rarity" 
                          name="rarity"
                          type="number" 
                          value={newIngredient.rarity} 
                          onChange={handleIngredientInputChange} 
                          min={1}
                          max={10}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createIngredientMutation.isPending}
                      >
                        {createIngredientMutation.isPending ? 'Creating...' : 'Create New Ingredient'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Existing Ingredients</h3>
                  
                  {ingredientsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : ingredients && ingredients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ingredients.map((ingredient) => (
                        <Card key={ingredient.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{ingredient.name}</h4>
                              <Badge variant="outline">
                                Rarity: {ingredient.rarity}/10
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ingredient.description}</p>
                            <div className="flex justify-between text-xs mt-2">
                              <span>Price: ${ingredient.price}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border border-dashed">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">No ingredients have been created yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            
            {activeSection === 'recipes' && (
              <div className="space-y-6">
                <Card className="border border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle>Create Recipe Entry</CardTitle>
                    <CardDescription>Define ingredients required for drug production</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleCreateRecipe} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="drugId" className="text-sm font-medium">Select Drug</label>
                        <select
                          id="drugId"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newRecipe.drugId}
                          onChange={(e) => setNewRecipe(prev => ({ ...prev, drugId: parseInt(e.target.value) }))}
                          required
                        >
                          <option value="">Select a drug</option>
                          {drugs?.map((drug) => (
                            <option key={drug.id} value={drug.id}>
                              {drug.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="ingredientId" className="text-sm font-medium">Required Ingredient</label>
                        <select
                          id="ingredientId"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newRecipe.ingredientId}
                          onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredientId: parseInt(e.target.value) }))}
                          required
                        >
                          <option value="">Select an ingredient</option>
                          {ingredients?.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="quantity" className="text-sm font-medium">Quantity Required</label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          value={newRecipe.quantity} 
                          onChange={(e) => setNewRecipe(prev => ({ ...prev, quantity: parseInt(e.target.value) }))} 
                          min={1}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createRecipeMutation.isPending || !newRecipe.drugId || !newRecipe.ingredientId}
                      >
                        {createRecipeMutation.isPending ? 'Creating...' : 'Add Recipe Ingredient'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="pt-6">
                      <div className="flex">
                        <Info className="h-5 w-5 mr-2 text-amber-500" />
                        <div>
                          <h3 className="text-sm font-medium text-amber-500">Recipe Functionality</h3>
                          <p className="text-xs mt-1">
                            Recipes define the ingredients required to produce each drug. Multiple ingredients
                            can be associated with each drug by creating separate recipe entries.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}