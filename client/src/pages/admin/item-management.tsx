import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package2, 
  Pencil, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Search, 
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PageHeader from "../../components/layout/page-header";

// Form validation schema
const itemFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  category: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  level: z.coerce.number().int().min(1, { message: "Level must be at least 1" }).optional(),
  rarity: z.string().optional(),
  strengthBonus: z.coerce.number().default(0),
  stealthBonus: z.coerce.number().default(0),
  charismaBonus: z.coerce.number().default(0),
  intelligenceBonus: z.coerce.number().default(0),
  crimeSuccessBonus: z.coerce.number().default(0),
  jailTimeReduction: z.coerce.number().default(0),
  escapeChanceBonus: z.coerce.number().default(0),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

// Item type definition
interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  category?: string;
  price: number;
  level?: number;
  rarity?: string;
  imageUrl?: string;
  strengthBonus: number;
  stealthBonus: number;
  charismaBonus: number;
  intelligenceBonus: number;
  crimeSuccessBonus: number;
  jailTimeReduction: number;
  escapeChanceBonus: number;
}

export default function ItemManagementPage() {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all-items");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Setup form
  const addItemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      category: "",
      price: 0,
      level: 1,
      rarity: "common",
      strengthBonus: 0,
      stealthBonus: 0,
      charismaBonus: 0,
      intelligenceBonus: 0,
      crimeSuccessBonus: 0,
      jailTimeReduction: 0,
      escapeChanceBonus: 0,
    },
  });

  const editItemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      category: "",
      price: 0,
      level: 1,
      rarity: "common",
      strengthBonus: 0,
      stealthBonus: 0,
      charismaBonus: 0,
      intelligenceBonus: 0,
      crimeSuccessBonus: 0,
      jailTimeReduction: 0,
      escapeChanceBonus: 0,
    },
  });

  // Query for fetching items
  const { data: items, isLoading: isItemsLoading } = useQuery({
    queryKey: ["/api/admin/items", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/admin/items?search=${encodeURIComponent(searchQuery)}` 
        : "/api/admin/items";
      const res = await apiRequest("GET", url);
      return await res.json();
    },
  });

  // Mutation for adding a new item
  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/items", data, {
        isFormData: true,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create item");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Item Created",
        description: `Successfully created item: ${data.name}`,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Item Created",
        message: `Item "${data.name}" has been added to the game`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setAddItemDialogOpen(false);
      addItemForm.reset();
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const res = await apiRequest("PUT", `/api/admin/items/${id}`, data, {
        isFormData: true,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update item");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Item Updated",
        description: `Successfully updated item: ${data.name}`,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Item Updated",
        message: `Item "${data.name}" has been updated`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setEditItemDialogOpen(false);
      editItemForm.reset();
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting an item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/items/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete item");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Item Deleted",
        description: `Successfully deleted item: ${data.item.name}`,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Item Deleted",
        message: `Item "${data.item.name}" has been removed from the game`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setDeleteItemDialogOpen(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for editing an item
  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    editItemForm.reset({
      name: item.name,
      description: item.description,
      type: item.type,
      category: item.category || "",
      price: item.price,
      level: item.level || 1,
      rarity: item.rarity || "common",
      strengthBonus: item.strengthBonus,
      stealthBonus: item.stealthBonus,
      charismaBonus: item.charismaBonus,
      intelligenceBonus: item.intelligenceBonus,
      crimeSuccessBonus: item.crimeSuccessBonus,
      jailTimeReduction: item.jailTimeReduction,
      escapeChanceBonus: item.escapeChanceBonus,
    });
    setPreviewImage(item.imageUrl || null);
    setEditItemDialogOpen(true);
  };

  // Handle image file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(formType === 'edit' && selectedItem ? selectedItem.imageUrl || null : null);
    }
  };

  // Form submission handlers
  const onAddSubmit = (data: ItemFormValues) => {
    const formData = new FormData();
    
    // Add all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add image if one is selected
    const imageInput = document.getElementById("add-item-image") as HTMLInputElement;
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }
    
    addItemMutation.mutate(formData);
  };

  const onEditSubmit = (data: ItemFormValues) => {
    if (!selectedItem) return;
    
    const formData = new FormData();
    
    // Add all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add image if one is selected
    const imageInput = document.getElementById("edit-item-image") as HTMLInputElement;
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }
    
    updateItemMutation.mutate({ id: selectedItem.id, data: formData });
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setDeleteItemDialogOpen(true);
  };

  // Filter items based on selected tab
  const filteredItems = items?.filter((item: Item) => {
    if (selectedTab === "all-items") return true;
    if (selectedTab === "weapons") return item.type === "weapon";
    if (selectedTab === "armor") return item.type === "armor";
    if (selectedTab === "accessories") return item.type === "accessory";
    if (selectedTab === "consumables") return item.type === "consumable";
    return true;
  });

  // Get rarity badge color
  const getRarityColor = (rarity: string | undefined) => {
    switch (rarity) {
      case "common": return "bg-slate-500";
      case "uncommon": return "bg-green-500";
      case "rare": return "bg-blue-500";
      case "epic": return "bg-purple-500";
      case "legendary": return "bg-amber-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Item Management"
        subtitle="Create, edit, and manage game items"
        icon={<Package2 className="h-6 w-6 text-muted-foreground" />}
      />

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-8">
        {/* Item Management Panel */}
        <div className="w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Game Items</CardTitle>
                <CardDescription>Manage all in-game items</CardDescription>
              </div>
              <Button onClick={() => setAddItemDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Tabs defaultValue="all-items" onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="all-items">All</TabsTrigger>
                  <TabsTrigger value="weapons">Weapons</TabsTrigger>
                  <TabsTrigger value="armor">Armor</TabsTrigger>
                  <TabsTrigger value="accessories">Accessories</TabsTrigger>
                  <TabsTrigger value="consumables">Consumables</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab}>
                  {isItemsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredItems?.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Rarity</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems?.map((item: Item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  {item.imageUrl ? (
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.name} 
                                      className="h-8 w-8 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                      <Package2 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span>{item.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>${item.price.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge className={`${getRarityColor(item.rarity)}`}>
                                  {item.rarity || "Common"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  {item.strengthBonus > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      STR +{item.strengthBonus}
                                    </Badge>
                                  )}
                                  {item.stealthBonus > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      STL +{item.stealthBonus}
                                    </Badge>
                                  )}
                                  {item.charismaBonus > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      CHR +{item.charismaBonus}
                                    </Badge>
                                  )}
                                  {item.intelligenceBonus > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      INT +{item.intelligenceBonus}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No items found. {searchQuery && "Try a different search query."}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Create a new item for the game. Fill in all the required fields.
            </DialogDescription>
          </DialogHeader>
          <Form {...addItemForm}>
            <form onSubmit={addItemForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={addItemForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addItemForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weapon">Weapon</SelectItem>
                            <SelectItem value="armor">Armor</SelectItem>
                            <SelectItem value="accessory">Accessory</SelectItem>
                            <SelectItem value="consumable">Consumable</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addItemForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Melee, Ranged, Head, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addItemForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Level</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addItemForm.control}
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rarity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rarity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="uncommon">Uncommon</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                            <SelectItem value="legendary">Legendary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label htmlFor="add-item-image">Item Image</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden">
                        {previewImage ? (
                          <img 
                            src={previewImage} 
                            alt="Item preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          id="add-item-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'add')}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended size: 128x128px. Max size: 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={addItemForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter item description" 
                            className="h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <h3 className="text-lg font-medium">Item Bonuses</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addItemForm.control}
                      name="strengthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="stealthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stealth Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="charismaBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charisma Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="intelligenceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intelligence Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="crimeSuccessBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crime Success Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="jailTimeReduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jail Time Reduction</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addItemForm.control}
                      name="escapeChanceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escape Chance Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddItemDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item details. Only changed fields will be updated.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <Form {...editItemForm}>
              <form onSubmit={editItemForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={editItemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editItemForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weapon">Weapon</SelectItem>
                              <SelectItem value="armor">Armor</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editItemForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Melee, Ranged, Head, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editItemForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Level</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editItemForm.control}
                      name="rarity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rarity</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rarity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="uncommon">Uncommon</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                              <SelectItem value="legendary">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label htmlFor="edit-item-image">Item Image</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden">
                          {previewImage ? (
                            <img 
                              src={previewImage} 
                              alt="Item preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            id="edit-item-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'edit')}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended size: 128x128px. Max size: 5MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={editItemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter item description" 
                              className="h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <h3 className="text-lg font-medium">Item Bonuses</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editItemForm.control}
                        name="strengthBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Strength Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="stealthBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stealth Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="charismaBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Charisma Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="intelligenceBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intelligence Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="crimeSuccessBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Crime Success Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="jailTimeReduction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jail Time Reduction</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editItemForm.control}
                        name="escapeChanceBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Escape Chance Bonus</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditItemDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateItemMutation.isPending}>
                    {updateItemMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Item
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                {selectedItem.imageUrl ? (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name} 
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <Package2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.type} • ${selectedItem.price}</p>
                </div>
              </div>
              
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting this item will remove it from the game and all player inventories. 
                  This action cannot be reversed.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && deleteItemMutation.mutate(selectedItem.id)}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}