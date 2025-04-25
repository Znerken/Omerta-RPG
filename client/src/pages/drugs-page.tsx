import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";
import { MafiaLayout } from "@/components/layout/mafia-layout";
import { Progress } from "@/components/ui/progress";
import { 
  Pill, 
  FlaskConical, // Using FlaskConical instead of Flask2
  Beaker, 
  PanelTop, 
  MapPin, // Using MapPin instead of Map
  Package, 
  AlertCircle, 
  Ruler, 
  Timer, // Using Timer instead of Hourglass
  Activity,
  Brain,
  BarChart4,
  ThumbsUp,
  ArrowUpDown, // Using ArrowUpDown instead of Diff
  ServerCrash,
  ShoppingBag,
  Loader2,
  BadgeInfo,
  Shield,
  Banknote,
  FileSignature,
  Factory,
  Search,
  Plus,
  Minus,
  Clock,
  BadgePercent
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

type DrugWithQuantity = Drug & {
  quantity: number;
};

type Ingredient = {
  id: number;
  name: string;
  description: string;
  price: number;
  rarity: number;
  image: string;
};

type UserIngredient = {
  id: number;
  userId: number;
  ingredientId: number;
  quantity: number;
  ingredient: Ingredient;
};

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

type MarketDeal = DrugDeal & {
  seller: {
    username: string;
  };
};

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

type WithdrawalEffect = {
  drugId: number;
  drugName: string;
  effect: string;
  severity: number;
};

type Territory = {
  id: number;
  name: string;
  description: string;
  profitModifier: number;
  riskModifier: number;
  reputationRequired: number;
  controlledBy: number | null;
};

export default function DrugsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-8">
          <TabsTrigger value="inventory" className="text-lg py-3">
            <Pill className="mr-2 h-5 w-5" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="labs" className="text-lg py-3">
            <FlaskConical className="mr-2 h-5 w-5" /> Labs
          </TabsTrigger>
          <TabsTrigger value="market" className="text-lg py-3">
            <Package className="mr-2 h-5 w-5" /> Market
          </TabsTrigger>
          <TabsTrigger value="territories" className="text-lg py-3">
            <MapPin className="mr-2 h-5 w-5" /> Territories
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-lg py-3">
            <Activity className="mr-2 h-5 w-5" /> Effects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <InventoryTab />
        </TabsContent>
        
        <TabsContent value="labs" className="space-y-6">
          <LabsTab />
        </TabsContent>
        
        <TabsContent value="market" className="space-y-6">
          <MarketTab />
        </TabsContent>
        
        <TabsContent value="territories" className="space-y-6">
          <TerritoriesTab />
        </TabsContent>
        
        <TabsContent value="effects" className="space-y-6">
          <EffectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InventoryTab() {
  const { data: userDrugs, isLoading: drugsLoading } = useQuery<DrugWithQuantity[]>({
    queryKey: ['/api/user/drugs'],
  });
  
  const { data: userIngredients, isLoading: ingredientsLoading } = useQuery<UserIngredient[]>({
    queryKey: ['/api/user/ingredients'],
  });
  
  const { toast } = useToast();
  
  const useDrugMutation = useMutation({
    mutationFn: async (drugId: number) => {
      const res = await apiRequest('POST', `/api/user/drugs/use/${drugId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Drug Used",
        description: data.message,
      });
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
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Drugs</h2>
        </div>
        
        {drugsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : userDrugs && userDrugs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDrugs.map((drug) => (
              <Card key={drug.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-200 relative bg-black/40">
                {/* Pseudo-glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Risk level indicator ribbon */}
                <div className={`absolute -right-8 top-4 rotate-45 w-32 text-center text-xs font-bold py-1 ${getRiskLevelColor(drug.riskLevel)}`}>
                  RISK: {drug.riskLevel}/10
                </div>

                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full">
                      <Pill className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
                        {drug.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">{drug.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2 relative z-10">
                  <div className="space-y-3">
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-black/30 rounded p-2 flex flex-col items-center justify-center">
                        <Package className="h-4 w-4 mb-1 text-primary/80" />
                        <span className="font-bold text-sm">{drug.quantity}</span>
                        <span className="text-[10px] text-muted-foreground">Quantity</span>
                      </div>
                      
                      <div className="bg-black/30 rounded p-2 flex flex-col items-center justify-center">
                        <Timer className="h-4 w-4 mb-1 text-primary/80" />
                        <span className="font-bold text-sm">{drug.durationHours}h</span>
                        <span className="text-[10px] text-muted-foreground">Duration</span>
                      </div>
                      
                      <div className="bg-black/30 rounded p-2 flex flex-col items-center justify-center">
                        <AlertCircle className="h-4 w-4 mb-1 text-primary/80" />
                        <span className="font-bold text-sm">{drug.addictionRate}%</span>
                        <span className="text-[10px] text-muted-foreground">Addiction</span>
                      </div>
                    </div>
                    
                    <Separator className="my-2 bg-primary/20" />
                    
                    {/* Bonus effects */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs uppercase font-semibold text-primary/70 mb-2">Effects</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {drug.strengthBonus > 0 && (
                          <div className="flex items-center bg-black/20 px-2 py-1 rounded">
                            <div className="mr-1.5 bg-green-500/20 p-0.5 rounded">
                              <ArrowUpDown className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="text-green-400">+{drug.strengthBonus} Strength</span>
                          </div>
                        )}
                        {drug.stealthBonus > 0 && (
                          <div className="flex items-center bg-black/20 px-2 py-1 rounded">
                            <div className="mr-1.5 bg-green-500/20 p-0.5 rounded">
                              <ArrowUpDown className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="text-green-400">+{drug.stealthBonus} Stealth</span>
                          </div>
                        )}
                        {drug.charismaBonus > 0 && (
                          <div className="flex items-center bg-black/20 px-2 py-1 rounded">
                            <div className="mr-1.5 bg-green-500/20 p-0.5 rounded">
                              <ArrowUpDown className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="text-green-400">+{drug.charismaBonus} Charisma</span>
                          </div>
                        )}
                        {drug.intelligenceBonus > 0 && (
                          <div className="flex items-center bg-black/20 px-2 py-1 rounded">
                            <div className="mr-1.5 bg-green-500/20 p-0.5 rounded">
                              <ArrowUpDown className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="text-green-400">+{drug.intelligenceBonus} Intelligence</span>
                          </div>
                        )}
                        {drug.cashGainBonus > 0 && (
                          <div className="flex items-center bg-black/20 px-2 py-1 rounded">
                            <div className="mr-1.5 bg-green-500/20 p-0.5 rounded">
                              <ArrowUpDown className="h-3 w-3 text-green-500" />
                            </div>
                            <span className="text-green-400">+{drug.cashGainBonus}% Cash</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="relative z-10">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20" 
                    onClick={() => useDrugMutation.mutate(drug.id)}
                    disabled={useDrugMutation.isPending}
                  >
                    {useDrugMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <>Use Drug</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-primary/20 bg-black/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
            <CardContent className="pt-10 pb-10 text-center relative z-10">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-black/50 p-4 border border-primary/30">
                  <Package className="h-10 w-10 text-primary/60" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Empty Inventory</h3>
                  <p className="text-muted-foreground">You don't have any drugs in your inventory yet.</p>
                </div>
                <Button variant="outline" className="mt-2 border-primary/40 text-primary hover:bg-primary/10">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Visit the Market
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Ingredients</h2>
        
        {ingredientsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : userIngredients && userIngredients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userIngredients.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-black/40 group hover:border-primary/30 transition-all duration-200 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center p-4 space-x-4 relative z-10">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3 rounded-full">
                    <Beaker className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">{item.ingredient.name}</h3>
                    <div className="flex items-center mt-1">
                      <Package className="h-3 w-3 mr-1 text-primary/70" />
                      <p className="text-xs text-muted-foreground">{item.quantity} units</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge 
                      className={`
                        ${item.ingredient.rarity <= 3 ? 'bg-green-500/20 text-green-200 hover:bg-green-500/30' : 
                          item.ingredient.rarity <= 6 ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 
                          'bg-red-500/20 text-red-200 hover:bg-red-500/30'}
                      `}
                    >
                      Rarity: {item.ingredient.rarity}
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-1">${item.ingredient.price}/unit</span>
                  </div>
                </div>
                
                {item.ingredient.rarity >= 7 && (
                  <div className="absolute -right-8 top-3 rotate-45 w-32 text-center text-xs font-bold py-0.5 bg-purple-600/80 text-white">
                    RARE
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-primary/20 bg-black/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
            
            {/* Add subtle shimmer overlay */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer opacity-50"></div>
            </div>
            
            <CardContent className="pt-10 pb-10 text-center relative z-10">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-black/50 p-4 border border-primary/30 relative">
                  <Beaker className="h-10 w-10 text-primary/60" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent animate-pulse opacity-50"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Empty Ingredients</h3>
                  <p className="text-muted-foreground">You need to acquire ingredients for drug production.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-2 border-primary/40 text-primary hover:bg-primary/10 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  <Search className="mr-2 h-4 w-4" />
                  <span className="relative z-10">Scavenge for Ingredients</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function LabsTab() {
  const [activeLab, setActiveLab] = useState<number | null>(null);
  
  const { data: userLabs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/user/drug-labs'],
  });
  
  const { data: allDrugs, isLoading: drugsLoading } = useQuery<Drug[]>({
    queryKey: ['/api/drugs'],
  });
  
  const { data: userIngredients, isLoading: ingredientsLoading } = useQuery<UserIngredient[]>({
    queryKey: ['/api/user/ingredients'],
  });
  
  const { data: productions, isLoading: productionsLoading } = useQuery<Production[]>({
    queryKey: ['/api/user/drug-labs', activeLab, 'production'],
    enabled: activeLab !== null,
  });
  
  const { toast } = useToast();
  
  const createLabMutation = useMutation({
    mutationFn: async (lab: { name: string, costToUpgrade: number }) => {
      const res = await apiRequest('POST', '/api/user/drug-labs', lab);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lab Created",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const upgradeLabMutation = useMutation({
    mutationFn: async (labId: number) => {
      const res = await apiRequest('PATCH', `/api/user/drug-labs/${labId}/upgrade`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lab Upgraded",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const startProductionMutation = useMutation({
    mutationFn: async ({ labId, drugId, quantity }: { labId: number, drugId: number, quantity: number }) => {
      const res = await apiRequest('POST', `/api/user/drug-labs/${labId}/production`, {
        drugId,
        quantity,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Production Started",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs', activeLab, 'production'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const collectProductionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/user/drug-labs/collect-production');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Production Collected",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/drug-labs', activeLab, 'production'] });
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
  
  const [newLabName, setNewLabName] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<number | null>(null);
  const [productionQuantity, setProductionQuantity] = useState(1);
  
  // Location options for drug labs with descriptions
  const labLocations = [
    "Abandoned Warehouse",
    "Underground Bunker",
    "Remote Farmhouse", 
    "Suburban Basement",
    "Industrial District",
    "Forgotten Storage Unit",
    "Hidden Mountain Cabin",
    "Condemned Building",
    "Offshore Platform",
    "Desert Compound"
  ];
  
  // Location descriptions for tooltips and UI elements
  const locationDescriptions: Record<string, { description: string, riskModifier: number, productionModifier: number, icon: React.ReactNode }> = {
    "Abandoned Warehouse": {
      description: "An old warehouse in the industrial zone. Moderate risk, good production capacity.",
      riskModifier: 0,
      productionModifier: 10,
      icon: <Warehouse className="h-4 w-4" />
    },
    "Underground Bunker": {
      description: "Deep beneath the surface and well-hidden. Low risk but limited capacity.",
      riskModifier: -15,
      productionModifier: -5,
      icon: <PackageCheck className="h-4 w-4" />
    },
    "Remote Farmhouse": {
      description: "Far from the city, but harder to distribute. Low risk, low capacity.",
      riskModifier: -10,
      productionModifier: -10,
      icon: <Home className="h-4 w-4" />
    },
    "Suburban Basement": {
      description: "Hidden in plain sight. Moderate risk and moderate capacity.",
      riskModifier: 5,
      productionModifier: 0,
      icon: <StairsDown className="h-4 w-4" />
    },
    "Industrial District": {
      description: "Blends in with other businesses. Moderate risk, high capacity.",
      riskModifier: 0,
      productionModifier: 15,
      icon: <Factory className="h-4 w-4" />
    },
    "Forgotten Storage Unit": {
      description: "Anonymous and discreet. Low risk, moderate capacity.",
      riskModifier: -5,
      productionModifier: 5,
      icon: <Package className="h-4 w-4" />
    },
    "Hidden Mountain Cabin": {
      description: "Remote and difficult to access. Very low risk, very low capacity.",
      riskModifier: -20,
      productionModifier: -15,
      icon: <Mountain className="h-4 w-4" />
    },
    "Condemned Building": {
      description: "No one goes in, but looks suspicious. High risk, high capacity.",
      riskModifier: 15,
      productionModifier: 20,
      icon: <Building className="h-4 w-4" />
    },
    "Offshore Platform": {
      description: "International waters, high setup and running costs. Low risk, very high capacity.",
      riskModifier: -10,
      productionModifier: 25,
      icon: <Anchor className="h-4 w-4" />
    },
    "Desert Compound": {
      description: "Isolated and defensible, but attracts attention. Moderate risk, very high capacity.",
      riskModifier: 5,
      productionModifier: 30,
      icon: <Nfc className="h-4 w-4" />
    }
  };
  const [selectedLocation, setSelectedLocation] = useState(labLocations[0]);

  const handleCreateLab = () => {
    if (!newLabName) return;
    
    createLabMutation.mutate({
      name: newLabName,
      location: selectedLocation,
      costToUpgrade: 5000, // Base cost for a new lab
    });
    
    setNewLabName('');
  };
  
  const handleStartProduction = () => {
    if (activeLab === null || selectedDrug === null) return;
    
    startProductionMutation.mutate({
      labId: activeLab,
      drugId: selectedDrug,
      quantity: productionQuantity,
    });
    
    setSelectedDrug(null);
    setProductionQuantity(1);
  };
  
  const completedProductions = productions?.filter(p => {
    const completesAt = new Date(p.completesAt);
    return !p.isCompleted && completesAt <= new Date();
  });
  
  useEffect(() => {
    if (userLabs && userLabs.length > 0 && activeLab === null) {
      setActiveLab(userLabs[0].id);
    }
  }, [userLabs, activeLab]);
  
  const hasCompletedProductions = completedProductions && completedProductions.length > 0;
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-2xl font-bold">Your Labs</h2>
          
          {labsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : userLabs && userLabs.length > 0 ? (
            <div className="space-y-4">
              {userLabs.map((lab) => (
                <Card 
                  key={lab.id} 
                  className={`cursor-pointer transition-all duration-200 ${activeLab === lab.id ? 'border-2 border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setActiveLab(lab.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{lab.name}</CardTitle>
                      <Badge>Level {lab.level}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <PanelTop className="h-4 w-4 mr-1 text-amber-500" /> 
                        <span>Capacity: {lab.capacity}</span>
                      </div>
                      <div className="flex items-center">
                        <ServerCrash className="h-4 w-4 mr-1 text-blue-500" /> 
                        <span>Security: {lab.securityLevel}</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-red-500" /> 
                        <span>Risk: {lab.discoveryChance}%</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart4 className="h-4 w-4 mr-1 text-green-500" /> 
                        <span>Upgrade: ${lab.costToUpgrade}</span>
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
                      Upgrade Lab
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Create new lab section */}
              <Card className="border-2 border-dashed border-primary/30 overflow-hidden bg-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-primary/30 to-primary/10 p-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
                        Create New Lab
                      </CardTitle>
                      <CardDescription>Establish a secure drug production facility</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="space-y-5">
                    <div className="bg-black/50 p-4 rounded-md border border-primary/20">
                      <div className="flex items-center mb-3">
                        <BadgeInfo className="h-4 w-4 mr-2 text-primary/70" />
                        <span className="text-xs text-muted-foreground">Establishing a lab requires careful planning and resources</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div className="flex items-center bg-black/30 p-2 rounded">
                          <Shield className="h-3.5 w-3.5 mr-1.5 text-blue-400/80" />
                          <span>Security: Level 1</span>
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                          <Package className="h-3.5 w-3.5 mr-1.5 text-amber-400/80" />
                          <span>Capacity: 5 units</span>
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-400/80" />
                          <span>Risk: 25%</span>
                        </div>
                        <div className="flex items-center bg-black/30 p-2 rounded">
                          <Banknote className="h-3.5 w-3.5 mr-1.5 text-green-400/80" />
                          <span>Cost: $5,000</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label htmlFor="lab-name" className="text-sm font-medium flex items-center">
                          <FileSignature className="h-4 w-4 mr-2 text-primary/70" />
                          Lab Name
                        </label>
                        <input
                          id="lab-name"
                          className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                          value={newLabName}
                          onChange={(e) => setNewLabName(e.target.value)}
                          placeholder="Enter a discreet lab name..."
                        />
                        
                        <label htmlFor="lab-location" className="text-sm font-medium flex items-center mt-3">
                          <MapPin className="h-4 w-4 mr-2 text-primary/70" />
                          Location
                        </label>
                        <select
                          id="lab-location"
                          className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                          {labLocations.map((location) => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                        
                        {/* Location description */}
                        <div className="mt-3 p-3 bg-black/30 rounded border border-primary/10 text-xs">
                          <div className="flex items-center mb-2">
                            <span className="mr-2">
                              {locationDescriptions[selectedLocation].icon}
                            </span>
                            <span className="font-semibold">{selectedLocation}</span>
                          </div>
                          <p className="text-muted-foreground mb-2">{locationDescriptions[selectedLocation].description}</p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                            <div className="flex items-center">
                              <Gauge className="h-3 w-3 mr-1.5 text-red-400" />
                              <span>
                                Risk: 
                                <span className={locationDescriptions[selectedLocation].riskModifier < 0 ? 'text-green-400' : 
                                                   locationDescriptions[selectedLocation].riskModifier > 0 ? 'text-red-400' : 'text-yellow-400'}>
                                  {' '}{locationDescriptions[selectedLocation].riskModifier > 0 ? '+' : ''}
                                  {locationDescriptions[selectedLocation].riskModifier}%
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Rocket className="h-3 w-3 mr-1.5 text-blue-400" />
                              <span>
                                Production: 
                                <span className={locationDescriptions[selectedLocation].productionModifier < 0 ? 'text-red-400' : 
                                                  locationDescriptions[selectedLocation].productionModifier > 0 ? 'text-green-400' : 'text-yellow-400'}>
                                  {' '}{locationDescriptions[selectedLocation].productionModifier > 0 ? '+' : ''}
                                  {locationDescriptions[selectedLocation].productionModifier}%
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleCreateLab} 
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20"
                      disabled={!newLabName || createLabMutation.isPending}
                    >
                      {createLabMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Establishing Lab...</>
                      ) : (
                        <>Establish Lab ($5,000)</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-dashed border-primary/30 overflow-hidden bg-black/40 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-br from-primary/30 to-primary/10 p-2">
                    <Factory className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
                      Your First Lab
                    </CardTitle>
                    <CardDescription>Start your drug empire with a secure production facility</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="space-y-5">
                  <div className="bg-black/50 p-4 rounded-md border border-primary/20">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="text-xs text-muted-foreground">A drug lab is required to begin production operations</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div className="flex items-center bg-black/30 p-2 rounded">
                        <Shield className="h-3.5 w-3.5 mr-1.5 text-blue-400/80" />
                        <span>Security: Level 1</span>
                      </div>
                      <div className="flex items-center bg-black/30 p-2 rounded">
                        <Package className="h-3.5 w-3.5 mr-1.5 text-amber-400/80" />
                        <span>Capacity: 5 units</span>
                      </div>
                      <div className="flex items-center bg-black/30 p-2 rounded">
                        <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-400/80" />
                        <span>Risk: 25%</span>
                      </div>
                      <div className="flex items-center bg-black/30 p-2 rounded">
                        <Banknote className="h-3.5 w-3.5 mr-1.5 text-green-400/80" />
                        <span>Cost: $5,000</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label htmlFor="lab-name-first" className="text-sm font-medium flex items-center">
                        <FileSignature className="h-4 w-4 mr-2 text-primary/70" />
                        Lab Name
                      </label>
                      <input
                        id="lab-name-first"
                        className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                        value={newLabName}
                        onChange={(e) => setNewLabName(e.target.value)}
                        placeholder="Enter a discreet lab name..."
                      />
                      
                      <label htmlFor="lab-location-first" className="text-sm font-medium flex items-center mt-3">
                        <MapPin className="h-4 w-4 mr-2 text-primary/70" />
                        Location
                      </label>
                      <select
                        id="lab-location-first"
                        className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        {labLocations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                      
                      {/* Location description */}
                      <div className="mt-3 p-3 bg-black/30 rounded border border-primary/10 text-xs">
                        <div className="flex items-center mb-2">
                          <span className="mr-2">
                            {locationDescriptions[selectedLocation].icon}
                          </span>
                          <span className="font-semibold">{selectedLocation}</span>
                        </div>
                        <p className="text-muted-foreground mb-2">{locationDescriptions[selectedLocation].description}</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                          <div className="flex items-center">
                            <Gauge className="h-3 w-3 mr-1.5 text-red-400" />
                            <span>
                              Risk: 
                              <span className={locationDescriptions[selectedLocation].riskModifier < 0 ? 'text-green-400' : 
                                                locationDescriptions[selectedLocation].riskModifier > 0 ? 'text-red-400' : 'text-yellow-400'}>
                                {' '}{locationDescriptions[selectedLocation].riskModifier > 0 ? '+' : ''}
                                {locationDescriptions[selectedLocation].riskModifier}%
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Rocket className="h-3 w-3 mr-1.5 text-blue-400" />
                            <span>
                              Production: 
                              <span className={locationDescriptions[selectedLocation].productionModifier < 0 ? 'text-red-400' : 
                                                locationDescriptions[selectedLocation].productionModifier > 0 ? 'text-green-400' : 'text-yellow-400'}>
                                {' '}{locationDescriptions[selectedLocation].productionModifier > 0 ? '+' : ''}
                                {locationDescriptions[selectedLocation].productionModifier}%
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-30 blur-lg"></div>
                    <Button 
                      onClick={handleCreateLab} 
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 relative z-10"
                      disabled={!newLabName || createLabMutation.isPending}
                    >
                      {createLabMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Establishing Lab...</>
                      ) : (
                        <>Establish Lab ($5,000)</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Production</h2>
            
            {hasCompletedProductions && (
              <Button 
                onClick={() => collectProductionMutation.mutate()}
                disabled={collectProductionMutation.isPending}
                variant="outline"
              >
                Collect All Completed Production
              </Button>
            )}
          </div>
          
          {activeLab === null ? (
            <Card className="border border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Select a lab from the left to manage production</p>
              </CardContent>
            </Card>
          ) : productionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="border-2 border-primary/30 overflow-hidden bg-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-primary/30 to-primary/10 p-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
                        Start New Production
                      </CardTitle>
                      <CardDescription>Begin producing drugs in this lab</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4 relative z-10">
                  <div className="space-y-5">
                    <div className="bg-black/50 p-4 rounded-md border border-primary/20">
                      <div className="flex items-center mb-3">
                        <BadgeInfo className="h-4 w-4 mr-2 text-primary/70" />
                        <span className="text-xs text-muted-foreground">Select a drug and quantity to begin production</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label htmlFor="drug-select" className="text-sm font-medium flex items-center">
                            <Pill className="h-4 w-4 mr-2 text-primary/70" />
                            Select Drug
                          </label>
                          <select
                            id="drug-select"
                            className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedDrug || ''}
                            onChange={(e) => setSelectedDrug(parseInt(e.target.value))}
                          >
                            <option value="">Select a drug to produce</option>
                            {allDrugs?.map((drug) => (
                              <option key={drug.id} value={drug.id}>
                                {drug.name} (Risk: {drug.riskLevel} | Base Price: ${drug.basePrice})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-3">
                          <label htmlFor="quantity" className="text-sm font-medium flex items-center">
                            <Package className="h-4 w-4 mr-2 text-primary/70" />
                            Production Quantity
                          </label>
                          <div className="flex items-center">
                            <input
                              id="quantity"
                              type="number"
                              className="flex h-10 w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                              value={productionQuantity}
                              onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 1)}
                              min={1}
                              max={10}
                            />
                            <div className="flex flex-col ml-3 space-y-1">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-5 w-5 rounded-sm"
                                onClick={() => setProductionQuantity(Math.min(10, productionQuantity + 1))}
                              >
                                <span className="sr-only">Increase</span>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-5 w-5 rounded-sm"
                                onClick={() => setProductionQuantity(Math.max(1, productionQuantity - 1))}
                                disabled={productionQuantity <= 1}
                              >
                                <span className="sr-only">Decrease</span>
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1.5" />
                            Producing more units increases risk but improves efficiency
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-30 blur-lg"></div>
                      <Button 
                        onClick={handleStartProduction} 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 relative z-10"
                        disabled={!selectedDrug || startProductionMutation.isPending}
                      >
                        {startProductionMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting Production...</>
                        ) : (
                          <>Start Drug Production</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Active Productions</h3>
                
                {productions && productions.length > 0 ? (
                  <div className="space-y-4">
                    {productions.filter(p => !p.isCompleted).map((production) => {
                      const now = new Date();
                      const completesAt = new Date(production.completesAt);
                      const isCompleted = completesAt <= now;
                      const totalDuration = new Date(production.completesAt).getTime() - new Date(production.startedAt).getTime();
                      const elapsed = now.getTime() - new Date(production.startedAt).getTime();
                      const progress = isCompleted ? 100 : Math.min(100, Math.round((elapsed / totalDuration) * 100));
                      
                      return (
                        <Card 
                          key={production.id} 
                          className={`overflow-hidden bg-black/40 relative ${isCompleted ? "border-2 border-green-500" : "border-primary/30"}`}
                        >
                          {/* Background effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-50"></div>
                          
                          {/* Add subtle shimmer effect to the card when in progress */}
                          {!isCompleted && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent z-10 overflow-hidden">
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                            </div>
                          )}
                          
                          {/* Completion indicator */}
                          {isCompleted && (
                            <div className="absolute top-3 right-3 rounded-full bg-green-500/20 p-1.5 z-20">
                              <Badge variant="success" className="px-2 py-0">
                                Ready
                              </Badge>
                            </div>
                          )}
                          
                          <CardHeader className="relative z-10 pb-2">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full">
                                <FlaskConical className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">
                                  {production.drug.name} <span className="text-sm font-normal text-white">x{production.quantity}</span>
                                </CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1.5" />
                                  {isCompleted ? 
                                    "Completed on " + format(completesAt, "MMM d, h:mm a") :
                                    "Completes on " + format(completesAt, "MMM d, h:mm a")
                                  }
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="relative z-10 pt-0">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded">
                                  <div className="p-1 rounded-full bg-amber-500/20">
                                    <BadgePercent className="h-3.5 w-3.5 text-amber-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Success Rate</span>
                                    <span className="font-medium">{production.successRate}%</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded">
                                  <div className="p-1 rounded-full bg-blue-500/20">
                                    <Package className="h-3.5 w-3.5 text-blue-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <span className="font-medium">{production.quantity} units</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="flex items-center">
                                    <Activity className="h-4 w-4 mr-1.5 text-primary/70" />
                                    <span>Progress</span>
                                  </span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <div className="relative h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-primary/20">
                                  <div 
                                    className={`absolute top-0 left-0 h-full rounded-full ${
                                      isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-primary/80'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  >
                                    {/* Animated shimmer effect when in progress */}
                                    {!isCompleted && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isCompleted && (
                                <div className="pt-1">
                                  <Button 
                                    className="w-full bg-gradient-to-r from-green-500/80 to-green-600/90 hover:from-green-500 hover:to-green-600 border-0 text-white"
                                    size="sm"
                                    onClick={() => collectProductionMutation.mutate()}
                                    disabled={collectProductionMutation.isPending}
                                  >
                                    {collectProductionMutation.isPending ? (
                                      <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Collecting...</>
                                    ) : (
                                      <>Collect Production</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-primary/20 bg-black/40 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
                    
                    {/* Add subtle shimmer overlay */}
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer opacity-50"></div>
                    </div>
                    
                    <CardContent className="pt-10 pb-10 text-center relative z-10">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="rounded-full bg-black/50 p-4 border border-primary/30 relative">
                          <FlaskConical className="h-10 w-10 text-primary/60" />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent animate-pulse opacity-50"></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">No Active Production</h3>
                          <p className="text-muted-foreground">Start producing drugs using the form above</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketTab() {
  const { data: marketDeals, isLoading: marketLoading } = useQuery<MarketDeal[]>({
    queryKey: ['/api/drug-market'],
  });
  
  const { data: userDeals, isLoading: userDealsLoading } = useQuery<DrugDeal[]>({
    queryKey: ['/api/drug-deals'],
  });
  
  const { data: userDrugs, isLoading: drugsLoading } = useQuery<DrugWithQuantity[]>({
    queryKey: ['/api/user/drugs'],
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
                    <p className="text-muted-foreground">No drug deals available on the market</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="my-deals" className="space-y-6 mt-6">
          <h2 className="text-2xl font-bold">My Drug Deals</h2>
          
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
                      {deal.status === "completed" 
                        ? "Sold to buyer" 
                        : deal.status === "cancelled" 
                          ? "Deal cancelled" 
                          : deal.isPublic 
                            ? "Listed on public market" 
                            : "Private sale"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {deal.status === "completed" 
                          ? `Completed on ${format(new Date(deal.completedAt!), "MMM d, h:mm a")}` 
                          : `Listed on ${format(new Date(deal.createdAt), "MMM d, h:mm a")}`}
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
                        <span>Profit:</span>
                        <span className={`font-medium ${deal.totalPrice > deal.drug.basePrice * deal.quantity ? 'text-green-500' : 'text-red-500'}`}>
                          ${deal.totalPrice - (deal.drug.basePrice * deal.quantity)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  {deal.status === "pending" && (
                    <CardFooter>
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={() => cancelDealMutation.mutate(deal.id)}
                        disabled={cancelDealMutation.isPending}
                      >
                        Cancel Listing
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">You haven't created any drug deals yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TerritoriesTab() {
  const { data: territories, isLoading } = useQuery<Territory[]>({
    queryKey: ['/api/drug-territories'],
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
}

function EffectsTab() {
  const { data: addictions, isLoading: addictionsLoading } = useQuery<Addiction[]>({
    queryKey: ['/api/user/addictions'],
  });
  
  const { data: withdrawalEffects, isLoading: withdrawalLoading } = useQuery<WithdrawalEffect[]>({
    queryKey: ['/api/user/withdrawal-effects'],
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
                        <Hourglass className="h-4 w-4 mr-1 text-blue-500" /> Duration
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
}

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