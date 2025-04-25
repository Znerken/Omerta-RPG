import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'transfer', 'loan_payment', 'interest', 'company_dividend', 'betting_win', 'betting_loss', 'casino_win', 'casino_loss', 'company_investment', 'tax']);
export const companyTypeEnum = pgEnum('company_type', ['restaurant', 'casino', 'nightclub', 'gun_shop', 'protection', 'black_market', 'drug_operation', 'smuggling', 'money_laundering', 'transport']);
export const assetTypeEnum = pgEnum('asset_type', ['vehicle', 'property', 'business', 'stock', 'luxury']);
export const betTypeEnum = pgEnum('bet_type', ['sports', 'racing', 'fight_club', 'dice', 'custom']);
export const betStatusEnum = pgEnum('bet_status', ['open', 'closed', 'settled', 'cancelled']);
export const loanStatusEnum = pgEnum('loan_status', ['active', 'paid', 'defaulted', 'forgiven']);

// Banking System
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountType: text("account_type").notNull().default("checking"), // checking, savings, business, offshore
  balance: integer("balance").notNull().default(0),
  interestRate: doublePrecision("interest_rate").notNull().default(0.01), // 1% daily for savings
  minimumBalance: integer("minimum_balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastInterestPaid: timestamp("last_interest_paid").defaultNow(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(), // Balance after transaction
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  targetUserId: integer("target_user_id"), // For transfers
  targetAccountId: integer("target_account_id"), // For transfers
  timestamp: timestamp("timestamp").defaultNow(),
});

// Loans System
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Borrower
  lenderId: integer("lender_id"), // Bank (null) or player lender
  amount: integer("amount").notNull(),
  interestRate: doublePrecision("interest_rate").notNull(),
  termDays: integer("term_days").notNull(), // Loan duration in days
  minimumPayment: integer("minimum_payment").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  nextPaymentDue: timestamp("next_payment_due").notNull(),
  status: loanStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  collateral: text("collateral"), // JSON string describing collateral
});

export const loanPayments = pgTable("loan_payments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull(),
  amount: integer("amount").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Companies System
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  type: companyTypeEnum("type").notNull(),
  logo: text("logo"),
  ownerId: integer("owner_id").notNull(),
  value: integer("value").notNull().default(10000),
  cash: integer("cash").notNull().default(5000),
  income: integer("income").notNull().default(0), // Daily passive income
  level: integer("level").notNull().default(1),
  employeeCapacity: integer("employee_capacity").notNull().default(5),
  createdAt: timestamp("created_at").defaultNow(),
  lastIncomeAt: timestamp("last_income_at").defaultNow(),
  publiclyTraded: boolean("publicly_traded").notNull().default(false),
  sharePrice: integer("share_price"), // Only for publicly traded companies
  totalShares: integer("total_shares"), // Only for publicly traded companies
});

export const companyEmployees = pgTable("company_employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  position: text("position").notNull().default("Employee"),
  salary: integer("salary").notNull(),
  hiredAt: timestamp("hired_at").defaultNow(),
  lastPaidAt: timestamp("last_paid_at").defaultNow(),
});

export const companyTransactions = pgTable("company_transactions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // income, expense, investment, dividend, tax
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const companyUpgrades = pgTable("company_upgrades", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(),
  incomeBonus: integer("income_bonus").notNull().default(0),
  capacityBonus: integer("capacity_bonus").notNull().default(0),
  valueBonus: integer("value_bonus").notNull().default(0),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Number of shares
  purchasePrice: integer("purchase_price").notNull(), // Average cost basis
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Assets System
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: assetTypeEnum("type").notNull(),
  basePrice: integer("base_price").notNull(),
  level: integer("level").notNull().default(1),
  income: integer("income").notNull().default(0), // Daily passive income
  availableForPurchase: boolean("available_for_purchase").notNull().default(true),
  image: text("image"),
  statBonus: json("stat_bonus").notNull().default({}), // JSON object with stat bonuses
});

export const userAssets = pgTable("user_assets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assetId: integer("asset_id").notNull(),
  purchasePrice: integer("purchase_price").notNull(),
  currentValue: integer("current_value").notNull(),
  lastIncomeAt: timestamp("last_income_at").defaultNow(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Betting System
export const bettingEvents = pgTable("betting_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: betTypeEnum("type").notNull(),
  status: betStatusEnum("status").notNull().default("open"),
  createdBy: integer("created_by").notNull(), // userId of creator (admin or player)
  endTime: timestamp("end_time").notNull(), // When betting will close
  settledAt: timestamp("settled_at"), // When the outcome was determined
  winners: text("winners"), // JSON array of winning option IDs
  createdAt: timestamp("created_at").defaultNow(),
});

export const bettingOptions = pgTable("betting_options", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  odds: doublePrecision("odds").notNull(), // Decimal odds
  isWinner: boolean("is_winner").notNull().default(false),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  optionId: integer("option_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  potentialWinnings: integer("potential_winnings").notNull(),
  status: text("status").notNull().default("active"), // active, won, lost, cancelled, paid
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

// Casino System
export const casinoGames = pgTable("casino_games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  minBet: integer("min_bet").notNull(),
  maxBet: integer("max_bet").notNull(),
  houseEdge: doublePrecision("house_edge").notNull(), // Percentage
  imageUrl: text("image_url"),
  enabled: boolean("enabled").notNull().default(true),
});

export const casinoHistory = pgTable("casino_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  betAmount: integer("bet_amount").notNull(),
  outcome: text("outcome").notNull(), // win, loss, tie
  winnings: integer("winnings"), // Null if loss
  gameData: json("game_data"), // Game-specific result data
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tax System
export const taxHistory = pgTable("tax_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertBankAccountSchema = createInsertSchema(bankAccounts).pick({
  userId: true,
  accountType: true,
  balance: true,
  interestRate: true,
  minimumBalance: true,
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).pick({
  accountId: true,
  amount: true,
  balance: true,
  type: true,
  description: true,
  targetUserId: true,
  targetAccountId: true,
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  userId: true,
  lenderId: true,
  amount: true,
  interestRate: true,
  termDays: true,
  minimumPayment: true,
  remainingAmount: true,
  nextPaymentDue: true,
  status: true,
  collateral: true,
});

export const insertLoanPaymentSchema = createInsertSchema(loanPayments).pick({
  loanId: true,
  amount: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  description: true,
  type: true,
  logo: true,
  ownerId: true,
  value: true,
  cash: true,
  income: true,
  level: true,
  employeeCapacity: true,
  publiclyTraded: true,
  sharePrice: true,
  totalShares: true,
});

export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).pick({
  companyId: true,
  userId: true,
  position: true,
  salary: true,
});

export const insertCompanyTransactionSchema = createInsertSchema(companyTransactions).pick({
  companyId: true,
  amount: true,
  type: true,
  description: true,
});

export const insertCompanyUpgradeSchema = createInsertSchema(companyUpgrades).pick({
  companyId: true,
  name: true,
  description: true,
  cost: true,
  incomeBonus: true,
  capacityBonus: true,
  valueBonus: true,
});

export const insertShareSchema = createInsertSchema(shares).pick({
  companyId: true,
  userId: true,
  amount: true,
  purchasePrice: true,
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  name: true,
  description: true,
  type: true,
  basePrice: true,
  level: true,
  income: true,
  availableForPurchase: true,
  image: true,
  statBonus: true,
});

export const insertUserAssetSchema = createInsertSchema(userAssets).pick({
  userId: true,
  assetId: true,
  purchasePrice: true,
  currentValue: true,
});

export const insertBettingEventSchema = createInsertSchema(bettingEvents).pick({
  title: true,
  description: true,
  type: true,
  status: true,
  createdBy: true,
  endTime: true,
  winners: true,
});

export const insertBettingOptionSchema = createInsertSchema(bettingOptions).pick({
  eventId: true,
  name: true,
  odds: true,
  isWinner: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  eventId: true,
  optionId: true,
  userId: true,
  amount: true,
  potentialWinnings: true,
  status: true,
});

export const insertCasinoGameSchema = createInsertSchema(casinoGames).pick({
  name: true,
  description: true,
  minBet: true,
  maxBet: true,
  houseEdge: true,
  imageUrl: true,
  enabled: true,
});

export const insertCasinoHistorySchema = createInsertSchema(casinoHistory).pick({
  userId: true,
  gameId: true,
  betAmount: true,
  outcome: true,
  winnings: true,
  gameData: true,
});

export const insertTaxHistorySchema = createInsertSchema(taxHistory).pick({
  userId: true,
  amount: true,
  reason: true,
});

// Types
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export type InsertLoanPayment = z.infer<typeof insertLoanPaymentSchema>;
export type LoanPayment = typeof loanPayments.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertCompanyEmployee = z.infer<typeof insertCompanyEmployeeSchema>;
export type CompanyEmployee = typeof companyEmployees.$inferSelect;

export type InsertCompanyTransaction = z.infer<typeof insertCompanyTransactionSchema>;
export type CompanyTransaction = typeof companyTransactions.$inferSelect;

export type InsertCompanyUpgrade = z.infer<typeof insertCompanyUpgradeSchema>;
export type CompanyUpgrade = typeof companyUpgrades.$inferSelect;

export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof shares.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertUserAsset = z.infer<typeof insertUserAssetSchema>;
export type UserAsset = typeof userAssets.$inferSelect;

export type InsertBettingEvent = z.infer<typeof insertBettingEventSchema>;
export type BettingEvent = typeof bettingEvents.$inferSelect;

export type InsertBettingOption = z.infer<typeof insertBettingOptionSchema>;
export type BettingOption = typeof bettingOptions.$inferSelect;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export type InsertCasinoGame = z.infer<typeof insertCasinoGameSchema>;
export type CasinoGame = typeof casinoGames.$inferSelect;

export type InsertCasinoHistory = z.infer<typeof insertCasinoHistorySchema>;
export type CasinoHistory = typeof casinoHistory.$inferSelect;

export type InsertTaxHistory = z.infer<typeof insertTaxHistorySchema>;
export type TaxHistory = typeof taxHistory.$inferSelect;

// Custom frontend types
export type UserWithFinancials = {
  id: number;
  username: string;
  cash: number;
  bankBalance: number;
  investmentBalance: number;
  netWorth: number;
  creditScore: number;
  loans: Loan[];
  bankAccounts: BankAccount[];
  companies: Company[];
  shares: Share[];
  assets: (UserAsset & { asset: Asset })[];
};

export type CompanyWithDetails = Company & {
  owner: { id: number; username: string };
  employees: (CompanyEmployee & { user: { id: number; username: string } })[];
  upgrades: CompanyUpgrade[];
  transactions: CompanyTransaction[];
};

export type BettingEventWithOptions = BettingEvent & {
  options: BettingOption[];
  bets?: Bet[];
};