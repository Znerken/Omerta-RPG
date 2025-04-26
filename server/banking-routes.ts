import { Express, Request, Response } from "express";
import { storage } from "./storage";
import * as z from "zod";
import { insertBankAccountSchema } from "../shared/schema-economy";
import { isAuthenticated } from "./middleware/auth";

// Validate send money schema
const sendMoneySchema = z.object({
  accountId: z.number(),
  recipientUsername: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional()
});

export function registerBankingRoutes(app: Express) {
  // Get user's bank accounts
  app.get("/api/banking/accounts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const userId = req.user.id;
      const accounts = await storage.getBankAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  // Create a new bank account
  app.post("/api/banking/accounts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const userId = req.user.id;
      
      // Validate the request body
      const validatedData = insertBankAccountSchema.parse({
        ...req.body,
        userId,
      });
      
      const account = await storage.createBankAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  // Get account details with transactions
  app.get("/api/banking/accounts/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Fetch the account
      const account = await storage.getBankAccountById(accountId);
      
      // Make sure the account exists and belongs to the user
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Get recent transactions
      const transactions = await storage.getBankTransactionsByAccountId(accountId);
      
      res.json({
        ...account,
        transactions
      });
    } catch (error) {
      console.error("Error fetching account details:", error);
      res.status(500).json({ message: "Failed to fetch account details" });
    }
  });

  // Deposit money into account
  app.post("/api/banking/accounts/:id/deposit", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.id;
      const { amount } = req.body;
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Get user and account
      const user = await storage.getUser(userId);
      const account = await storage.getBankAccountById(accountId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Check if user has enough cash
      if (user.cash < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Update user cash
      await storage.updateUser(userId, {
        cash: user.cash - amount
      });
      
      // Update account balance 
      const updatedAccount = await storage.updateBankAccount(accountId, {
        balance: account.balance + amount
      });
      
      // Create transaction record
      const transaction = await storage.createBankTransaction({
        accountId,
        amount,
        balance: updatedAccount!.balance,
        type: "deposit",
        description: "Cash deposit",
      });
      
      // Check for deposit achievements
      let unlockedAchievements = [];
      try {
        // 1. Check for "bank_deposit" achievement (tracks total deposits)
        const depositAchievements = await storage.checkAndUpdateAchievementProgress(
          userId, 
          "bank_deposit", 
          undefined,
          amount
        );
        
        // 2. Check for "bank_balance" achievement (tracks total balance)
        const balanceAchievements = await storage.checkAndUpdateAchievementProgress(
          userId,
          "bank_balance",
          undefined,
          updatedAccount!.balance
        );
        
        // Combine all unlocked achievements
        unlockedAchievements = [
          ...depositAchievements,
          ...balanceAchievements
        ];
      } catch (err) {
        console.error("Error checking banking achievements:", err);
        // Continue execution, don't let achievement errors affect the main flow
      }
      
      res.json({
        success: true,
        account: updatedAccount,
        transaction,
        newCashBalance: user.cash - amount,
        unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined
      });
    } catch (error) {
      console.error("Error making deposit:", error);
      res.status(500).json({ message: "Failed to make deposit" });
    }
  });

  // Withdraw money from account
  app.post("/api/banking/accounts/:id/withdraw", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.id;
      const { amount } = req.body;
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Get user and account
      const user = await storage.getUser(userId);
      const account = await storage.getBankAccountById(accountId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Check if account has enough balance
      if (account.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds in the account" });
      }
      
      // Check minimum balance requirement
      if (account.balance - amount < account.minimumBalance) {
        return res.status(400).json({ 
          message: `Cannot withdraw below minimum balance of $${account.minimumBalance}`
        });
      }
      
      // Update user cash
      await storage.updateUser(userId, {
        cash: user.cash + amount
      });
      
      // Update account balance
      const updatedAccount = await storage.updateBankAccount(accountId, {
        balance: account.balance - amount
      });
      
      // Create transaction record
      const transaction = await storage.createBankTransaction({
        accountId,
        amount: -amount, // Negative amount for withdrawal
        balance: updatedAccount!.balance,
        type: "withdrawal",
        description: "Cash withdrawal",
      });
      
      // Check for withdrawal achievements
      let unlockedAchievements = [];
      try {
        // 1. Check for "bank_withdrawal" achievement (tracks total withdrawals)
        const withdrawalAchievements = await storage.checkAndUpdateAchievementProgress(
          userId, 
          "bank_withdrawal", 
          undefined,
          amount
        );
        
        // Combine all unlocked achievements
        unlockedAchievements = [
          ...withdrawalAchievements
        ];
      } catch (err) {
        console.error("Error checking banking achievements:", err);
        // Continue execution, don't let achievement errors affect the main flow
      }
      
      res.json({
        success: true,
        account: updatedAccount,
        transaction,
        newCashBalance: user.cash + amount,
        unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined
      });
    } catch (error) {
      console.error("Error making withdrawal:", error);
      res.status(500).json({ message: "Failed to make withdrawal" });
    }
  });

  // Transfer money between accounts
  app.post("/api/banking/transfer", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const userId = req.user.id;
      const { fromAccountId, toAccountId, amount, description } = req.body;
      
      // Validate input
      if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      // Check if accounts exist and from account belongs to user
      const fromAccount = await storage.getBankAccountById(fromAccountId);
      const toAccount = await storage.getBankAccountById(toAccountId);
      
      if (!fromAccount || fromAccount.userId !== userId) {
        return res.status(404).json({ message: "Source account not found or unauthorized" });
      }
      
      if (!toAccount) {
        return res.status(404).json({ message: "Destination account not found" });
      }
      
      // Check if source account has enough balance
      if (fromAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Check minimum balance requirement
      if (fromAccount.balance - amount < fromAccount.minimumBalance) {
        return res.status(400).json({ 
          message: `Cannot transfer below minimum balance of $${fromAccount.minimumBalance}`
        });
      }
      
      // Update source account
      const updatedFromAccount = await storage.updateBankAccount(fromAccountId, {
        balance: fromAccount.balance - amount
      });
      
      // Update destination account
      const updatedToAccount = await storage.updateBankAccount(toAccountId, {
        balance: toAccount.balance + amount
      });
      
      // Create transaction records
      const fromTransaction = await storage.createBankTransaction({
        accountId: fromAccountId,
        amount: -amount,
        balance: updatedFromAccount!.balance,
        type: "transfer",
        description: description || "Transfer sent",
        targetAccountId: toAccountId,
        targetUserId: toAccount.userId,
      });
      
      const toTransaction = await storage.createBankTransaction({
        accountId: toAccountId,
        amount,
        balance: updatedToAccount!.balance,
        type: "transfer",
        description: description || "Transfer received",
        targetAccountId: fromAccountId,
        targetUserId: fromAccount.userId,
      });
      
      // Check for transfer achievements
      let unlockedAchievements = [];
      try {
        // Check for "bank_transfer" achievement (tracks total transfers)
        const transferAchievements = await storage.checkAndUpdateAchievementProgress(
          userId, 
          "bank_transfer", 
          undefined,
          amount
        );
        
        unlockedAchievements = [
          ...transferAchievements
        ];
      } catch (err) {
        console.error("Error checking banking transfer achievements:", err);
        // Continue execution, don't let achievement errors affect the main flow
      }
      
      res.json({
        success: true,
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
        fromTransaction,
        toTransaction,
        unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined
      });
    } catch (error) {
      console.error("Error making transfer:", error);
      res.status(500).json({ message: "Failed to make transfer" });
    }
  });

  // Send money to another user 
  app.post("/api/banking/send-money", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const senderId = req.user.id;
      
      // Validate request data
      const validatedData = sendMoneySchema.parse(req.body);
      const { accountId, recipientUsername, amount, description } = validatedData;
      
      // Check if sender account exists and belongs to user
      const senderAccount = await storage.getBankAccountById(accountId);
      if (!senderAccount || senderAccount.userId !== senderId) {
        return res.status(404).json({ message: "Source account not found or not authorized" });
      }
      
      // Find recipient user
      const recipientUser = await storage.getUserByUsername(recipientUsername);
      if (!recipientUser) {
        return res.status(404).json({ message: "Recipient user not found" });
      }
      
      // Don't allow sending to self
      if (recipientUser.id === senderId) {
        return res.status(400).json({ message: "Cannot send money to yourself" });
      }
      
      // Check if sender has enough balance
      if (senderAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Check minimum balance requirement
      if (senderAccount.balance - amount < senderAccount.minimumBalance) {
        return res.status(400).json({ 
          message: `Cannot send below minimum balance of $${senderAccount.minimumBalance}`
        });
      }
      
      // Find recipient's default account (first savings account)
      const recipientAccounts = await storage.getBankAccountsByUserId(recipientUser.id);
      
      let recipientAccount = recipientAccounts.find(acc => acc.accountType === "savings");
      
      // If recipient doesn't have an account yet, create one for them
      if (!recipientAccount) {
        recipientAccount = await storage.createBankAccount({
          userId: recipientUser.id,
          accountType: "savings",
          name: "Savings Account",
          balance: 0,
          interestRate: 0.001, // 0.1% daily
          minimumBalance: 0,
        });
      }
      
      // Update sender account
      const updatedSenderAccount = await storage.updateBankAccount(accountId, {
        balance: senderAccount.balance - amount
      });
      
      // Update recipient account
      const updatedRecipientAccount = await storage.updateBankAccount(recipientAccount.id, {
        balance: recipientAccount.balance + amount
      });
      
      // Create transaction records
      const senderDesc = description ? 
        `Payment to ${recipientUsername}: ${description}` : 
        `Payment to ${recipientUsername}`;
      
      const recipientDesc = description ? 
        `Payment from ${req.user.username}: ${description}` : 
        `Payment from ${req.user.username}`;
      
      const senderTransaction = await storage.createBankTransaction({
        accountId,
        amount: -amount,
        balance: updatedSenderAccount!.balance,
        type: "payment",
        description: senderDesc,
        targetUserId: recipientUser.id,
        targetAccountId: recipientAccount.id,
      });
      
      const recipientTransaction = await storage.createBankTransaction({
        accountId: recipientAccount.id,
        amount,
        balance: updatedRecipientAccount!.balance,
        type: "payment",
        description: recipientDesc,
        targetUserId: senderId,
        targetAccountId: accountId,
      });
      
      // Check for payment achievements
      let unlockedAchievements = [];
      try {
        // 1. Check for "sent_money" achievement (tracks total money sent to other players)
        const sentMoneyAchievements = await storage.checkAndUpdateAchievementProgress(
          senderId, 
          "sent_money", 
          undefined,
          amount
        );
        
        // 2. Check for "bank_transactions" achievement (counts number of transactions)
        const transactionAchievements = await storage.checkAndUpdateAchievementProgress(
          senderId,
          "bank_transactions",
          undefined,
          1 // Increment by 1 transaction
        );
        
        // Combine all unlocked achievements
        unlockedAchievements = [
          ...sentMoneyAchievements,
          ...transactionAchievements
        ];
      } catch (err) {
        console.error("Error checking payment achievements:", err);
        // Continue execution, don't let achievement errors affect the main flow
      }
      
      res.json({
        success: true,
        senderAccount: updatedSenderAccount,
        recipientAccount: updatedRecipientAccount,
        senderTransaction,
        recipientTransaction,
        unlockedAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error sending money:", error);
      res.status(500).json({ message: "Failed to send money" });
    }
  });

  // Process interest payments (could be triggered by a cron job in production)
  app.post("/api/banking/process-interest", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const now = new Date();
      
      // Get all savings accounts that haven't had interest paid in 24+ hours
      const accounts = await storage.getBankAccountsForInterest();
      
      const results = await Promise.all(accounts.map(async (account) => {
        // Calculate interest
        const interestAmount = Math.floor(account.balance * account.interestRate);
        
        // Update account balance
        const updatedAccount = await storage.updateBankAccount(account.id, {
          balance: account.balance + interestAmount,
          lastInterestPaid: now
        });
        
        // Create transaction record
        const transaction = await storage.createBankTransaction({
          accountId: account.id,
          amount: interestAmount,
          balance: updatedAccount!.balance,
          type: "interest",
          description: `Interest payment (${(account.interestRate * 100).toFixed(2)}%)`,
        });
        
        return {
          accountId: account.id,
          userId: account.userId,
          interestAmount,
          transaction
        };
      }));
      
      res.json({
        success: true,
        processed: results.length,
        results
      });
    } catch (error) {
      console.error("Error processing interest:", error);
      res.status(500).json({ message: "Failed to process interest payments" });
    }
  });
}