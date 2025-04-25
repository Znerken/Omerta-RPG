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
              <Card key={drug.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{drug.name}</CardTitle>
                    <Badge variant={getRiskBadgeVariant(drug.riskLevel)}>
                      Risk: {drug.riskLevel}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{drug.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-1" /> Quantity
                      </span>
                      <span className="font-medium">{drug.quantity}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Timer className="h-4 w-4 mr-1" /> Duration
                      </span>
                      <span className="font-medium">{drug.durationHours} hours</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" /> Addiction Rate
                      </span>
                      <span className="font-medium">{drug.addictionRate}%</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {drug.strengthBonus > 0 && (
                        <div className="flex items-center text-green-500">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> +{drug.strengthBonus} Strength
                        </div>
                      )}
                      {drug.stealthBonus > 0 && (
                        <div className="flex items-center text-green-500">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> +{drug.stealthBonus} Stealth
                        </div>
                      )}
                      {drug.charismaBonus > 0 && (
                        <div className="flex items-center text-green-500">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> +{drug.charismaBonus} Charisma
                        </div>
                      )}
                      {drug.intelligenceBonus > 0 && (
                        <div className="flex items-center text-green-500">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> +{drug.intelligenceBonus} Intelligence
                        </div>
                      )}
                      {drug.cashGainBonus > 0 && (
                        <div className="flex items-center text-green-500">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> +{drug.cashGainBonus}% Cash
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => useDrugMutation.mutate(drug.id)}
                    disabled={useDrugMutation.isPending}
                  >
                    Use Drug
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You don't have any drugs in your inventory.</p>
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
              <Card key={item.id} className="flex items-center p-4 space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Beaker className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.ingredient.name}</h3>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <Badge variant="outline">Rarity: {item.ingredient.rarity}</Badge>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You don't have any ingredients in your inventory.</p>
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
  
  const handleCreateLab = () => {
    if (!newLabName) return;
    
    createLabMutation.mutate({
      name: newLabName,
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
              <Card className="border border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Create New Lab</CardTitle>
                  <CardDescription>Establish a new drug production facility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <label htmlFor="lab-name" className="text-sm font-medium">
                        Lab Name
                      </label>
                      <input
                        id="lab-name"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newLabName}
                        onChange={(e) => setNewLabName(e.target.value)}
                        placeholder="Enter lab name"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateLab} 
                      className="w-full"
                      disabled={!newLabName || createLabMutation.isPending}
                    >
                      Create Lab ($5,000)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">No Labs Found</CardTitle>
                <CardDescription>Create your first drug production facility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <label htmlFor="lab-name" className="text-sm font-medium">
                      Lab Name
                    </label>
                    <input
                      id="lab-name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newLabName}
                      onChange={(e) => setNewLabName(e.target.value)}
                      placeholder="Enter lab name"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateLab} 
                    className="w-full"
                    disabled={!newLabName || createLabMutation.isPending}
                  >
                    Create Lab ($5,000)
                  </Button>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Start New Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          {allDrugs?.map((drug) => (
                            <option key={drug.id} value={drug.id}>
                              {drug.name} (Risk Level: {drug.riskLevel})
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
                          value={productionQuantity}
                          onChange={(e) => setProductionQuantity(parseInt(e.target.value))}
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleStartProduction} 
                      className="w-full"
                      disabled={!selectedDrug || startProductionMutation.isPending}
                    >
                      Start Production
                    </Button>
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
                        <Card key={production.id} className={isCompleted ? "border-2 border-green-500" : ""}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{production.drug.name} x{production.quantity}</CardTitle>
                              <Badge variant={isCompleted ? "success" : "secondary"}>
                                {isCompleted ? "Ready for Collection" : "In Progress"}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between text-sm">
                                <span>Success Rate</span>
                                <span className="font-medium">{production.successRate}%</span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} />
                              </div>
                              
                              <div className="text-sm">
                                <span className="text-muted-foreground">
                                  {isCompleted ? 
                                    "Completed on " + format(completesAt, "MMM d, h:mm a") :
                                    "Completes on " + format(completesAt, "MMM d, h:mm a")
                                  }
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border border-dashed">
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No active production in this lab</p>
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