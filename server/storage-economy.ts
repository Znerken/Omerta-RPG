import { eq, and, desc, gte, sql, lt, asc } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import {
  BankAccount, InsertBankAccount,
  BankTransaction, InsertBankTransaction,
  Loan, InsertLoan,
  LoanPayment, InsertLoanPayment,
  Company, InsertCompany,
  CompanyEmployee, InsertCompanyEmployee,
  CompanyTransaction, InsertCompanyTransaction,
  CompanyUpgrade, InsertCompanyUpgrade,
  Share, InsertShare,
  Asset, InsertAsset,
  UserAsset, InsertUserAsset,
  BettingEvent, InsertBettingEvent,
  BettingOption, InsertBettingOption,
  Bet, InsertBet,
  CasinoGame, InsertCasinoGame,
  CasinoHistory, InsertCasinoHistory,
  BettingEventWithOptions,
  CompanyWithDetails,
  bankAccounts,
  bankTransactions,
  loans,
  loanPayments,
  companies,
  companyEmployees,
  companyTransactions,
  companyUpgrades,
  shares,
  assets,
  userAssets,
  bettingEvents,
  bettingOptions,
  bets,
  casinoGames,
  casinoHistory
} from "@shared/schema-economy";

// Economy methods that extend the DatabaseStorage class
export class EconomyStorage {
  // Banking System Methods
  
  async getBankAccountsByUserId(userId: number): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(desc(bankAccounts.createdAt));
  }
  
  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id));
    return account;
  }
  
  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db
      .insert(bankAccounts)
      .values(insertAccount)
      .returning();
    return account;
  }
  
  async updateBankAccount(id: number, data: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [account] = await db
      .update(bankAccounts)
      .set(data)
      .where(eq(bankAccounts.id, id))
      .returning();
    return account;
  }
  
  async deleteBankAccount(id: number): Promise<boolean> {
    const result = await db
      .delete(bankAccounts)
      .where(eq(bankAccounts.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async getBankTransactionsByAccountId(accountId: number, limit: number = 50): Promise<BankTransaction[]> {
    return await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.accountId, accountId))
      .orderBy(desc(bankTransactions.timestamp))
      .limit(limit);
  }
  
  async createBankTransaction(insertTransaction: InsertBankTransaction): Promise<BankTransaction> {
    const [transaction] = await db
      .insert(bankTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
  
  async getBankAccountsForInterest(): Promise<BankAccount[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.accountType, "savings"),
          lt(bankAccounts.lastInterestPaid, oneDayAgo)
        )
      );
  }
  
  // Loans System Methods
  
  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }
  
  async getLoanById(id: number): Promise<Loan | undefined> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, id));
    return loan;
  }
  
  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const [loan] = await db
      .insert(loans)
      .values(insertLoan)
      .returning();
    return loan;
  }
  
  async updateLoan(id: number, data: Partial<Loan>): Promise<Loan | undefined> {
    const [loan] = await db
      .update(loans)
      .set(data)
      .where(eq(loans.id, id))
      .returning();
    return loan;
  }
  
  async getLoanPaymentsByLoanId(loanId: number): Promise<LoanPayment[]> {
    return await db
      .select()
      .from(loanPayments)
      .where(eq(loanPayments.loanId, loanId))
      .orderBy(desc(loanPayments.timestamp));
  }
  
  async createLoanPayment(insertPayment: InsertLoanPayment): Promise<LoanPayment> {
    const [payment] = await db
      .insert(loanPayments)
      .values(insertPayment)
      .returning();
    return payment;
  }
  
  async getOverdueLoansByUserId(userId: number): Promise<Loan[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.userId, userId),
          eq(loans.status, "active"),
          lt(loans.nextPaymentDue, now)
        )
      );
  }
  
  // Companies System Methods
  
  async getCompaniesByUserId(userId: number): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, userId))
      .orderBy(desc(companies.createdAt));
  }
  
  async getPubliclyTradedCompanies(): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.publiclyTraded, true))
      .orderBy(desc(companies.value));
  }
  
  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company;
  }
  
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }
  
  async updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }
  
  async getCompanyWithDetails(id: number): Promise<CompanyWithDetails | undefined> {
    const company = await this.getCompanyById(id);
    if (!company) return undefined;
    
    // Get company owner
    const [owner] = await db
      .select({
        id: users.id,
        username: users.username
      })
      .from(users)
      .where(eq(users.id, company.ownerId));
    
    // Get employees with user details
    const employees = await db
      .select({
        id: companyEmployees.id,
        companyId: companyEmployees.companyId,
        userId: companyEmployees.userId,
        position: companyEmployees.position,
        salary: companyEmployees.salary,
        hiredAt: companyEmployees.hiredAt,
        lastPaidAt: companyEmployees.lastPaidAt,
        user: {
          id: users.id,
          username: users.username
        }
      })
      .from(companyEmployees)
      .innerJoin(users, eq(companyEmployees.userId, users.id))
      .where(eq(companyEmployees.companyId, id));
    
    // Get company upgrades
    const upgrades = await db
      .select()
      .from(companyUpgrades)
      .where(eq(companyUpgrades.companyId, id));
    
    // Get recent transactions
    const transactions = await db
      .select()
      .from(companyTransactions)
      .where(eq(companyTransactions.companyId, id))
      .orderBy(desc(companyTransactions.timestamp))
      .limit(20);
    
    return {
      ...company,
      owner,
      employees,
      upgrades,
      transactions
    };
  }
  
  async getCompanyEmployeesByCompanyId(companyId: number): Promise<CompanyEmployee[]> {
    return await db
      .select()
      .from(companyEmployees)
      .where(eq(companyEmployees.companyId, companyId));
  }
  
  async createCompanyEmployee(insertEmployee: InsertCompanyEmployee): Promise<CompanyEmployee> {
    const [employee] = await db
      .insert(companyEmployees)
      .values(insertEmployee)
      .returning();
    return employee;
  }
  
  async updateCompanyEmployee(id: number, data: Partial<CompanyEmployee>): Promise<CompanyEmployee | undefined> {
    const [employee] = await db
      .update(companyEmployees)
      .set(data)
      .where(eq(companyEmployees.id, id))
      .returning();
    return employee;
  }
  
  async deleteCompanyEmployee(id: number): Promise<boolean> {
    const result = await db
      .delete(companyEmployees)
      .where(eq(companyEmployees.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async createCompanyTransaction(insertTransaction: InsertCompanyTransaction): Promise<CompanyTransaction> {
    const [transaction] = await db
      .insert(companyTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
  
  async createCompanyUpgrade(insertUpgrade: InsertCompanyUpgrade): Promise<CompanyUpgrade> {
    const [upgrade] = await db
      .insert(companyUpgrades)
      .values(insertUpgrade)
      .returning();
    return upgrade;
  }
  
  async getCompaniesForIncome(): Promise<Company[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(companies)
      .where(lt(companies.lastIncomeAt, oneDayAgo));
  }
  
  // Shares System Methods
  
  async getSharesByUserId(userId: number): Promise<Share[]> {
    return await db
      .select()
      .from(shares)
      .where(eq(shares.userId, userId));
  }
  
  async getSharesByCompanyId(companyId: number): Promise<Share[]> {
    return await db
      .select()
      .from(shares)
      .where(eq(shares.companyId, companyId));
  }
  
  async getShareById(id: number): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(eq(shares.id, id));
    return share;
  }
  
  async getUserShareInCompany(userId: number, companyId: number): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, userId),
          eq(shares.companyId, companyId)
        )
      );
    return share;
  }
  
  async createShare(insertShare: InsertShare): Promise<Share> {
    const [share] = await db
      .insert(shares)
      .values(insertShare)
      .returning();
    return share;
  }
  
  async updateShare(id: number, data: Partial<Share>): Promise<Share | undefined> {
    const [share] = await db
      .update(shares)
      .set(data)
      .where(eq(shares.id, id))
      .returning();
    return share;
  }
  
  async deleteShare(id: number): Promise<boolean> {
    const result = await db
      .delete(shares)
      .where(eq(shares.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Assets System Methods
  
  async getAllAssets(): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.availableForPurchase, true));
  }
  
  async getAssetById(id: number): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));
    return asset;
  }
  
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }
  
  async getUserAssetsByUserId(userId: number): Promise<(UserAsset & { asset: Asset })[]> {
    const userAssets = await db
      .select({
        id: userAssets.id,
        userId: userAssets.userId,
        assetId: userAssets.assetId,
        purchasePrice: userAssets.purchasePrice,
        currentValue: userAssets.currentValue,
        lastIncomeAt: userAssets.lastIncomeAt,
        purchasedAt: userAssets.purchasedAt,
        asset: {
          id: assets.id,
          name: assets.name,
          description: assets.description,
          type: assets.type,
          basePrice: assets.basePrice,
          level: assets.level,
          income: assets.income,
          image: assets.image,
          statBonus: assets.statBonus
        }
      })
      .from(userAssets)
      .innerJoin(assets, eq(userAssets.assetId, assets.id))
      .where(eq(userAssets.userId, userId));
    
    return userAssets;
  }
  
  async getUserAssetById(id: number): Promise<(UserAsset & { asset: Asset }) | undefined> {
    const [userAsset] = await db
      .select({
        id: userAssets.id,
        userId: userAssets.userId,
        assetId: userAssets.assetId,
        purchasePrice: userAssets.purchasePrice,
        currentValue: userAssets.currentValue,
        lastIncomeAt: userAssets.lastIncomeAt,
        purchasedAt: userAssets.purchasedAt,
        asset: {
          id: assets.id,
          name: assets.name,
          description: assets.description,
          type: assets.type,
          basePrice: assets.basePrice,
          level: assets.level,
          income: assets.income,
          image: assets.image,
          statBonus: assets.statBonus
        }
      })
      .from(userAssets)
      .innerJoin(assets, eq(userAssets.assetId, assets.id))
      .where(eq(userAssets.id, id));
    
    return userAsset;
  }
  
  async createUserAsset(insertUserAsset: InsertUserAsset): Promise<UserAsset> {
    const [userAsset] = await db
      .insert(userAssets)
      .values(insertUserAsset)
      .returning();
    return userAsset;
  }
  
  async updateUserAsset(id: number, data: Partial<UserAsset>): Promise<UserAsset | undefined> {
    const [userAsset] = await db
      .update(userAssets)
      .set(data)
      .where(eq(userAssets.id, id))
      .returning();
    return userAsset;
  }
  
  async deleteUserAsset(id: number): Promise<boolean> {
    const result = await db
      .delete(userAssets)
      .where(eq(userAssets.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async getUserAssetsForIncome(): Promise<(UserAsset & { asset: Asset })[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const assetsForIncome = await db
      .select({
        id: userAssets.id,
        userId: userAssets.userId,
        assetId: userAssets.assetId,
        purchasePrice: userAssets.purchasePrice,
        currentValue: userAssets.currentValue,
        lastIncomeAt: userAssets.lastIncomeAt,
        purchasedAt: userAssets.purchasedAt,
        asset: {
          id: assets.id,
          name: assets.name,
          description: assets.description,
          type: assets.type,
          basePrice: assets.basePrice,
          level: assets.level,
          income: assets.income,
          image: assets.image,
          statBonus: assets.statBonus
        }
      })
      .from(userAssets)
      .innerJoin(assets, eq(userAssets.assetId, assets.id))
      .where(
        and(
          lt(userAssets.lastIncomeAt, oneDayAgo),
          gt(assets.income, 0)
        )
      );
    
    return assetsForIncome;
  }
  
  // Betting System Methods
  
  async getAllActiveBettingEvents(): Promise<BettingEvent[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(bettingEvents)
      .where(
        and(
          eq(bettingEvents.status, "open"),
          gt(bettingEvents.endTime, now)
        )
      )
      .orderBy(asc(bettingEvents.endTime));
  }
  
  async getBettingEventById(id: number): Promise<BettingEventWithOptions | undefined> {
    const [event] = await db
      .select()
      .from(bettingEvents)
      .where(eq(bettingEvents.id, id));
    
    if (!event) return undefined;
    
    const options = await db
      .select()
      .from(bettingOptions)
      .where(eq(bettingOptions.eventId, id));
    
    return {
      ...event,
      options
    };
  }
  
  async getBettingEventWithBets(id: number, userId?: number): Promise<BettingEventWithOptions | undefined> {
    const eventWithOptions = await this.getBettingEventById(id);
    if (!eventWithOptions) return undefined;
    
    // Get bets, filter by userId if provided
    let betsQuery = db
      .select()
      .from(bets)
      .where(eq(bets.eventId, id));
    
    if (userId) {
      betsQuery = betsQuery.where(eq(bets.userId, userId));
    }
    
    const userBets = await betsQuery;
    
    return {
      ...eventWithOptions,
      bets: userBets
    };
  }
  
  async createBettingEvent(insertEvent: InsertBettingEvent): Promise<BettingEvent> {
    const [event] = await db
      .insert(bettingEvents)
      .values(insertEvent)
      .returning();
    return event;
  }
  
  async updateBettingEvent(id: number, data: Partial<BettingEvent>): Promise<BettingEvent | undefined> {
    const [event] = await db
      .update(bettingEvents)
      .set(data)
      .where(eq(bettingEvents.id, id))
      .returning();
    return event;
  }
  
  async createBettingOption(insertOption: InsertBettingOption): Promise<BettingOption> {
    const [option] = await db
      .insert(bettingOptions)
      .values(insertOption)
      .returning();
    return option;
  }
  
  async updateBettingOption(id: number, data: Partial<BettingOption>): Promise<BettingOption | undefined> {
    const [option] = await db
      .update(bettingOptions)
      .set(data)
      .where(eq(bettingOptions.id, id))
      .returning();
    return option;
  }
  
  async getUserBets(userId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.createdAt));
  }
  
  async getBetById(id: number): Promise<Bet | undefined> {
    const [bet] = await db
      .select()
      .from(bets)
      .where(eq(bets.id, id));
    return bet;
  }
  
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db
      .insert(bets)
      .values(insertBet)
      .returning();
    return bet;
  }
  
  async updateBet(id: number, data: Partial<Bet>): Promise<Bet | undefined> {
    const [bet] = await db
      .update(bets)
      .set(data)
      .where(eq(bets.id, id))
      .returning();
    return bet;
  }
  
  async getBetsForEvent(eventId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.eventId, eventId));
  }
  
  // Casino System Methods
  
  async getAllCasinoGames(): Promise<CasinoGame[]> {
    return await db
      .select()
      .from(casinoGames)
      .where(eq(casinoGames.enabled, true));
  }
  
  async getCasinoGameById(id: number): Promise<CasinoGame | undefined> {
    const [game] = await db
      .select()
      .from(casinoGames)
      .where(eq(casinoGames.id, id));
    return game;
  }
  
  async createCasinoGame(insertGame: InsertCasinoGame): Promise<CasinoGame> {
    const [game] = await db
      .insert(casinoGames)
      .values(insertGame)
      .returning();
    return game;
  }
  
  async updateCasinoGame(id: number, data: Partial<CasinoGame>): Promise<CasinoGame | undefined> {
    const [game] = await db
      .update(casinoGames)
      .set(data)
      .where(eq(casinoGames.id, id))
      .returning();
    return game;
  }
  
  async getUserCasinoHistory(userId: number, limit: number = 50): Promise<CasinoHistory[]> {
    return await db
      .select()
      .from(casinoHistory)
      .where(eq(casinoHistory.userId, userId))
      .orderBy(desc(casinoHistory.timestamp))
      .limit(limit);
  }
  
  async createCasinoHistory(insertHistory: InsertCasinoHistory): Promise<CasinoHistory> {
    const [history] = await db
      .insert(casinoHistory)
      .values(insertHistory)
      .returning();
    return history;
  }
  
  // Helpers
  async getUserNetWorth(userId: number): Promise<number> {
    // Get user cash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return 0;
    
    let netWorth = user.cash;
    
    // Add bank account balances
    const bankAccounts = await this.getBankAccountsByUserId(userId);
    netWorth += bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Add share values (current market value)
    const shares = await this.getSharesByUserId(userId);
    for (const share of shares) {
      const company = await this.getCompanyById(share.companyId);
      if (company && company.publiclyTraded && company.sharePrice) {
        netWorth += share.amount * company.sharePrice;
      } else if (company) {
        // For private companies, use company value / total shares (estimated)
        const totalShares = company.totalShares || 100; // Default to 100 if not set
        const estimatedSharePrice = company.value / totalShares;
        netWorth += share.amount * estimatedSharePrice;
      }
    }
    
    // Add asset values
    const userAssets = await this.getUserAssetsByUserId(userId);
    netWorth += userAssets.reduce((sum, ua) => sum + ua.currentValue, 0);
    
    // Subtract loan amounts
    const loans = await this.getLoansByUserId(userId);
    const activeLoans = loans.filter(loan => loan.status === "active");
    netWorth -= activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    
    return netWorth;
  }
}

export function gt(column: any, value: any) {
  return sql`${column} > ${value}`;
}