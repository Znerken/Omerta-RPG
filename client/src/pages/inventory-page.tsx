import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/components/inventory/InventoryItem";
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
  Loader2
} from "lucide-react";

export default function InventoryPage() {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

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
      
      // Add to notification system
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
    onError: (error) => {
      const title = "Purchase Failed";
      const message = error.message || "Failed to purchase the item. Please try again.";
      
      // Add error notification
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
      
      // Add to notification system
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
    onError: (error) => {
      const title = "Failed to Equip Item";
      const message = error.message || "There was a problem equipping the item. Please try again.";
      
      // Add error notification
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

  // Group inventory by type
  const weapons = inventory?.filter((item: any) => item.item?.type === "weapon") || [];
  const tools = inventory?.filter((item: any) => item.item?.type === "tool") || [];
  const protection = inventory?.filter((item: any) => item.item?.type === "protection") || [];
  const consumables = inventory?.filter((item: any) => item.item?.type === "consumable") || [];

  // Group store items by type
  const storeWeapons = storeItems?.filter((item: any) => item.type === "weapon") || [];
  const storeTools = storeItems?.filter((item: any) => item.type === "tool") || [];
  const storeProtection = storeItems?.filter((item: any) => item.type === "protection") || [];
  const storeConsumables = storeItems?.filter((item: any) => item.type === "consumable") || [];

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

            <TabsContent value="inventory">
              <Card className="bg-dark-surface mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Your Items
                  </CardTitle>
                  <CardDescription>
                    Items you own that can be equipped or used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : inventory && inventory.length > 0 ? (
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
                          {inventory.map((inventoryItem: any) => (
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
                          {storeItems?.map((item: any) => (
                            <Card key={item.id} className="bg-dark-lighter border-gray-700 overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge variant="outline" className="mt-1">
                                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                    </Badge>
                                  </div>
                                  <Badge className="bg-secondary text-black font-mono">
                                    {formatCurrency(item.price)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                                
                                <div className="space-y-1 mb-3">
                                  {item.strengthBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Strength</span>
                                      <span className="text-green-500">+{item.strengthBonus}</span>
                                    </div>
                                  )}
                                  {item.stealthBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Stealth</span>
                                      <span className="text-green-500">+{item.stealthBonus}</span>
                                    </div>
                                  )}
                                  {item.charismaBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Charisma</span>
                                      <span className="text-green-500">+{item.charismaBonus}</span>
                                    </div>
                                  )}
                                  {item.intelligenceBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Intelligence</span>
                                      <span className="text-green-500">+{item.intelligenceBonus}</span>
                                    </div>
                                  )}
                                  {item.crimeSuccessBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Crime Success</span>
                                      <span className="text-green-500">+{item.crimeSuccessBonus}%</span>
                                    </div>
                                  )}
                                  {item.jailTimeReduction > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Jail Time</span>
                                      <span className="text-green-500">-{item.jailTimeReduction}%</span>
                                    </div>
                                  )}
                                  {item.escapeChanceBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Escape Chance</span>
                                      <span className="text-green-500">+{item.escapeChanceBonus}%</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button 
                                  className="w-full bg-primary hover:bg-primary/80" 
                                  onClick={() => handleBuyItem(item.id)}
                                  disabled={buyItemMutation.isPending || (userProfile?.cash || 0) < item.price}
                                >
                                  {buyItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      Buying...
                                    </>
                                  ) : (userProfile?.cash || 0) < item.price ? (
                                    "Not Enough Cash"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" /> 
                                      Buy Item
                                    </>
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="weapons">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {storeWeapons.length > 0 ? storeWeapons.map((item: any) => (
                            <Card key={item.id} className="bg-dark-lighter border-gray-700 overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge variant="outline" className="mt-1 bg-red-900 bg-opacity-20 text-red-400">
                                      Weapon
                                    </Badge>
                                  </div>
                                  <Badge className="bg-secondary text-black font-mono">
                                    {formatCurrency(item.price)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                                
                                <div className="space-y-1 mb-3">
                                  {item.strengthBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Strength</span>
                                      <span className="text-green-500">+{item.strengthBonus}</span>
                                    </div>
                                  )}
                                  {item.crimeSuccessBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Crime Success</span>
                                      <span className="text-green-500">+{item.crimeSuccessBonus}%</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button 
                                  className="w-full bg-primary hover:bg-primary/80" 
                                  onClick={() => handleBuyItem(item.id)}
                                  disabled={buyItemMutation.isPending || (userProfile?.cash || 0) < item.price}
                                >
                                  {buyItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      Buying...
                                    </>
                                  ) : (userProfile?.cash || 0) < item.price ? (
                                    "Not Enough Cash"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" /> 
                                      Buy Weapon
                                    </>
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          )) : (
                            <div className="col-span-2 bg-dark p-4 rounded-lg text-center text-gray-400">
                              No weapons available in the store
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="tools">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {storeTools.length > 0 ? storeTools.map((item: any) => (
                            <Card key={item.id} className="bg-dark-lighter border-gray-700 overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge variant="outline" className="mt-1 bg-green-900 bg-opacity-20 text-green-400">
                                      Drill
                                    </Badge>
                                  </div>
                                  <Badge className="bg-secondary text-black font-mono">
                                    {formatCurrency(item.price)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                                
                                <div className="space-y-1 mb-3">
                                  {item.stealthBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Stealth</span>
                                      <span className="text-green-500">+{item.stealthBonus}</span>
                                    </div>
                                  )}
                                  {item.intelligenceBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Intelligence</span>
                                      <span className="text-green-500">+{item.intelligenceBonus}</span>
                                    </div>
                                  )}
                                  {item.crimeSuccessBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Crime Success</span>
                                      <span className="text-green-500">+{item.crimeSuccessBonus}%</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button 
                                  className="w-full bg-primary hover:bg-primary/80" 
                                  onClick={() => handleBuyItem(item.id)}
                                  disabled={buyItemMutation.isPending || (userProfile?.cash || 0) < item.price}
                                >
                                  {buyItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      Buying...
                                    </>
                                  ) : (userProfile?.cash || 0) < item.price ? (
                                    "Not Enough Cash"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" /> 
                                      Buy Drill
                                    </>
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          )) : (
                            <div className="col-span-2 bg-dark p-4 rounded-lg text-center text-gray-400">
                              No tools available in the store
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="protection">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {storeProtection.length > 0 ? storeProtection.map((item: any) => (
                            <Card key={item.id} className="bg-dark-lighter border-gray-700 overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge variant="outline" className="mt-1 bg-blue-900 bg-opacity-20 text-blue-400">
                                      Protection
                                    </Badge>
                                  </div>
                                  <Badge className="bg-secondary text-black font-mono">
                                    {formatCurrency(item.price)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                                
                                <div className="space-y-1 mb-3">
                                  {item.stealthBonus !== 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Stealth</span>
                                      <span className={item.stealthBonus > 0 ? "text-green-500" : "text-red-500"}>
                                        {item.stealthBonus > 0 ? "+" : ""}{item.stealthBonus}
                                      </span>
                                    </div>
                                  )}
                                  {item.crimeSuccessBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Crime Success</span>
                                      <span className="text-green-500">+{item.crimeSuccessBonus}%</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button 
                                  className="w-full bg-primary hover:bg-primary/80" 
                                  onClick={() => handleBuyItem(item.id)}
                                  disabled={buyItemMutation.isPending || (userProfile?.cash || 0) < item.price}
                                >
                                  {buyItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      Buying...
                                    </>
                                  ) : (userProfile?.cash || 0) < item.price ? (
                                    "Not Enough Cash"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" /> 
                                      Buy Protection
                                    </>
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          )) : (
                            <div className="col-span-2 bg-dark p-4 rounded-lg text-center text-gray-400">
                              No protection gear available in the store
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="consumables">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {storeConsumables.length > 0 ? storeConsumables.map((item: any) => (
                            <Card key={item.id} className="bg-dark-lighter border-gray-700 overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <Badge variant="outline" className="mt-1 bg-purple-900 bg-opacity-20 text-purple-400">
                                      Consumable
                                    </Badge>
                                  </div>
                                  <Badge className="bg-secondary text-black font-mono">
                                    {formatCurrency(item.price)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                                
                                <div className="space-y-1 mb-3">
                                  {item.jailTimeReduction > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Jail Time</span>
                                      <span className="text-green-500">-{item.jailTimeReduction}%</span>
                                    </div>
                                  )}
                                  {item.escapeChanceBonus > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span>Escape Chance</span>
                                      <span className="text-green-500">+{item.escapeChanceBonus}%</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button 
                                  className="w-full bg-primary hover:bg-primary/80" 
                                  onClick={() => handleBuyItem(item.id)}
                                  disabled={buyItemMutation.isPending || (userProfile?.cash || 0) < item.price}
                                >
                                  {buyItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      Buying...
                                    </>
                                  ) : (userProfile?.cash || 0) < item.price ? (
                                    "Not Enough Cash"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" /> 
                                      Buy Consumable
                                    </>
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          )) : (
                            <div className="col-span-2 bg-dark p-4 rounded-lg text-center text-gray-400">
                              No consumables available in the store
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Item Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Sword className="h-5 w-5 mr-2 text-red-500" />
                  <h3 className="font-medium">Weapons</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Weapons increase your strength and improve your success rate in physical crimes. They can also be used in combat situations.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Drill className="h-5 w-5 mr-2 text-green-500" />
                  <h3 className="font-medium">Tools</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Tools help with stealth and intelligence-based crimes. They improve your success rate in thefts, break-ins, and hacking.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="font-medium">Protection</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Protection gear reduces your chance of getting caught or injured during crimes, but may reduce stealth.
                </p>
              </div>
              
              <div className="bg-dark-lighter p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Cherry className="h-5 w-5 mr-2 text-purple-500" />
                  <h3 className="font-medium">Consumables</h3>
                </div>
                <p className="text-sm text-gray-400">
                  One-time use items that provide temporary boosts, reduce jail time, or help with escape attempts.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Equipment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                You can only equip one item of each type at a time. Equipped items provide stat bonuses and abilities.
              </p>
              
              <div className="space-y-3">
                <div className="bg-dark-lighter p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Weapon</span>
                    <Badge variant="outline" className="bg-dark bg-opacity-40">
                      {weapons.some((item: any) => item.equipped) ? 
                        weapons.find((item: any) => item.equipped)?.name : 
                        "None equipped"}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-dark-lighter p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Drill</span>
                    <Badge variant="outline" className="bg-dark bg-opacity-40">
                      {tools.some((item: any) => item.equipped) ? 
                        tools.find((item: any) => item.equipped)?.name : 
                        "None equipped"}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-dark-lighter p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Protection</span>
                    <Badge variant="outline" className="bg-dark bg-opacity-40">
                      {protection.some((item: any) => item.equipped) ? 
                        protection.find((item: any) => item.equipped)?.name : 
                        "None equipped"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-dark-lighter rounded-lg">
                <h3 className="font-medium mb-2">Stat Bonuses</h3>
                <div className="space-y-1">
                  {/* Calculate total bonuses from equipped items */}
                  <div className="flex justify-between text-xs">
                    <span>Strength</span>
                    <span className="text-green-500">
                      +{inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.strengthBonus, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Stealth</span>
                    <span className={
                      (inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.stealthBonus, 0) || 0) >= 0 
                        ? "text-green-500" 
                        : "text-red-500"
                    }>
                      {(inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.stealthBonus, 0) || 0) > 0 ? "+" : ""}
                      {inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.stealthBonus, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Charisma</span>
                    <span className="text-green-500">
                      +{inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.charismaBonus, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Intelligence</span>
                    <span className="text-green-500">
                      +{inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.intelligenceBonus, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Crime Success</span>
                    <span className="text-green-500">
                      +{inventory?.filter((item: any) => item.equipped).reduce((total: number, item: any) => total + item.crimeSuccessBonus, 0) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
