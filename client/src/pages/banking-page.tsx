import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { BanknoteIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightLeftIcon, PlusIcon, SendIcon } from "lucide-react";

// Define schemas for the forms
const createAccountSchema = z.object({
  accountType: z.enum(["checking", "savings", "business", "offshore"]),
  balance: z.number().min(0),
  interestRate: z.number().min(0).max(0.1).optional(),
  minimumBalance: z.number().min(0).optional(),
});

const depositSchema = z.object({
  amount: z.number().positive(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
});

const transferSchema = z.object({
  fromAccountId: z.number().positive(),
  toAccountId: z.number().positive(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

const sendMoneySchema = z.object({
  accountId: z.number().positive(),
  recipientUsername: z.string().min(1, "Recipient username is required"),
  amount: z.number().positive("Amount must be a positive number"),
  description: z.string().optional(),
});

type BankAccount = {
  id: number;
  userId: number;
  accountType: string;
  balance: number;
  interestRate: number;
  minimumBalance: number;
  createdAt: string;
  lastInterestPaid: string;
};

type BankTransaction = {
  id: number;
  accountId: number;
  amount: number;
  balance: number;
  type: string;
  description: string | null;
  targetUserId: number | null;
  targetAccountId: number | null;
  timestamp: string;
};

type AccountWithTransactions = BankAccount & {
  transactions: BankTransaction[];
};

export default function BankingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);

  // Query for fetching bank accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/banking/accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/banking/accounts");
      return await res.json();
    },
  });

  // Query for fetching account details with transactions
  const { data: accountDetails, isLoading: detailsLoading } = useQuery<AccountWithTransactions>({
    queryKey: ["/api/banking/accounts", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      const res = await apiRequest("GET", `/api/banking/accounts/${selectedAccountId}`);
      return await res.json();
    },
    enabled: !!selectedAccountId,
  });

  // Form for creating a new account
  const createAccountForm = useForm<z.infer<typeof createAccountSchema>>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      accountType: "checking",
      balance: 0,
      interestRate: 0.01,
      minimumBalance: 0,
    },
  });

  // Mutation for creating account
  const createAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createAccountSchema>) => {
      const res = await apiRequest("POST", "/api/banking/accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      setIsCreateAccountOpen(false);
      createAccountForm.reset();
      toast({
        title: "Account Created",
        description: "Your new bank account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for depositing money
  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Mutation for depositing
  const depositMutation = useMutation({
    mutationFn: async (data: z.infer<typeof depositSchema>) => {
      const res = await apiRequest("POST", `/api/banking/accounts/${selectedAccountId}/deposit`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update user cash
      setIsDepositOpen(false);
      depositForm.reset();
      toast({
        title: "Deposit Successful",
        description: "Your money has been deposited successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deposit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for withdrawing money
  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Mutation for withdrawing
  const withdrawMutation = useMutation({
    mutationFn: async (data: z.infer<typeof withdrawSchema>) => {
      const res = await apiRequest("POST", `/api/banking/accounts/${selectedAccountId}/withdraw`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update user cash
      setIsWithdrawOpen(false);
      withdrawForm.reset();
      toast({
        title: "Withdrawal Successful",
        description: "Your money has been withdrawn successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to withdraw",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for transferring money
  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: 0,
      toAccountId: 0,
      amount: 0,
      description: "",
    },
  });

  // Mutation for transferring
  const transferMutation = useMutation({
    mutationFn: async (data: z.infer<typeof transferSchema>) => {
      const res = await apiRequest("POST", "/api/banking/transfer", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", transferForm.getValues().fromAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", transferForm.getValues().toAccountId] });
      setIsTransferOpen(false);
      transferForm.reset();
      toast({
        title: "Transfer Successful",
        description: "Money has been transferred successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to transfer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form for sending money to other users
  const sendMoneyForm = useForm<z.infer<typeof sendMoneySchema>>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      accountId: 0,
      recipientUsername: "",
      amount: 0,
      description: "",
    },
  });
  
  // Mutation for sending money to other users
  const sendMoneyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sendMoneySchema>) => {
      const res = await apiRequest("POST", "/api/banking/send-money", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", sendMoneyForm.getValues().accountId] });
      setIsSendMoneyOpen(false);
      sendMoneyForm.reset();
      toast({
        title: "Payment Successful",
        description: "Money has been sent successfully to the recipient.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send money",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle account selection
  const handleAccountSelect = (accountId: number) => {
    setSelectedAccountId(accountId);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Account type display names
  const accountTypeNames = {
    checking: "Checking Account",
    savings: "Savings Account",
    business: "Business Account",
    offshore: "Offshore Account"
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Banking</h1>
        <div className="flex items-center gap-2">
          <span className="text-xl">Cash: {user ? formatCurrency(user.cash) : "$0.00"}</span>
          <Button onClick={() => setIsCreateAccountOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>Select an account to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="py-4 text-center">Loading accounts...</div>
              ) : accounts && accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedAccountId === account.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-accent"
                      }`}
                      onClick={() => handleAccountSelect(account.id)}
                    >
                      <div className="font-medium">
                        {accountTypeNames[account.accountType as keyof typeof accountTypeNames]}
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(account.balance)}
                      </div>
                      <div className="text-sm opacity-80">
                        {account.accountType === "savings" && `Interest: ${(account.interestRate * 100).toFixed(2)}%`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  You don't have any bank accounts yet. Create one to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <div className="md:col-span-2">
          {selectedAccountId && accountDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {accountTypeNames[accountDetails.accountType as keyof typeof accountTypeNames]}
                </CardTitle>
                <CardDescription>
                  Account #{accountDetails.id} • Created on {formatDate(accountDetails.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="text-3xl font-bold">{formatCurrency(accountDetails.balance)}</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setIsDepositOpen(true)}>
                      <ArrowDownIcon className="mr-2 h-4 w-4" />
                      Deposit
                    </Button>
                    <Button variant="outline" onClick={() => setIsWithdrawOpen(true)}>
                      <ArrowUpIcon className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                    <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
                      <ArrowRightLeftIcon className="mr-2 h-4 w-4" />
                      Transfer
                    </Button>
                    <Button variant="outline" onClick={() => {
                      sendMoneyForm.setValue("accountId", selectedAccountId!);
                      setIsSendMoneyOpen(true);
                    }}>
                      <SendIcon className="mr-2 h-4 w-4" />
                      Send Money
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Account Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Account Type</div>
                      <div>{accountTypeNames[accountDetails.accountType as keyof typeof accountTypeNames]}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Minimum Balance</div>
                      <div>{formatCurrency(accountDetails.minimumBalance)}</div>
                    </div>
                    {accountDetails.accountType === "savings" && (
                      <div>
                        <div className="text-sm text-muted-foreground">Interest Rate</div>
                        <div>{(accountDetails.interestRate * 100).toFixed(2)}%</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-muted-foreground">Last Interest Paid</div>
                      <div>{formatDate(accountDetails.lastInterestPaid)}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
                  {accountDetails.transactions && accountDetails.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {accountDetails.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center p-3 bg-card rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {transaction.description || transaction.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transaction.timestamp)}
                            </div>
                          </div>
                          <div
                            className={`font-bold ${
                              transaction.amount > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No transactions yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                <BanknoteIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Select an Account</h3>
                <p className="text-muted-foreground text-center">
                  Select an account from the list to view its details and transactions.
                </p>
                {!accounts || accounts.length === 0 ? (
                  <Button className="mt-6" onClick={() => setIsCreateAccountOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Your First Account
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bank Account</DialogTitle>
            <DialogDescription>
              Create a new bank account to manage your finances.
            </DialogDescription>
          </DialogHeader>

          <Form {...createAccountForm}>
            <form onSubmit={createAccountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createAccountForm.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="business">Business Account</SelectItem>
                        <SelectItem value="offshore">Offshore Account</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "savings" && "Savings accounts earn daily interest."}
                      {field.value === "checking" && "Standard account for everyday transactions."}
                      {field.value === "business" && "For business-related transactions."}
                      {field.value === "offshore" && "Offshore accounts have special privacy features."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createAccountForm.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Initial deposit from your cash balance.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createAccountForm.watch("accountType") === "savings" && (
                <FormField
                  control={createAccountForm.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={0.1}
                          step={0.001}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Daily interest rate (0-10%).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={createAccountForm.control}
                name="minimumBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum balance that must be maintained.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Money</DialogTitle>
            <DialogDescription>
              Deposit money from your cash into your bank account.
            </DialogDescription>
          </DialogHeader>

          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit((data) => depositMutation.mutate(data))} className="space-y-4">
              <FormField
                control={depositForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Available cash: {user ? formatCurrency(user.cash) : "$0.00"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={depositMutation.isPending}>
                  {depositMutation.isPending ? "Processing..." : "Deposit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Money</DialogTitle>
            <DialogDescription>
              Withdraw money from your bank account to your cash.
            </DialogDescription>
          </DialogHeader>

          <Form {...withdrawForm}>
            <form onSubmit={withdrawForm.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
              <FormField
                control={withdrawForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      {accountDetails && (
                        <>Available balance: {formatCurrency(accountDetails.balance)}</>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={withdrawMutation.isPending}>
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
            <DialogDescription>
              Transfer money between your accounts.
            </DialogDescription>
          </DialogHeader>

          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))} className="space-y-4">
              <FormField
                control={transferForm.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select
                      onValueChange={(value: string) => field.onChange(parseInt(value))}
                      defaultValue={selectedAccountId?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {accountTypeNames[account.accountType as keyof typeof accountTypeNames]} - {formatCurrency(account.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select
                      onValueChange={(value: string) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {accountTypeNames[account.accountType as keyof typeof accountTypeNames]} - {formatCurrency(account.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={transferMutation.isPending}>
                  {transferMutation.isPending ? "Processing..." : "Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}