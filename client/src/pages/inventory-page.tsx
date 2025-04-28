import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/components/inventory/InventoryItem";
import { StoreItem } from "@/components/inventory/StoreItem";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { 
  ShoppingBag, 
  Info, 
  ShoppingCart,
  Sword,
  Drill,
  Shield, 
  Cherry,
  Loader2,
  SearchIcon,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Ban,
  Brain,
  Heart,
  Crosshair,
  Lock,
  Unlock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";

export default function InventoryPage() {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [sortMethod, setSortMethod] = useState<"price-asc" | "price-desc" | "name" | "level" | "rarity">("price-asc");
  const [filterRarity, setFilterRarity] = useState<string | null>(null);

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: storeItems, isLoading: storeLoading } = useQuery({
    queryKey: ["/api/items"],
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user"],
  });

  const buyItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/purchase`);
      return await res.json();
    },
    onSuccess: (data) => {
      const title = "Item Purchased";
      const message = data.message || `You purchased ${data.item?.name || 'an item'} for ${formatCurrency(data.price || 0)}.`;
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "success",
        read: false,
        timestamp: new Date(),
        data: { 
          itemId: data.item?.id,
          itemName: data.item?.name,
          price: data.price,
          itemType: data.item?.type
        }
      });
      
      toast({
        title: title,
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      const title = "Purchase Failed";
      const message = error.message || "Failed to purchase the item. Please try again.";
      
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "error",
        read: false,
        timestamp: new Date()
      });
      
      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const equipItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", `/api/inventory/${itemId}/toggle-equip`);
      return await res.json();
    },
    onSuccess: (data) => {
      const title = data.equipped ? "Item Equipped" : "Item Unequipped";
      const message = data.message || `You ${data.equipped ? 'equipped' : 'unequipped'} ${data.item?.name || 'an item'}.`;
      
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "info",
        read: false,
        timestamp: new Date(),
        data: { 
          itemId: data.item?.id,
          itemName: data.item?.name,
          equipped: data.equipped,
          itemType: data.item?.type,
          bonuses: {
            strength: data.item?.strengthBonus || 0,
            stealth: data.item?.stealthBonus || 0,
            charisma: data.item?.charismaBonus || 0,
            intelligence: data.item?.intelligenceBonus || 0,
            crimeSuccess: data.item?.crimeSuccessBonus || 0
          }
        }
      });
      
      toast({
        title: title,
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error: any) => {
      const title = "Failed to Equip Item";
      const message = error.message || "There was a problem equipping the item. Please try again.";
      
      addNotification({
        id: Date.now().toString(),
        title: title,
        message: message,
        type: "error",
        read: false,
        timestamp: new Date()
      });
      
      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleBuyItem = (itemId: number) => {
    buyItemMutation.mutate(itemId);
  };

  const handleToggleEquip = (itemId: number) => {
    equipItemMutation.mutate(itemId);
  };

  // Filter and sort store items based on search and filters
  const filteredStoreItems = useMemo(() => {
    if (!storeItems) return [];
    
    let filtered = [...storeItems];
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower) || 
        item.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by rarity
    if (filterRarity) {
      filtered = filtered.filter(item => 
        item.rarity?.toLowerCase() === filterRarity.toLowerCase()
      );
    }
    
    // Sort items
    switch (sortMethod) {
      case "price-asc":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "level":
        filtered = filtered.sort((a, b) => (b.level || 1) - (a.level || 1));
        break;
      case "rarity":
        const rarityOrder: Record<string, number> = {
          common: 1,
          uncommon: 2,
          rare: 3,
          epic: 4,
          legendary: 5
        };
        filtered = filtered.sort((a, b) => {
          const aRarity = a.rarity?.toLowerCase() || 'common';
          const bRarity = b.rarity?.toLowerCase() || 'common';
          return rarityOrder[bRarity] - rarityOrder[aRarity];
        });
        break;
    }
    
    return filtered;
  }, [storeItems, searchTerm, filterRarity, sortMethod]);

  // Filter inventory items based on search
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    if (!inventorySearchTerm) return inventory;
    
    const searchLower = inventorySearchTerm.toLowerCase();
    return inventory.filter((invItem: any) => 
      invItem.item?.name?.toLowerCase().includes(searchLower) || 
      invItem.item?.description?.toLowerCase().includes(searchLower)
    );
  }, [inventory, inventorySearchTerm]);

  // Group inventory by type
  const weapons = filteredInventory?.filter((item: any) => item.item?.type === "weapon") || [];
  const tools = filteredInventory?.filter((item: any) => item.item?.type === "tool") || [];
  const protection = filteredInventory?.filter((item: any) => item.item?.type === "protection") || [];
  const consumables = filteredInventory?.filter((item: any) => item.item?.type === "consumable") || [];

  // Group store items by type
  const storeWeapons = filteredStoreItems?.filter((item: any) => item.type === "weapon") || [];
  const storeTools = filteredStoreItems?.filter((item: any) => item.type === "tool") || [];
  const storeProtection = filteredStoreItems?.filter((item: any) => item.type === "protection") || [];
  const storeConsumables = filteredStoreItems?.filter((item: any) => item.type === "consumable") || [];

  // Calculate total bonuses from equipped items
  const calculateTotalBonuses = () => {
    if (!inventory) return {
      strength: 0,
      stealth: 0,
      charisma: 0,
      intelligence: 0,
      crimeSuccess: 0,
      jailTimeReduction: 0,
      escapeChance: 0
    };
    
    return inventory
      .filter((item: any) => item.equipped)
      .reduce((total: any, inventoryItem: any) => {
        return {
          strength: total.strength + (inventoryItem.item?.strengthBonus || 0),
          stealth: total.stealth + (inventoryItem.item?.stealthBonus || 0),
          charisma: total.charisma + (inventoryItem.item?.charismaBonus || 0),
          intelligence: total.intelligence + (inventoryItem.item?.intelligenceBonus || 0),
          crimeSuccess: total.crimeSuccess + (inventoryItem.item?.crimeSuccessBonus || 0),
          jailTimeReduction: total.jailTimeReduction + (inventoryItem.item?.jailTimeReduction || 0),
          escapeChance: total.escapeChance + (inventoryItem.item?.escapeChanceBonus || 0)
        };
      }, {
        strength: 0,
        stealth: 0,
        charisma: 0,
        intelligence: 0,
        crimeSuccess: 0,
        jailTimeReduction: 0,
        escapeChance: 0
      });
  };

  const totalBonuses = calculateTotalBonuses();

  return (
    <>
      <PageHeader 
        title="Inventory & Store" 
        icon={<ShoppingBag className="h-5 w-5" />}
        description="Equip items to boost your stats and improve your chances of success"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="inventory">
            <TabsList className="mb-6 bg-dark-lighter">
              <TabsTrigger value="inventory" className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Your Inventory
              </TabsTrigger>
              <TabsTrigger value="store" className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Item Store
              </TabsTrigger>
            </TabsList>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory">
              <Card className="bg-dark-surface mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Your Items
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Items you own that can be equipped or used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredInventory && filteredInventory.length > 0 ? (
                    <>
                      <div className="relative mb-6">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="Search your inventory..." 
                          className="pl-10 bg-dark-lighter border-gray-700"
                          value={inventorySearchTerm}
                          onChange={(e) => setInventorySearchTerm(e.target.value)}
                        />
                      </div>
                    
                      <Tabs defaultValue="all">
                        <TabsList className="mb-4 bg-dark-lighter">
                          <TabsTrigger value="all">All Items</TabsTrigger>
                          <TabsTrigger value="weapons">Weapons</TabsTrigger>
                          <TabsTrigger value="tools">Tools</TabsTrigger>
                          <TabsTrigger value="protection">Protection</TabsTrigger>
                          <TabsTrigger value="consumables">Consumables</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredInventory.map((inventoryItem: any) => (
                              <InventoryItem 
                                key={inventoryItem.id} 
                                item={{
                                  ...inventoryItem.item,
                                  equipped: inventoryItem.equipped,
                                  quantity: inventoryItem.quantity
                                }} 
                                onToggleEquip={() => handleToggleEquip(inventoryItem.id)} 
                                isEquipping={equipItemMutation.isPending}
                              />
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="weapons">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {weapons.length > 0 ? (
                              weapons.map((inventoryItem: any) => (
                                <InventoryItem 
                                  key={inventoryItem.id} 
                                  item={{
                                    ...inventoryItem.item,
                                    equipped: inventoryItem.equipped,
                                    quantity: inventoryItem.quantity
                                  }} 
                                  onToggleEquip={() => handleToggleEquip(inventoryItem.id)} 
                                  isEquipping={equipItemMutation.isPending}
                                />
                              ))
                            ) : (
                              <div className="col-span-2 bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                                You don't have any weapons in your inventory
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="tools">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tools.length > 0 ? (
                              tools.map((inventoryItem: any) => (
                                <InventoryItem 
                                  key={inventoryItem.id} 
                                  item={{
                                    ...inventoryItem.item,
                                    equipped: inventoryItem.equipped,
                                    quantity: inventoryItem.quantity
                                  }} 
                                  onToggleEquip={() => handleToggleEquip(inventoryItem.id)} 
                                  isEquipping={equipItemMutation.isPending}
                                />
                              ))
                            ) : (
                              <div className="col-span-2 bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                                You don't have any tools in your inventory
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="protection">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {protection.length > 0 ? (
                              protection.map((inventoryItem: any) => (
                                <InventoryItem 
                                  key={inventoryItem.id} 
                                  item={{
                                    ...inventoryItem.item,
                                    equipped: inventoryItem.equipped,
                                    quantity: inventoryItem.quantity
                                  }} 
                                  onToggleEquip={() => handleToggleEquip(inventoryItem.id)} 
                                  isEquipping={equipItemMutation.isPending}
                                />
                              ))
                            ) : (
                              <div className="col-span-2 bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                                You don't have any protection gear in your inventory
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="consumables">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {consumables.length > 0 ? (
                              consumables.map((inventoryItem: any) => (
                                <InventoryItem 
                                  key={inventoryItem.id} 
                                  item={{
                                    ...inventoryItem.item,
                                    equipped: inventoryItem.equipped,
                                    quantity: inventoryItem.quantity
                                  }} 
                                  onToggleEquip={() => handleToggleEquip(inventoryItem.id)} 
                                  isEquipping={equipItemMutation.isPending}
                                />
                              ))
                            ) : (
                              <div className="col-span-2 bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                                You don't have any consumables in your inventory
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <Alert className="bg-dark-lighter border-gray-700">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Your inventory is empty</AlertTitle>
                      <AlertDescription>
                        Visit the store tab to purchase items that will help you in your criminal activities.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* STORE TAB */}
            <TabsContent value="store">
              <Card className="bg-dark-surface mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Item Store
                    </CardTitle>
                    <Badge className="bg-secondary text-black font-mono">
                      Your Cash: {formatCurrency(userProfile?.cash || 0)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Purchase items to boost your criminal capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {storeLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            placeholder="Search items..." 
                            className="pl-10 bg-dark-lighter border-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="gap-2 bg-dark-lighter">
                                <Filter className="h-4 w-4" />
                                {filterRarity ? filterRarity.charAt(0).toUpperCase() + filterRarity.slice(1) : "All Rarities"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-dark-surface border-gray-700">
                              <DropdownMenuItem 
                                className={!filterRarity ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity(null)}
                              >
                                All Rarities
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={filterRarity === "common" ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity("common")}
                              >
                                Common
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={filterRarity === "uncommon" ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity("uncommon")}
                              >
                                Uncommon
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={filterRarity === "rare" ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity("rare")}
                              >
                                Rare
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={filterRarity === "epic" ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity("epic")}
                              >
                                Epic
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={filterRarity === "legendary" ? "bg-primary/20" : ""}
                                onClick={() => setFilterRarity("legendary")}
                              >
                                Legendary
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="gap-2 bg-dark-lighter">
                                <SlidersHorizontal className="h-4 w-4" />
                                Sort
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-dark-surface border-gray-700">
                              <DropdownMenuItem 
                                className={sortMethod === "price-asc" ? "bg-primary/20" : ""}
                                onClick={() => setSortMethod("price-asc")}
                              >
                                Price: Low to High
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={sortMethod === "price-desc" ? "bg-primary/20" : ""}
                                onClick={() => setSortMethod("price-desc")}
                              >
                                Price: High to Low
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={sortMethod === "name" ? "bg-primary/20" : ""}
                                onClick={() => setSortMethod("name")}
                              >
                                Name
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={sortMethod === "level" ? "bg-primary/20" : ""}
                                onClick={() => setSortMethod("level")}
                              >
                                Level Requirement
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={sortMethod === "rarity" ? "bg-primary/20" : ""}
                                onClick={() => setSortMethod("rarity")}
                              >
                                Rarity
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    
                      <Tabs defaultValue="all">
                        <TabsList className="mb-4 bg-dark-lighter">
                          <TabsTrigger value="all">All Items</TabsTrigger>
                          <TabsTrigger value="weapons">Weapons</TabsTrigger>
                          <TabsTrigger value="tools">Tools</TabsTrigger>
                          <TabsTrigger value="protection">Protection</TabsTrigger>
                          <TabsTrigger value="consumables">Consumables</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all">
                          {filteredStoreItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredStoreItems.map((item: any) => (
                                <StoreItem 
                                  key={item.id}
                                  item={item}
                                  onBuy={() => handleBuyItem(item.id)}
                                  isBuying={buyItemMutation.isPending}
                                  canAfford={(userProfile?.cash || 0) >= item.price}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                              No items found matching your search criteria
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="weapons">
                          {storeWeapons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {storeWeapons.map((item: any) => (
                                <StoreItem 
                                  key={item.id}
                                  item={item}
                                  onBuy={() => handleBuyItem(item.id)}
                                  isBuying={buyItemMutation.isPending}
                                  canAfford={(userProfile?.cash || 0) >= item.price}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                              No weapons available in the store
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="tools">
                          {storeTools.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {storeTools.map((item: any) => (
                                <StoreItem 
                                  key={item.id}
                                  item={item}
                                  onBuy={() => handleBuyItem(item.id)}
                                  isBuying={buyItemMutation.isPending}
                                  canAfford={(userProfile?.cash || 0) >= item.price}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                              No tools available in the store
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="protection">
                          {storeProtection.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {storeProtection.map((item: any) => (
                                <StoreItem 
                                  key={item.id}
                                  item={item}
                                  onBuy={() => handleBuyItem(item.id)}
                                  isBuying={buyItemMutation.isPending}
                                  canAfford={(userProfile?.cash || 0) >= item.price}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                              No protection gear available in the store
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="consumables">
                          {storeConsumables.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {storeConsumables.map((item: any) => (
                                <StoreItem 
                                  key={item.id}
                                  item={item}
                                  onBuy={() => handleBuyItem(item.id)}
                                  isBuying={buyItemMutation.isPending}
                                  canAfford={(userProfile?.cash || 0) >= item.price}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                              No consumables available in the store
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* SIDEBAR */}
        <div>
          <Card className="bg-dark-surface mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Equipped Items
              </CardTitle>
              <CardDescription>
                Items you currently have equipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : inventory?.filter((item: any) => item.equipped).length ? (
                <div className="space-y-4">
                  {inventory?.filter((item: any) => item.equipped).map((inventoryItem: any) => (
                    <div key={inventoryItem.id} className="flex items-start space-x-4 bg-dark-lighter p-3 rounded-lg">
                      {inventoryItem.item?.imageUrl && (
                        <div className="w-12 h-12 overflow-hidden rounded-md flex-shrink-0">
                          <img src={inventoryItem.item.imageUrl} alt={inventoryItem.item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{inventoryItem.item?.name}</h4>
                            <p className="text-xs text-gray-400">{inventoryItem.item?.type.charAt(0).toUpperCase() + inventoryItem.item?.type.slice(1)}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2"
                            onClick={() => handleToggleEquip(inventoryItem.id)}
                            disabled={equipItemMutation.isPending}
                          >
                            Unequip
                          </Button>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          {inventoryItem.item?.strengthBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Strength</span>
                              <span className="text-green-500">+{inventoryItem.item?.strengthBonus}</span>
                            </div>
                          )}
                          {inventoryItem.item?.stealthBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Stealth</span>
                              <span className="text-green-500">+{inventoryItem.item?.stealthBonus}</span>
                            </div>
                          )}
                          {inventoryItem.item?.charismaBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Charisma</span>
                              <span className="text-green-500">+{inventoryItem.item?.charismaBonus}</span>
                            </div>
                          )}
                          {inventoryItem.item?.intelligenceBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Intelligence</span>
                              <span className="text-green-500">+{inventoryItem.item?.intelligenceBonus}</span>
                            </div>
                          )}
                          {inventoryItem.item?.crimeSuccessBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Crime Success</span>
                              <span className="text-green-500">+{inventoryItem.item?.crimeSuccessBonus}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-lighter p-4 rounded-lg text-center text-gray-400">
                  You don't have any equipped items
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Item Bonus Stats
              </CardTitle>
              <CardDescription>
                Total bonuses from your equipped items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Sword className="h-4 w-4 mr-2" /> Strength
                    </span>
                    <Badge variant={totalBonuses.strength > 0 ? "default" : "outline"}>
                      {totalBonuses.strength > 0 ? `+${totalBonuses.strength}` : totalBonuses.strength}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Ban className="h-4 w-4 mr-2" /> Stealth
                    </span>
                    <Badge variant={totalBonuses.stealth > 0 ? "default" : "outline"}>
                      {totalBonuses.stealth > 0 ? `+${totalBonuses.stealth}` : totalBonuses.stealth}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-2" /> Charisma
                    </span>
                    <Badge variant={totalBonuses.charisma > 0 ? "default" : "outline"}>
                      {totalBonuses.charisma > 0 ? `+${totalBonuses.charisma}` : totalBonuses.charisma}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Brain className="h-4 w-4 mr-2" /> Intelligence
                    </span>
                    <Badge variant={totalBonuses.intelligence > 0 ? "default" : "outline"}>
                      {totalBonuses.intelligence > 0 ? `+${totalBonuses.intelligence}` : totalBonuses.intelligence}
                    </Badge>
                  </div>
                  
                  {totalBonuses.crimeSuccess > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Crosshair className="h-4 w-4 mr-2" /> Crime Success
                      </span>
                      <Badge variant="default">+{totalBonuses.crimeSuccess}%</Badge>
                    </div>
                  )}
                  
                  {totalBonuses.jailTimeReduction > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" /> Jail Time
                      </span>
                      <Badge variant="default">-{totalBonuses.jailTimeReduction}%</Badge>
                    </div>
                  )}
                  
                  {totalBonuses.escapeChance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Unlock className="h-4 w-4 mr-2" /> Escape Chance
                      </span>
                      <Badge variant="default">+{totalBonuses.escapeChance}%</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}