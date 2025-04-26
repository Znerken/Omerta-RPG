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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck, Users, Database, Shield, Ban, DollarSign, TrendingUp, Trophy, AlertTriangle, Code, WrenchIcon, Building2, Unlock } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import { PageSection } from "../components/layout/page-section";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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

const jailUserSchema = z.object({
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

const grantAchievementSchema = z.object({
  achievementId: z.string().transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Please select an achievement",
    }),
});

type UserSearchValues = z.infer<typeof userSearchSchema>;
type GiveCashValues = z.infer<typeof giveCashSchema>;
type GiveXpValues = z.infer<typeof giveXpSchema>;
type BanUserValues = z.infer<typeof banUserSchema>;
type JailUserValues = z.infer<typeof jailUserSchema>;
type EditStatsValues = z.infer<typeof editStatsSchema>;
type GrantAchievementValues = z.infer<typeof grantAchievementSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [jailDialogOpen, setJailDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);
  const [clearLabProductionsDialogOpen, setClearLabProductionsDialogOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
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
  
  const jailForm = useForm<JailUserValues>({
    resolver: zodResolver(jailUserSchema),
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
  
  const achievementForm = useForm<GrantAchievementValues>({
    resolver: zodResolver(grantAchievementSchema),
    defaultValues: {
      achievementId: "",
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
  
  const { data: achievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/achievements");
      return await res.json();
    },
  });
  
  const { data: drugLabs, isLoading: isDrugLabsLoading } = useQuery({
    queryKey: ["/api/user/drug-labs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/drug-labs");
      return await res.json();
    },
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
  
  const jailUserMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: number; reason: string; duration: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/jail`, { reason, duration: duration * 60 * 60 * 1000 }); // Convert hours to ms
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Jailed",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: User Jailed",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setJailDialogOpen(false);
      jailForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Jail User",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to jail user: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });
  
  const releaseFromJailMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/release`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Released From Jail",
        description: data.message,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: User Released From Jail",
        message: data.message,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Release User From Jail",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to release user from jail: ${error.message}`,
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
  
  const grantAchievementMutation = useMutation({
    mutationFn: async ({ userId, achievementId }: { userId: number; achievementId: number }) => {
      const res = await apiRequest("POST", `/api/admin/achievements/${achievementId}/unlock`, { userId });
      return await res.json();
    },
    onSuccess: (data) => {
      const achievementName = data.achievement?.name || "Achievement";
      
      toast({
        title: "Achievement Granted",
        description: `Successfully granted "${achievementName}" to user.`,
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Achievement Granted",
        message: `Successfully granted "${achievementName}" to user.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setAchievementDialogOpen(false);
      achievementForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId] });
      // Also invalidate achievements for the user
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Grant Achievement",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to grant achievement: ${error.message}`,
        type: "error",
        read: false,
        timestamp: new Date()
      });
    },
  });
  
  const clearLabProductionsMutation = useMutation({
    mutationFn: async (labId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/drug-labs/${labId}/productions`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Productions Cleared",
        description: data.message || "All productions in the lab have been cleared successfully.",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action: Productions Cleared",
        message: data.message || "All productions in the lab have been cleared successfully.",
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
      setClearLabProductionsDialogOpen(false);
      setSelectedLabId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/drug-labs"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Clear Productions",
        description: error.message,
        variant: "destructive",
      });
      
      addNotification({
        id: Date.now().toString(),
        title: "Admin Action Failed",
        message: `Failed to clear productions: ${error.message}`,
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
  
  const onJailUserSubmit = (data: JailUserValues) => {
    if (selectedUserId) {
      jailUserMutation.mutate({
        userId: selectedUserId,
        reason: data.reason,
        duration: data.duration,
      });
    }
  };
  
  const onReleaseFromJail = () => {
    if (selectedUserId) {
      releaseFromJailMutation.mutate(selectedUserId);
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
  
  const onGrantAchievementSubmit = (data: GrantAchievementValues) => {
    if (selectedUserId) {
      grantAchievementMutation.mutate({
        userId: selectedUserId,
        achievementId: data.achievementId,
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
  
  const handleClearLabProductions = (labId: number) => {
    setSelectedLabId(labId);
    setClearLabProductionsDialogOpen(true);
  };
  
  const onClearLabProductions = () => {
    if (selectedLabId) {
      clearLabProductionsMutation.mutate(selectedLabId);
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
          <TabsTrigger value="drug-labs" className="data-[state=active]:bg-dark-surface">
            <Database className="h-4 w-4 mr-2" />
            Drug Labs
          </TabsTrigger>
          <TabsTrigger value="development" className="data-[state=active]:bg-dark-surface">
            <Code className="h-4 w-4 mr-2" />
            Development
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
                                  onReleaseFromJail();
                                }}
                                disabled={releaseFromJailMutation.isPending && selectedUserId === user.id}
                              >
                                {releaseFromJailMutation.isPending && selectedUserId === user.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Release
                                  </>
                                )}
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

        {/* Drug Labs Tab */}
        <TabsContent value="drug-labs" className="space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle>Drug Lab Management</CardTitle>
              <CardDescription>View and manage user drug labs and productions</CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="bg-dark-lighter overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-dark-lighter">
                      <TableRow>
                        <TableHead>Lab ID</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Productions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDrugLabsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        drugLabs?.map((lab: any) => (
                          <TableRow key={lab.id} className="hover:bg-dark-surface">
                            <TableCell className="font-mono">{lab.id}</TableCell>
                            <TableCell>{lab.user?.username || `User #${lab.userId}`}</TableCell>
                            <TableCell className="font-medium">{lab.name}</TableCell>
                            <TableCell>{lab.level}</TableCell>
                            <TableCell>{lab.activeProductionCount || 0} active</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleClearLabProductions(lab.id)}
                              >
                                Clear All Productions
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No drug labs found
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

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <Card className="bg-dark-surface">
            <CardHeader>
              <CardTitle>Development Tools</CardTitle>
              <CardDescription>Access testing and development features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-dark-lighter hover:bg-dark-surface transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 bg-primary/20 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Friend System</CardTitle>
                      <CardDescription>Test friend requests, social features and notifications</CardDescription>
                      <Link href="/friend-system-test">
                        <Button 
                          variant="default" 
                          className="mt-4 w-full"
                        >
                          Open Test Page
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                
                <Button
                  variant="outline"
                  className="bg-dark-lighter flex items-center"
                  onClick={() => setAchievementDialogOpen(true)}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Grant Achievement
                </Button>
                
                {selectedUser.isJailed ? (
                  <Button
                    variant="destructive"
                    className="flex items-center"
                    onClick={onReleaseFromJail}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Release from Jail
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      className="flex items-center"
                      onClick={() => setBanDialogOpen(true)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban User
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex items-center"
                      onClick={() => setJailDialogOpen(true)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Send to Jail
                    </Button>
                  </>
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
      
      {/* Jail User Dialog */}
      <Dialog open={jailDialogOpen} onOpenChange={setJailDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Send User to Jail</DialogTitle>
            <DialogDescription>
              Temporarily jail a user within the game
            </DialogDescription>
          </DialogHeader>
          
          <Form {...jailForm}>
            <form onSubmit={jailForm.handleSubmit(onJailUserSubmit)} className="space-y-4">
              <FormField
                control={jailForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reason for jail"
                        className="bg-dark-lighter border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={jailForm.control}
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
                  onClick={() => setJailDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={jailUserMutation.isPending}
                >
                  {jailUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Send to Jail"
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
      
      {/* Grant Achievement Dialog */}
      <Dialog open={achievementDialogOpen} onOpenChange={setAchievementDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Grant Achievement</DialogTitle>
            <DialogDescription>
              Award an achievement to the user
            </DialogDescription>
          </DialogHeader>
          
          <Form {...achievementForm}>
            <form onSubmit={achievementForm.handleSubmit(onGrantAchievementSubmit)} className="space-y-4">
              <FormField
                control={achievementForm.control}
                name="achievementId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achievement</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-dark-lighter border-gray-700">
                          <SelectValue placeholder="Select achievement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-surface border-gray-700 max-h-[300px]">
                        {isAchievementsLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : achievements && achievements.length > 0 ? (
                          achievements.map((achievement: any) => (
                            <SelectItem 
                              key={achievement.id} 
                              value={achievement.id.toString()}
                            >
                              {achievement.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-gray-400">No achievements available</div>
                        )}
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
                  onClick={() => setAchievementDialogOpen(false)}
                  className="bg-dark-lighter"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/80"
                  disabled={grantAchievementMutation.isPending}
                >
                  {grantAchievementMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Grant Achievement"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Clear Lab Productions Dialog */}
      <Dialog open={clearLabProductionsDialogOpen} onOpenChange={setClearLabProductionsDialogOpen}>
        <DialogContent className="bg-dark-surface border-gray-700">
          <DialogHeader>
            <DialogTitle>Clear All Productions</DialogTitle>
            <DialogDescription>
              This will permanently delete all active drug productions for this lab.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action cannot be undone. All progress on active productions will be lost.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setClearLabProductionsDialogOpen(false)}
              className="bg-dark-lighter"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onClearLabProductions}
              disabled={clearLabProductionsMutation.isPending}
            >
              {clearLabProductionsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Clear All Productions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}