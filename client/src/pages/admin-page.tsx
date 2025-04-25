import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck, Users, Database, Shield, Ban, DollarSign, TrendingUp } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import { PageSection } from "../components/layout/page-section";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNotification } from "@/hooks/use-notification";

// Form validation schemas
const userSearchSchema = z.object({
  search: z.string().optional(),
});

const giveCashSchema = z.object({
  amount: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a positive number",
    }),
});

const giveXpSchema = z.object({
  amount: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a positive number",
    }),
});

const banUserSchema = z.object({
  reason: z.string().min(3, { message: "Reason must be at least 3 characters" }),
  duration: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Duration must be a positive number",
    }),
});

const editStatsSchema = z.object({
  strength: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Value must be between 1 and 100",
    }),
  stealth: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Value must be between 1 and 100",
    }),
  charisma: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Value must be between 1 and 100",
    }),
  intelligence: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Value must be between 1 and 100",
    }),
});

type UserSearchValues = z.infer<typeof userSearchSchema>;
type GiveCashValues = z.infer<typeof giveCashSchema>;
type GiveXpValues = z.infer<typeof giveXpSchema>;
type BanUserValues = z.infer<typeof banUserSchema>;
type EditStatsValues = z.infer<typeof editStatsSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");

  // Forms
  const searchForm = useForm<UserSearchValues>({
    resolver: zodResolver(userSearchSchema),
    defaultValues: {
      search: "",
    },
  });

  const cashForm = useForm<GiveCashValues>({
    resolver: zodResolver(giveCashSchema),
    defaultValues: {
      amount: "",
    },
  });

  const xpForm = useForm<GiveXpValues>({
    resolver: zodResolver(giveXpSchema),
    defaultValues: {
      amount: "",
    },
  });

  const banForm = useForm<BanUserValues>({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      reason: "",
      duration: "24", // Default 24 hours
    },
  });

  const statsForm = useForm<EditStatsValues>({
    resolver: zodResolver(editStatsSchema),
    defaultValues: {
      strength: "",
      stealth: "",
      charisma: "",
      intelligence: "",
    },
  });

  // Queries
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/dashboard");
      return await res.json();
    },
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users", currentPage, searchValue],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (searchValue) params.append("search", searchValue);
      
      const res = await apiRequest("GET", `/api/admin/users?${params.toString()}`);
      return await res.json();
    },
  });

  const { data: selectedUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/admin/users", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await apiRequest("GET", `/api/admin/users/${selectedUserId}`);
      return await res.json();
    },
    enabled: !!selectedUserId,
  });

  // Mutations
  const giveCashMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/give-cash`, { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cash Added",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Cash Added",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setCashDialogOpen(false);
      cashForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Cash",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to add cash: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });

  const giveXpMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/give-xp`, { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "XP Added",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: XP Added",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setXpDialogOpen(false);
      xpForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add XP",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to add XP: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: number; reason: string; duration: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason, duration: duration * 60 * 60 * 1000 }); // Convert hours to ms
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Banned",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: User Banned",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setBanDialogOpen(false);
      banForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Ban User",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to ban user: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Unbanned",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: User Unbanned",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Unban User",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to unban user: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });

  const editStatsMutation = useMutation({
    mutationFn: async ({ userId, stats }: { userId: number; stats: EditStatsValues }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/stats`, stats);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Stats Updated",
        description: "User stats have been updated successfully.",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Stats Updated",
        message: "User stats have been updated successfully.",
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setStatsDialogOpen(false);
      statsForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Stats",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to update stats: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });

  // Form handlers
  const onSearchSubmit = (data: UserSearchValues) => {
    setSearchValue(data.search || "");
    setCurrentPage(1);
  };

  const onGiveCashSubmit = (data: GiveCashValues) => {
    if (selectedUserId) {
      giveCashMutation.mutate({
        userId: selectedUserId,
        amount: data.amount,
      });
    }
  };

  const onGiveXpSubmit = (data: GiveXpValues) => {
    if (selectedUserId) {
      giveXpMutation.mutate({
        userId: selectedUserId,
        amount: data.amount,
      });
    }
  };

  const onBanUserSubmit = (data: BanUserValues) => {
    if (selectedUserId) {
      banUserMutation.mutate({
        userId: selectedUserId,
        reason: data.reason,
        duration: data.duration,
      });
    }
  };

  const onUnbanUser = () => {
    if (selectedUserId) {
      unbanUserMutation.mutate(selectedUserId);
    }
  };

  const onEditStatsSubmit = (data: EditStatsValues) => {
    if (selectedUserId) {
      editStatsMutation.mutate({
        userId: selectedUserId,
        stats: data,
      });
    }
  };

  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setUserDetailsOpen(true);
    
    // If we have the user's stats, pre-fill the stats form
    if (selectedUser?.stats) {
      statsForm.setValue("strength", selectedUser.stats.strength.toString());
      statsForm.setValue("stealth", selectedUser.stats.stealth.toString());
      statsForm.setValue("charisma", selectedUser.stats.charisma.toString());
      statsForm.setValue("intelligence", selectedUser.stats.intelligence.toString());
    }
  };

  return (
    <>
      <PageHeader
        title="Admin Control Panel"
        icon={<Shield className="h-5 w-5" />}
        description="Manage users, monitor game activity, and moderate the platform"
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-dark-lighter">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-dark-surface">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-dark-surface">
            Users
          </TabsTrigger>
          <TabsTrigger value="jail" className="data-[state=active]:bg-dark-surface">
            Jail
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-dark-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDashboardLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    dashboardData?.totalUsers || 0
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Active Users (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDashboardLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    dashboardData?.activeUsers || 0
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Ban className="h-4 w-4 mr-2" />
                  Jailed Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDashboardLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    dashboardData?.jailedUsers || 0
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-md font-bold text-green-500">Operational</div>
              </CardContent>
            </Card>
          </div>

          <PageSection
            title="Top Players"
            description="Users with the most wealth in the game"
          >
            <Card className="bg-dark-surface overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-dark-lighter">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Cash</TableHead>
                      <TableHead>Respect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isDashboardLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardData?.topUsers?.map((user: any) => (
                        <TableRow key={user.id} className="hover:bg-dark-lighter">
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.level}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(user.cash)}</TableCell>
                          <TableCell>{user.respect}</TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No data available
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </PageSection>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search for users, view details, and manage accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...searchForm}>
                <form
                  onSubmit={searchForm.handleSubmit(onSearchSubmit)}
                  className="flex items-center space-x-2"
                >
                  <FormField
                    control={searchForm.control}
                    name="search"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Search by username or email"
                            {...field}
                            className="bg-dark-lighter border-gray-700"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/80">
                    Search
                  </Button>
                </form>
              </Form>

              <Card className="bg-dark-lighter overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-dark-lighter">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        usersData?.users?.map((user: any) => (
                          <TableRow key={user.id} className="hover:bg-dark-surface">
                            <TableCell className="font-mono">{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.level}</TableCell>
                            <TableCell>
                              {user.isJailed ? (
                                <Badge variant="destructive">Jailed</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-dark-lighter">
                                  Active
                                </Badge>
                              )}
                              {user.isAdmin && (
                                <Badge variant="secondary" className="ml-2">
                                  Admin
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewUser(user.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No users found
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              {usersData?.pagination && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {usersData.pagination.page} of {usersData.pagination.totalPages}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage <= 1}
                      className="bg-dark-lighter"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={
                        currentPage >= (usersData.pagination.totalPages || 1)
                      }
                      className="bg-dark-lighter"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jail Tab */}
        <TabsContent value="jail" className="space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle>Jail Management</CardTitle>
              <CardDescription>View and manage jailed users</CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="bg-dark-lighter overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-dark-lighter">
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Jailed Until</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDashboardLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        dashboardData?.jailedUsers?.map((user: any) => (
                          <TableRow key={user.id} className="hover:bg-dark-surface">
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>
                              {user.jailTimeEnd ? new Date(user.jailTimeEnd).toLocaleString() : 'Unknown'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUser(user.id)}
                                className="mr-2 bg-dark-surface"
                              >
                                View
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  onUnbanUser();
                                }}
                              >
                                Release
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No jailed users
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="bg-dark-surface border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {isUserLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-dark-lighter">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Username:</span>
                      <span className="font-medium">{selectedUser.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level:</span>
                      <span className="font-medium">{selectedUser.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">XP:</span>
                      <span className="font-medium">{selectedUser.xp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cash:</span>
                      <span className="font-medium font-mono">{formatCurrency(selectedUser.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Respect:</span>
                      <span className="font-medium">{selectedUser.respect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="font-medium">
                        {selectedUser.isJailed ? (
                          <Badge variant="destructive">Jailed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-dark-lighter">
                            Active
                          </Badge>
                        )}
                      </span>
                    </div>
                    {selectedUser.isJailed && selectedUser.jailTimeEnd && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jail Until:</span>
                        <span className="font-medium">
                          {new Date(selectedUser.jailTimeEnd).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Admin:</span>
                      <span className="font-medium">
                        {selectedUser.isAdmin ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-dark-lighter">
                            No
                          </Badge>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-lighter">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedUser.stats ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Strength:</span>
                          <span className="font-medium">{selectedUser.stats.strength}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Stealth:</span>
                          <span className="font-medium">{selectedUser.stats.stealth}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Charisma:</span>
                          <span className="font-medium">{selectedUser.stats.charisma}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Intelligence:</span>
                          <span className="font-medium">{selectedUser.stats.intelligence}/100</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-400">No stats available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="bg-dark-lighter flex items-center"
                  onClick={() => setCashDialogOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Give Cash
                </Button>
                
                <Button
                  variant="outline"
                  className="bg-dark-lighter flex items-center"
                  onClick={() => setXpDialogOpen(true)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Give XP
                </Button>
                
                <Button
                  variant="outline"
                  className="bg-dark-lighter flex items-center"
                  onClick={() => setStatsDialogOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Edit Stats
                </Button>
                
                {selectedUser.isJailed ? (
                  <Button
                    variant="destructive"
                    className="flex items-center"
                    onClick={onUnbanUser}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Release from Jail
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="flex items-center"
                    onClick={() => setBanDialogOpen(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No user data available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Give Cash Dialog */}
      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Give Cash</DialogTitle>
            <DialogDescription>
              Add cash to the user's account
            </DialogDescription>
          </DialogHeader>
          
          <Form {...cashForm}>
            <form onSubmit={cashForm.handleSubmit(onGiveCashSubmit)} className="space-y-4">
              <FormField
                control={cashForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1000"
                        type="number"
                        min="1"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCashDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/80"
                  disabled={giveCashMutation.isPending}
                >
                  {giveCashMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Add Cash"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Give XP Dialog */}
      <Dialog open={xpDialogOpen} onOpenChange={setXpDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Give XP</DialogTitle>
            <DialogDescription>
              Add experience points to the user
            </DialogDescription>
          </DialogHeader>
          
          <Form {...xpForm}>
            <form onSubmit={xpForm.handleSubmit(onGiveXpSubmit)} className="space-y-4">
              <FormField
                control={xpForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="100"
                        type="number"
                        min="1"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setXpDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/80"
                  disabled={giveXpMutation.isPending}
                >
                  {giveXpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Add XP"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Temporarily ban a user from the platform
            </DialogDescription>
          </DialogHeader>
          
          <Form {...banForm}>
            <form onSubmit={banForm.handleSubmit(onBanUserSubmit)} className="space-y-4">
              <FormField
                control={banForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reason for ban"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={banForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-dark-lighter border-gray-700">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-surface border-gray-700">
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">2 days</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setBanDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={banUserMutation.isPending}
                >
                  {banUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Ban User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Stats</DialogTitle>
            <DialogDescription>
              Modify user statistics
            </DialogDescription>
          </DialogHeader>
          
          <Form {...statsForm}>
            <form onSubmit={statsForm.handleSubmit(onEditStatsSubmit)} className="space-y-4">
              <FormField
                control={statsForm.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strength (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={statsForm.control}
                name="stealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stealth (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={statsForm.control}
                name="charisma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charisma (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={statsForm.control}
                name="intelligence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intelligence (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStatsDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/80"
                  disabled={editStatsMutation.isPending}
                >
                  {editStatsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}