import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNotification } from "@/hooks/use-notification";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { 
  BanknoteIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowRightLeftIcon, 
  PlusIcon, 
  SendIcon,
  CreditCardIcon, 
  DollarSignIcon,
  HistoryIcon,
  HomeIcon,
  ChevronLeftIcon,
  Users2Icon,
  ShieldIcon,
  Key,
  BanIcon,
  XIcon,
  CheckIcon,
  PrinterIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ATMBankingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // ATM UI States
  enum ATMScreen {
    WELCOME = "welcome",
    INSERT_CARD = "insert_card",
    ENTER_PIN = "enter_pin",
    MAIN_MENU = "main_menu",
    ACCOUNT_SELECT = "account_select",
    BALANCE = "balance",
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    TRANSFER = "transfer",
    TRANSFER_DESTINATION = "transfer_destination",
    SEND_MONEY = "send_money",
    CREATE_ACCOUNT = "create_account",
    TRANSACTION_HISTORY = "transaction_history",
    PROCESSING = "processing",
    RECEIPT = "receipt",
    ERROR = "error"
  }

  const [atmScreen, setAtmScreen] = useState<ATMScreen>(ATMScreen.WELCOME);
  const [pinInput, setPinInput] = useState<string>("");
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [receiptData, setReceiptData] = useState<any>(null);
  const [transferDestinationAccountId, setTransferDestinationAccountId] = useState<number | null>(null);
  const [recipientUsername, setRecipientUsername] = useState<string>("");
  const [receiptMessage, setReceiptMessage] = useState<string>("");
  const [newAccountType, setNewAccountType] = useState<string>("checking");

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
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: "Account Created",
        message: `Your new ${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account has been created successfully.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update user cash
      depositForm.reset();
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: "Deposit Successful",
        message: `You deposited ${formatCurrency(parseFloat(transactionAmount))} to your account.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update user cash
      withdrawForm.reset();
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: "Withdrawal Successful",
        message: `You withdrew ${formatCurrency(parseFloat(transactionAmount))} from your account.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", transferForm.getValues().fromAccountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", transferForm.getValues().toAccountId] });
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: "Transfer Successful",
        message: `You transferred ${formatCurrency(parseFloat(transactionAmount))} between accounts.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banking/accounts", sendMoneyForm.getValues().accountId] });
      
      // Add notification
      addNotification({
        id: Date.now().toString(),
        title: "Payment Sent",
        message: `You sent ${formatCurrency(parseFloat(transactionAmount))} to ${recipientUsername}.`,
        type: "success",
        read: false,
        timestamp: new Date()
      });
      
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
    setAtmScreen(ATMScreen.MAIN_MENU);
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

  // Handle keypad input
  const handleKeypadInput = (value: string) => {
    if (atmScreen === ATMScreen.ENTER_PIN) {
      if (pinInput.length < 4) {
        setPinInput(prev => prev + value);
      }
      
      // Auto-proceed when PIN is complete
      if (pinInput.length === 3) {
        setTimeout(() => {
          setAtmScreen(ATMScreen.ACCOUNT_SELECT);
          setPinInput("");
        }, 500);
      }
    } else if (atmScreen === ATMScreen.DEPOSIT || 
              atmScreen === ATMScreen.WITHDRAW || 
              atmScreen === ATMScreen.TRANSFER) {
      setTransactionAmount(prev => {
        if (value === "." && prev.includes(".")) return prev;
        if (value === "." && prev === "") return "0.";
        
        const newValue = prev + value;
        if (newValue === "0" && value === "0" && prev === "0") return "0";
        if (prev === "0" && value !== ".") return value;
        return newValue;
      });
    }
  };

  // Handle delete button
  const handleDelete = () => {
    if (atmScreen === ATMScreen.ENTER_PIN) {
      setPinInput(prev => prev.slice(0, -1));
    } else if (atmScreen === ATMScreen.DEPOSIT || 
              atmScreen === ATMScreen.WITHDRAW || 
              atmScreen === ATMScreen.TRANSFER) {
      setTransactionAmount(prev => prev.slice(0, -1));
    }
  };

  // Handle clear button
  const handleClear = () => {
    if (atmScreen === ATMScreen.ENTER_PIN) {
      setPinInput("");
    } else if (atmScreen === ATMScreen.DEPOSIT || 
              atmScreen === ATMScreen.WITHDRAW || 
              atmScreen === ATMScreen.TRANSFER) {
      setTransactionAmount("");
    }
  };

  // Handle Enter/Confirm button
  const handleEnter = () => {
    if (atmScreen === ATMScreen.DEPOSIT) {
      handleDeposit();
    } else if (atmScreen === ATMScreen.WITHDRAW) {
      handleWithdraw();
    } else if (atmScreen === ATMScreen.TRANSFER) {
      setAtmScreen(ATMScreen.TRANSFER_DESTINATION);
    } else if (atmScreen === ATMScreen.SEND_MONEY) {
      handleSendMoney();
    }
  };

  // Handle deposit
  const handleDeposit = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      setAtmScreen(ATMScreen.ERROR);
      return;
    }
    
    setProcessingMessage("Processing deposit...");
    setAtmScreen(ATMScreen.PROCESSING);
    
    depositMutation.mutate({ 
      amount: parseFloat(transactionAmount) 
    }, {
      onSuccess: (data) => {
        setReceiptData({
          type: "Deposit",
          amount: parseFloat(transactionAmount),
          accountId: selectedAccountId,
          balance: data.account.balance,
          timestamp: new Date().toISOString()
        });
        setReceiptMessage("Deposit successful!");
        setAtmScreen(ATMScreen.RECEIPT);
        setTransactionAmount("");
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || "Failed to make deposit");
        setAtmScreen(ATMScreen.ERROR);
      }
    });
  };

  // Handle withdraw
  const handleWithdraw = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      setAtmScreen(ATMScreen.ERROR);
      return;
    }
    
    setProcessingMessage("Processing withdrawal...");
    setAtmScreen(ATMScreen.PROCESSING);
    
    withdrawMutation.mutate({ 
      amount: parseFloat(transactionAmount) 
    }, {
      onSuccess: (data) => {
        setReceiptData({
          type: "Withdrawal",
          amount: parseFloat(transactionAmount),
          accountId: selectedAccountId,
          balance: data.account.balance,
          timestamp: new Date().toISOString()
        });
        setReceiptMessage("Withdrawal successful!");
        setAtmScreen(ATMScreen.RECEIPT);
        setTransactionAmount("");
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || "Failed to make withdrawal");
        setAtmScreen(ATMScreen.ERROR);
      }
    });
  };

  // Handle transfer
  const handleTransfer = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0 || !transferDestinationAccountId) {
      setErrorMessage("Please enter a valid amount and destination account");
      setAtmScreen(ATMScreen.ERROR);
      return;
    }
    
    setProcessingMessage("Processing transfer...");
    setAtmScreen(ATMScreen.PROCESSING);
    
    transferMutation.mutate({ 
      fromAccountId: selectedAccountId!,
      toAccountId: transferDestinationAccountId,
      amount: parseFloat(transactionAmount),
      description: "ATM Transfer"
    }, {
      onSuccess: (data) => {
        setReceiptData({
          type: "Transfer",
          amount: parseFloat(transactionAmount),
          fromAccountId: selectedAccountId,
          toAccountId: transferDestinationAccountId,
          balance: data.fromAccount.balance,
          timestamp: new Date().toISOString()
        });
        setReceiptMessage("Transfer successful!");
        setAtmScreen(ATMScreen.RECEIPT);
        setTransactionAmount("");
        setTransferDestinationAccountId(null);
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || "Failed to make transfer");
        setAtmScreen(ATMScreen.ERROR);
      }
    });
  };

  // Handle send money
  const handleSendMoney = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0 || !recipientUsername) {
      setErrorMessage("Please enter a valid amount and recipient");
      setAtmScreen(ATMScreen.ERROR);
      return;
    }
    
    setProcessingMessage("Processing payment...");
    setAtmScreen(ATMScreen.PROCESSING);
    
    sendMoneyMutation.mutate({ 
      accountId: selectedAccountId!,
      recipientUsername: recipientUsername,
      amount: parseFloat(transactionAmount),
      description: "ATM Payment"
    }, {
      onSuccess: (data) => {
        setReceiptData({
          type: "Payment",
          amount: parseFloat(transactionAmount),
          accountId: selectedAccountId,
          recipient: recipientUsername,
          timestamp: new Date().toISOString()
        });
        setReceiptMessage("Payment successful!");
        setAtmScreen(ATMScreen.RECEIPT);
        setTransactionAmount("");
        setRecipientUsername("");
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || "Failed to send money");
        setAtmScreen(ATMScreen.ERROR);
      }
    });
  };

  // Handle create account
  const handleCreateAccount = () => {
    setProcessingMessage("Creating account...");
    setAtmScreen(ATMScreen.PROCESSING);
    
    createAccountMutation.mutate({
      accountType: newAccountType as any,
      balance: 0,
      interestRate: newAccountType === "savings" ? 0.01 : 0,
      minimumBalance: 0
    }, {
      onSuccess: (account) => {
        setReceiptData({
          type: "New Account",
          accountType: account.accountType,
          accountId: account.id,
          timestamp: new Date().toISOString()
        });
        setReceiptMessage("Account created successfully!");
        setAtmScreen(ATMScreen.RECEIPT);
        setSelectedAccountId(account.id);
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || "Failed to create account");
        setAtmScreen(ATMScreen.ERROR);
      }
    });
  };

  return (
    <div className="container mx-auto py-6">
      {/* Link to Classic Banking */}
      <div className="flex justify-end mb-4">
        <a href="/banking-classic" className="text-blue-500 hover:text-blue-700 underline">
          Switch to Classic Banking Interface
        </a>
      </div>
      
      {/* ATM Machine */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-8 border-slate-700 bg-slate-800 p-0 overflow-hidden">
          {/* ATM Header */}
          <div className="bg-slate-900 p-4 text-center border-b-4 border-slate-700">
            <h1 className="text-3xl font-bold text-white tracking-wide">OMERTÀ BANKING TERMINAL</h1>
            <p className="text-slate-400 mt-1">Secure Financial Services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Left Panel - Card Reader & Info */}
            <div className="p-4 bg-slate-900 border-r-4 border-slate-700">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">Card Reader</h3>
                <div 
                  className="bg-black h-24 w-full rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-950 transition-colors border-2 border-slate-600"
                  onClick={() => {
                    if (atmScreen === ATMScreen.WELCOME || atmScreen === ATMScreen.INSERT_CARD) {
                      setAtmScreen(ATMScreen.ENTER_PIN);
                    }
                  }}
                >
                  <div className="h-2 w-3/4 bg-slate-700 rounded-sm"></div>
                </div>
                <p className="text-slate-400 text-xs mt-2 text-center">
                  {atmScreen === ATMScreen.INSERT_CARD ? 
                    "INSERT CARD TO BEGIN" : 
                    "CARD READER"}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">User Info</h3>
                <div className="bg-slate-950 rounded-md p-3 border-2 border-slate-600">
                  <div className="mb-1">
                    <span className="text-slate-400 text-xs">Name:</span>
                    <p className="text-white">{user?.username || "Guest"}</p>
                  </div>
                  <div className="mb-1">
                    <span className="text-slate-400 text-xs">Cash:</span>
                    <p className="text-white">{user ? formatCurrency(user.cash) : "$0.00"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Status:</span>
                    <p className="text-green-400">Online</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">Security Status</h3>
                <div className="bg-slate-950 rounded-md p-3 border-2 border-slate-600">
                  <div className="flex items-center">
                    <ShieldIcon className="text-green-400 h-5 w-5 mr-2" />
                    <p className="text-white">Secure Connection</p>
                  </div>
                  <div className="flex items-center mt-1">
                    <Key className="text-green-400 h-5 w-5 mr-2" />
                    <p className="text-white">Encrypted Transaction</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Screen */}
            <div className="md:col-span-2">
              <div className="bg-blue-900 p-6 h-[32rem] overflow-hidden border-b-4 border-slate-700">
                {/* The ATM Screen */}
                <div className="bg-black rounded-md h-full w-full p-4 text-green-400 font-mono overflow-hidden border-4 border-slate-600 relative">
                  <AnimatePresence mode="wait">
                    {atmScreen === ATMScreen.WELCOME && (
                      <motion.div 
                        key="welcome"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <h2 className="text-2xl mb-4 text-center">WELCOME TO OMERTÀ BANKING</h2>
                        <p className="mb-2 text-center">The trusted financial institution of the criminal underworld</p>
                        <p className="mb-8 text-center">We keep your dirty money clean</p>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-black font-bold"
                          onClick={() => setAtmScreen(ATMScreen.INSERT_CARD)}
                        >
                          START
                        </Button>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.INSERT_CARD && (
                      <motion.div 
                        key="insert-card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <CreditCardIcon className="h-24 w-24 mb-4 animate-pulse" />
                        <h2 className="text-2xl mb-4 text-center">INSERT YOUR CARD</h2>
                        <p className="text-center">Please insert your card in the reader to continue</p>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.ENTER_PIN && (
                      <motion.div 
                        key="enter-pin"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <h2 className="text-2xl mb-6 text-center">ENTER YOUR PIN</h2>
                        <div className="flex gap-4 mb-8">
                          {[1, 2, 3, 4].map((_, index) => (
                            <div 
                              key={index}
                              className="w-12 h-12 border-2 border-green-400 rounded-md flex items-center justify-center text-xl"
                            >
                              {index < pinInput.length ? "*" : ""}
                            </div>
                          ))}
                        </div>
                        <p className="text-center text-xs">Use the keypad below to enter your PIN</p>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.ACCOUNT_SELECT && (
                      <motion.div 
                        key="account-select"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-2xl mb-4 text-center">SELECT ACCOUNT</h2>
                        
                        {accountsLoading ? (
                          <div className="flex-1 flex items-center justify-center">
                            <p>Loading accounts...</p>
                          </div>
                        ) : accounts && accounts.length > 0 ? (
                          <div className="space-y-3 overflow-auto flex-1">
                            {accounts.map((account) => (
                              <motion.div
                                key={account.id}
                                whileHover={{ scale: 1.02 }}
                                className="p-3 rounded-md border border-green-500 bg-slate-900 cursor-pointer"
                                onClick={() => handleAccountSelect(account.id)}
                              >
                                <div className="flex justify-between">
                                  <span>{accountTypeNames[account.accountType as keyof typeof accountTypeNames]}</span>
                                  <span>#{account.id}</span>
                                </div>
                                <div className="text-xl font-bold mt-1">{formatCurrency(account.balance)}</div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="mb-4">You don't have any accounts yet.</p>
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-black font-bold"
                              onClick={() => setAtmScreen(ATMScreen.CREATE_ACCOUNT)}
                            >
                              Create Account
                            </Button>
                          </div>
                        )}
                        
                        <div className="mt-4 flex justify-between">
                          <Button 
                            variant="outline" 
                            className="border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.WELCOME)}
                          >
                            Back
                          </Button>
                          
                          {accounts && accounts.length > 0 && (
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-black font-bold"
                              onClick={() => setAtmScreen(ATMScreen.CREATE_ACCOUNT)}
                            >
                              New Account
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.MAIN_MENU && accountDetails && (
                      <motion.div 
                        key="main-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-2 text-center">
                          {accountTypeNames[accountDetails.accountType as keyof typeof accountTypeNames]} #{accountDetails.id}
                        </h2>
                        <div className="text-center mb-4">
                          <span className="text-sm text-green-300">Balance:</span>
                          <div className="text-2xl font-bold">{formatCurrency(accountDetails.balance)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setTransactionAmount("");
                              setAtmScreen(ATMScreen.DEPOSIT);
                            }}
                          >
                            <ArrowDownIcon className="mr-2 h-4 w-4" />
                            Deposit
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setTransactionAmount("");
                              setAtmScreen(ATMScreen.WITHDRAW);
                            }}
                          >
                            <ArrowUpIcon className="mr-2 h-4 w-4" />
                            Withdraw
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setTransactionAmount("");
                              setAtmScreen(ATMScreen.TRANSFER);
                            }}
                          >
                            <ArrowRightLeftIcon className="mr-2 h-4 w-4" />
                            Transfer
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setTransactionAmount("");
                              setRecipientUsername("");
                              setAtmScreen(ATMScreen.SEND_MONEY);
                            }}
                          >
                            <SendIcon className="mr-2 h-4 w-4" />
                            Send Money
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setAtmScreen(ATMScreen.BALANCE);
                            }}
                          >
                            <DollarSignIcon className="mr-2 h-4 w-4" />
                            Balance
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400 justify-start"
                            onClick={() => {
                              setAtmScreen(ATMScreen.TRANSACTION_HISTORY);
                            }}
                          >
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            History
                          </Button>
                        </div>
                        
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            className="w-full border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.ACCOUNT_SELECT)}
                          >
                            <ChevronLeftIcon className="mr-2 h-4 w-4" />
                            Back to Accounts
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.BALANCE && accountDetails && (
                      <motion.div 
                        key="balance"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">ACCOUNT DETAILS</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <div className="grid grid-cols-2 gap-y-4">
                            <div>
                              <span className="text-sm text-green-300">Account Type:</span>
                              <div>{accountTypeNames[accountDetails.accountType as keyof typeof accountTypeNames]}</div>
                            </div>
                            <div>
                              <span className="text-sm text-green-300">Account Number:</span>
                              <div>#{accountDetails.id}</div>
                            </div>
                            <div>
                              <span className="text-sm text-green-300">Balance:</span>
                              <div className="font-bold">{formatCurrency(accountDetails.balance)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-green-300">Interest Rate:</span>
                              <div>{(accountDetails.interestRate * 100).toFixed(2)}%</div>
                            </div>
                            <div>
                              <span className="text-sm text-green-300">Minimum Balance:</span>
                              <div>{formatCurrency(accountDetails.minimumBalance)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-green-300">Created:</span>
                              <div>{formatDate(accountDetails.createdAt).split(',')[0]}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            className="w-full border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            <ChevronLeftIcon className="mr-2 h-4 w-4" />
                            Back to Menu
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.TRANSACTION_HISTORY && accountDetails && (
                      <motion.div 
                        key="transaction-history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-2 text-center">TRANSACTION HISTORY</h2>
                        <div className="text-center mb-4">
                          <span className="text-sm text-green-300">
                            {accountTypeNames[accountDetails.accountType as keyof typeof accountTypeNames]} #{accountDetails.id}
                          </span>
                        </div>
                        
                        {accountDetails.transactions && accountDetails.transactions.length > 0 ? (
                          <div className="space-y-2 overflow-auto flex-1">
                            {accountDetails.transactions.map((transaction) => (
                              <div
                                key={transaction.id}
                                className="p-2 rounded-md border border-green-500 bg-slate-900"
                              >
                                <div className="flex justify-between">
                                  <span>{transaction.description || transaction.type}</span>
                                  <span className={transaction.amount > 0 ? "text-green-400" : "text-red-400"}>
                                    {transaction.amount > 0 ? "+" : ""}
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                </div>
                                <div className="text-xs text-green-300 mt-1">
                                  {formatDate(transaction.timestamp)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <p>No transaction history available.</p>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            className="w-full border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            <ChevronLeftIcon className="mr-2 h-4 w-4" />
                            Back to Menu
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.DEPOSIT && (
                      <motion.div 
                        key="deposit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">DEPOSIT FUNDS</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <div className="text-center mb-2">
                            <span className="text-sm text-green-300">Enter Amount:</span>
                          </div>
                          <div className="text-4xl font-mono text-center p-2 bg-black border border-green-400 rounded-md">
                            ${transactionAmount || "0.00"}
                          </div>
                          <p className="text-xs text-center mt-2">Use the keypad to enter amount</p>
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={handleDeposit}
                            disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                          >
                            Deposit
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.WITHDRAW && (
                      <motion.div 
                        key="withdraw"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">WITHDRAW FUNDS</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <div className="text-center mb-2">
                            <span className="text-sm text-green-300">Enter Amount:</span>
                          </div>
                          <div className="text-4xl font-mono text-center p-2 bg-black border border-green-400 rounded-md">
                            ${transactionAmount || "0.00"}
                          </div>
                          <p className="text-xs text-center mt-2">Use the keypad to enter amount</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400"
                            onClick={() => setTransactionAmount("20")}
                          >
                            $20
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400"
                            onClick={() => setTransactionAmount("50")}
                          >
                            $50
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400"
                            onClick={() => setTransactionAmount("100")}
                          >
                            $100
                          </Button>
                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 border border-green-400"
                            onClick={() => setTransactionAmount("200")}
                          >
                            $200
                          </Button>
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={handleWithdraw}
                            disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                          >
                            Withdraw
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.TRANSFER && (
                      <motion.div 
                        key="transfer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">TRANSFER FUNDS</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <div className="text-center mb-2">
                            <span className="text-sm text-green-300">Enter Amount to Transfer:</span>
                          </div>
                          <div className="text-4xl font-mono text-center p-2 bg-black border border-green-400 rounded-md">
                            ${transactionAmount || "0.00"}
                          </div>
                          <p className="text-xs text-center mt-2">Use the keypad to enter amount</p>
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={handleEnter}
                            disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                          >
                            Next
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.TRANSFER_DESTINATION && accounts && (
                      <motion.div 
                        key="transfer-destination"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">SELECT DESTINATION ACCOUNT</h2>
                        
                        <div className="space-y-3 overflow-auto flex-1">
                          {accounts
                            .filter(account => account.id !== selectedAccountId)
                            .map((account) => (
                              <motion.div
                                key={account.id}
                                whileHover={{ scale: 1.02 }}
                                className="p-3 rounded-md border border-green-500 bg-slate-900 cursor-pointer"
                                onClick={() => {
                                  setTransferDestinationAccountId(account.id);
                                  handleTransfer();
                                }}
                              >
                                <div className="flex justify-between">
                                  <span>{accountTypeNames[account.accountType as keyof typeof accountTypeNames]}</span>
                                  <span>#{account.id}</span>
                                </div>
                                <div className="text-xl font-bold mt-1">{formatCurrency(account.balance)}</div>
                              </motion.div>
                            ))}
                        </div>
                        
                        {accounts.filter(account => account.id !== selectedAccountId).length === 0 && (
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-center">You don't have any other accounts to transfer to.</p>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            className="w-full border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.TRANSFER)}
                          >
                            Back
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.SEND_MONEY && (
                      <motion.div 
                        key="send-money"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">SEND MONEY TO USER</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <div className="mb-3">
                            <label className="text-sm text-green-300 block mb-1">Recipient Username:</label>
                            <Input 
                              value={recipientUsername}
                              onChange={(e) => setRecipientUsername(e.target.value)}
                              className="bg-black border-green-400 text-green-400"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm text-green-300 block mb-1">Amount:</label>
                            <div className="text-2xl font-mono text-center p-2 bg-black border border-green-400 rounded-md">
                              ${transactionAmount || "0.00"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => setAtmScreen(ATMScreen.MAIN_MENU)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={handleSendMoney}
                            disabled={!transactionAmount || parseFloat(transactionAmount) <= 0 || !recipientUsername}
                          >
                            Send Money
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.CREATE_ACCOUNT && (
                      <motion.div 
                        key="create-account"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">CREATE NEW ACCOUNT</h2>
                        
                        <div className="bg-slate-900 border border-green-400 rounded-md p-4 mb-4">
                          <label className="text-sm text-green-300 block mb-2">Account Type:</label>
                          <div className="space-y-2">
                            {Object.entries(accountTypeNames).map(([type, name]) => (
                              <div 
                                key={type}
                                className={`p-3 rounded-md border ${newAccountType === type ? 'border-green-400 bg-slate-800' : 'border-slate-700'} cursor-pointer`}
                                onClick={() => setNewAccountType(type)}
                              >
                                <div className="flex items-center">
                                  {newAccountType === type ? (
                                    <CheckIcon className="h-4 w-4 mr-2 text-green-400" />
                                  ) : (
                                    <div className="h-4 w-4 mr-2 rounded-full border border-green-400" />
                                  )}
                                  <span>{name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => accounts && accounts.length > 0 
                              ? setAtmScreen(ATMScreen.ACCOUNT_SELECT) 
                              : setAtmScreen(ATMScreen.WELCOME)
                            }
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={handleCreateAccount}
                          >
                            Create Account
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.PROCESSING && (
                      <motion.div 
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <div className="h-12 w-12 border-4 border-t-transparent border-green-400 rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl mb-2 text-center">{processingMessage}</h2>
                        <p className="text-center">Please wait...</p>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.RECEIPT && (
                      <motion.div 
                        key="receipt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <h2 className="text-xl mb-4 text-center">TRANSACTION RECEIPT</h2>
                        
                        <div className="flex-1 bg-white text-black font-mono p-4 rounded-md overflow-y-auto">
                          <div className="text-center mb-4">
                            <div className="font-bold">OMERTÀ BANKING TERMINAL</div>
                            <div className="text-xs">{new Date().toLocaleString()}</div>
                            <div className="text-xs">Transaction #{Math.floor(Math.random() * 1000000)}</div>
                            <div className="border-b border-black my-2"></div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="font-bold">{receiptMessage}</div>
                            <div className="text-xs">Transaction Type: {receiptData?.type}</div>
                            {receiptData?.amount && <div>Amount: {formatCurrency(receiptData.amount)}</div>}
                            {receiptData?.accountId && <div>Account: #{receiptData.accountId}</div>}
                            {receiptData?.fromAccountId && <div>From Account: #{receiptData.fromAccountId}</div>}
                            {receiptData?.toAccountId && <div>To Account: #{receiptData.toAccountId}</div>}
                            {receiptData?.recipient && <div>Recipient: {receiptData.recipient}</div>}
                            {receiptData?.balance !== undefined && <div>New Balance: {formatCurrency(receiptData.balance)}</div>}
                            {receiptData?.accountType && <div>Account Type: {accountTypeNames[receiptData.accountType as keyof typeof accountTypeNames]}</div>}
                          </div>
                          
                          <div className="text-center text-xs">
                            <div>Thank you for banking with Omertà</div>
                            <div>The bank that keeps your secrets</div>
                            <div className="border-b border-black my-2"></div>
                            <div>CUSTOMER COPY</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-green-400 text-green-400"
                            onClick={() => {
                              if (selectedAccountId) {
                                setAtmScreen(ATMScreen.MAIN_MENU);
                              } else {
                                setAtmScreen(ATMScreen.ACCOUNT_SELECT);
                              }
                            }}
                          >
                            <HomeIcon className="mr-2 h-4 w-4" />
                            Main Menu
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold"
                            onClick={() => window.print()}
                          >
                            <PrinterIcon className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {atmScreen === ATMScreen.ERROR && (
                      <motion.div 
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <BanIcon className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl mb-2 text-center text-red-400">ERROR</h2>
                        <p className="text-center mb-6">{errorMessage}</p>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-black font-bold"
                          onClick={() => {
                            if (selectedAccountId) {
                              setAtmScreen(ATMScreen.MAIN_MENU);
                            } else {
                              setAtmScreen(ATMScreen.ACCOUNT_SELECT);
                            }
                          }}
                        >
                          Continue
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-900">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button 
                    key={num}
                    className="h-12 bg-slate-700 hover:bg-slate-600"
                    onClick={() => handleKeypadInput(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button 
                  className="h-12 bg-slate-700 hover:bg-slate-600"
                  onClick={() => handleKeypadInput(".")}
                >
                  .
                </Button>
                <Button 
                  className="h-12 bg-slate-700 hover:bg-slate-600"
                  onClick={() => handleKeypadInput("0")}
                >
                  0
                </Button>
                <Button 
                  className="h-12 bg-red-700 hover:bg-red-600"
                  onClick={handleDelete}
                >
                  &larr;
                </Button>
                <Button 
                  className="h-12 bg-yellow-700 hover:bg-yellow-600 col-span-1"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button 
                  className="h-12 bg-green-700 hover:bg-green-600 col-span-2"
                  onClick={handleEnter}
                >
                  Enter
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}