import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2, Info, DollarSign, Shield, Sword, Sparkles } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Item schema for form validation
const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  level: z.coerce.number().int().min(1, "Level must be at least 1").optional(),
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
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Redirect if not an admin
  if (!authLoading && (!user || !user.isAdmin)) {
    setLocation("/");
    return null;
  }

  // Fetch all items
  const { data: items, isLoading, error } = useQuery({
    queryKey: ["/api/admin/items"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/items");
      return res.json();
    },
  });

  // Create a new item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/admin/items", data, {
        isFormData: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      // Reset form and image preview
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update an existing item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await apiRequest("PUT", `/api/admin/items/${id}`, data, {
        isFormData: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      // Reset selected item and image preview
      setSelectedItem(null);
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete an item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for creating a new item
  const addForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "weapon",
      category: "melee",
      price: 100,
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

  // Form for editing an existing item
  const editForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "weapon",
      category: "melee",
      price: 100,
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

  // Set up the edit form when an item is selected
  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    editForm.reset({
      name: item.name,
      description: item.description,
      type: item.type,
      category: item.category || undefined,
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
    setIsEditDialogOpen(true);
    // Reset the image preview when editing
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
  };

  // Handle image file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit handler for creating a new item
  const onAddSubmit = (data: ItemFormValues) => {
    const formData = new FormData();
    
    // Add all form fields to the formData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add the image file if one is selected
    if (imageFile) {
      formData.append("image", imageFile);
    }
    
    createItemMutation.mutate(formData);
  };

  // Submit handler for updating an existing item
  const onEditSubmit = (data: ItemFormValues) => {
    if (!selectedItem) return;
    
    const formData = new FormData();
    
    // Add all form fields to the formData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add the image file if one is selected
    if (imageFile) {
      formData.append("image", imageFile);
    }
    
    updateItemMutation.mutate({ id: selectedItem.id, data: formData });
  };

  // Handle deleting an item
  const handleDelete = (item: Item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  // Get the badge variant based on rarity
  const getRarityBadgeVariant = (rarity?: string) => {
    if (!rarity) return "outline";
    
    switch (rarity.toLowerCase()) {
      case "common":
        return "outline";
      case "uncommon":
        return "secondary";
      case "rare":
        return "default";
      case "epic":
        return "destructive";
      case "legendary":
        return "gold";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Item Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <p>Error loading items. Please try again.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Items Database</CardTitle>
            <CardDescription>
              Manage game items, their stats, and images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item: Item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imageUrl ? (
                          <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/items/default.png';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded">
                            <Sparkles className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline">{item.category}</Badge>
                        ) : (
                          <Badge variant="outline">{item.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-black/50">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {item.price.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.rarity && (
                          <Badge variant={getRarityBadgeVariant(item.rarity) as any} className="uppercase">
                            {item.rarity}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Info className="h-4 w-4" />
                              <span className="ml-2">View Stats</span>
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold">Item Stats</h4>
                              <Separator />
                              {item.strengthBonus !== 0 && (
                                <div className="flex justify-between">
                                  <span>Strength</span>
                                  <span className={item.strengthBonus > 0 ? "text-green-400" : "text-red-400"}>
                                    {item.strengthBonus > 0 ? "+" : ""}{item.strengthBonus}
                                  </span>
                                </div>
                              )}
                              {item.stealthBonus !== 0 && (
                                <div className="flex justify-between">
                                  <span>Stealth</span>
                                  <span className={item.stealthBonus > 0 ? "text-green-400" : "text-red-400"}>
                                    {item.stealthBonus > 0 ? "+" : ""}{item.stealthBonus}
                                  </span>
                                </div>
                              )}
                              {item.charismaBonus !== 0 && (
                                <div className="flex justify-between">
                                  <span>Charisma</span>
                                  <span className={item.charismaBonus > 0 ? "text-green-400" : "text-red-400"}>
                                    {item.charismaBonus > 0 ? "+" : ""}{item.charismaBonus}
                                  </span>
                                </div>
                              )}
                              {item.intelligenceBonus !== 0 && (
                                <div className="flex justify-between">
                                  <span>Intelligence</span>
                                  <span className={item.intelligenceBonus > 0 ? "text-green-400" : "text-red-400"}>
                                    {item.intelligenceBonus > 0 ? "+" : ""}{item.intelligenceBonus}
                                  </span>
                                </div>
                              )}
                              {item.crimeSuccessBonus > 0 && (
                                <div className="flex justify-between">
                                  <span>Crime Success</span>
                                  <span className="text-green-400">+{item.crimeSuccessBonus}%</span>
                                </div>
                              )}
                              {item.jailTimeReduction > 0 && (
                                <div className="flex justify-between">
                                  <span>Jail Time Reduction</span>
                                  <span className="text-green-400">-{item.jailTimeReduction}%</span>
                                </div>
                              )}
                              {item.escapeChanceBonus > 0 && (
                                <div className="flex justify-between">
                                  <span>Escape Chance</span>
                                  <span className="text-green-400">+{item.escapeChanceBonus}%</span>
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Create a new item for the game. Fill in all the required information.
            </DialogDescription>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="stats">Stats & Bonuses</TabsTrigger>
                  <TabsTrigger value="image">Image</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Brass Knuckles" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A simple but effective weapon for close combat..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
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
                              <SelectItem value="protection">Protection</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="melee">Melee</SelectItem>
                              <SelectItem value="ranged">Ranged</SelectItem>
                              <SelectItem value="armor">Armor</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Cost in game cash</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level Requirement</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Minimum player level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addForm.control}
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
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="strengthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="stealthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stealth Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="charismaBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charisma Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="intelligenceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intelligence Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={addForm.control}
                      name="crimeSuccessBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crime Success %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="jailTimeReduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jail Time Reduction %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="escapeChanceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escape Chance %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="border border-dashed border-gray-500 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="mx-auto w-40 h-40 bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Item preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-40 h-40 bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                          <Sparkles className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">No image selected</p>
                        </div>
                        <Label
                          htmlFor="add-image-upload"
                          className="inline-flex items-center justify-center h-9 px-4 py-2 border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          Select Image
                        </Label>
                        <Input
                          id="add-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'add')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-400">
                    <p>Image should be a PNG, JPG, GIF, or WebP file, max 5MB.</p>
                    <p>Optimal size is 512x512 pixels for best display quality.</p>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the selected item's information.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="stats">Stats & Bonuses</TabsTrigger>
                  <TabsTrigger value="image">Image</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weapon">Weapon</SelectItem>
                              <SelectItem value="protection">Protection</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="melee">Melee</SelectItem>
                              <SelectItem value="ranged">Ranged</SelectItem>
                              <SelectItem value="armor">Armor</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Cost in game cash</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level Requirement</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Minimum player level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rarity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
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
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="strengthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="stealthBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stealth Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="charismaBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charisma Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="intelligenceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intelligence Bonus</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="crimeSuccessBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crime Success %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="jailTimeReduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jail Time Reduction %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="escapeChanceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escape Chance %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="border border-dashed border-gray-500 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="mx-auto w-40 h-40 bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Item preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(selectedItem?.imageUrl || null);
                          }}
                        >
                          {imageFile ? "Cancel Changes" : "Remove Image"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-40 h-40 bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                          <Sparkles className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">No image selected</p>
                        </div>
                        <Label
                          htmlFor="edit-image-upload"
                          className="inline-flex items-center justify-center h-9 px-4 py-2 border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          Select Image
                        </Label>
                        <Input
                          id="edit-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'edit')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-400">
                    <p>Image should be a PNG, JPG, GIF, or WebP file, max 5MB.</p>
                    <p>Optimal size is 512x512 pixels for best display quality.</p>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}