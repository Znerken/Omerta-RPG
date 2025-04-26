import { users, type User, type InsertUser, 
         userStats, type UserStats, type InsertUserStats,
         userGangs, type UserGang, type InsertUserGang,
         gangs, type Gang, type InsertGang } from "@shared/schema";
import { db, sql } from "./db-supabase";
import { eq, and, not, isNull, desc, asc, gt, lt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { supabaseAdmin } from "./supabase";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(limit?: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  
  // Stats methods
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, statUpdates: Partial<UserStats>): Promise<UserStats | undefined>;
  
  // Gang methods
  getGang(id: number): Promise<Gang | undefined>;
  createGang(gangData: InsertGang): Promise<Gang>;
  updateGang(id: number, updates: Partial<Gang>): Promise<Gang | undefined>;
  getAllGangs(limit?: number): Promise<Gang[]>;
  getUserGangs(userId: number): Promise<Gang[]>;
  addGangMember(memberData: InsertUserGang): Promise<UserGang>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Set up session store using Supabase PostgreSQL connection
    const connectionString = process.env.SUPABASE_URL!.replace('supabase', 'supabase-postgres') + '/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.sessionStore = new PostgresSessionStore({
      conString: connectionString,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // After creating a user, also create their stats
    await this.createUserStats({
      userId: user.id,
      strength: 10,
      stealth: 10,
      charisma: 10,
      intelligence: 10,
      strengthTrainingCooldown: new Date(),
      stealthTrainingCooldown: new Date(),
      charismaTrainingCooldown: new Date(),
      intelligenceTrainingCooldown: new Date()
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First find the user to get their email
      const user = await this.getUser(id);
      
      if (user?.email) {
        // Find the Supabase Auth user by email
        const { data: { users: supaUsers }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!fetchError && supaUsers) {
          const supaUser = supaUsers.find(u => u.email === user.email);
          
          if (supaUser) {
            // Delete the user from Supabase Auth
            await supabaseAdmin.auth.admin.deleteUser(supaUser.id);
          }
        }
      }
      
      // Delete related records from our database
      await db.delete(userStats).where(eq(userStats.userId, id));
      await db.delete(userGangs).where(eq(userGangs.userId, id));
      
      // Finally delete the user from our database
      const result = await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async getAllUsers(limit: number = 100): Promise<User[]> {
    return await db.select().from(users).limit(limit);
  }
  
  async getUserCount(): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`count(*)`
    }).from(users);
    
    return result?.count || 0;
  }
  
  // Stats methods
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }
  
  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [createdStats] = await db.insert(userStats).values(stats).returning();
    return createdStats;
  }
  
  async updateUserStats(userId: number, statUpdates: Partial<UserStats>): Promise<UserStats | undefined> {
    const [updatedStats] = await db
      .update(userStats)
      .set(statUpdates)
      .where(eq(userStats.userId, userId))
      .returning();
    
    return updatedStats;
  }
  
  // Gang methods
  async getGang(id: number): Promise<Gang | undefined> {
    const [gang] = await db.select().from(gangs).where(eq(gangs.id, id));
    return gang;
  }
  
  async createGang(gangData: InsertGang): Promise<Gang> {
    const [gang] = await db.insert(gangs).values(gangData).returning();
    return gang;
  }
  
  async updateGang(id: number, updates: Partial<Gang>): Promise<Gang | undefined> {
    const [updatedGang] = await db
      .update(gangs)
      .set(updates)
      .where(eq(gangs.id, id))
      .returning();
    
    return updatedGang;
  }
  
  async getAllGangs(limit: number = 100): Promise<Gang[]> {
    return await db.select().from(gangs).limit(limit);
  }
  
  async getUserGangs(userId: number): Promise<Gang[]> {
    // Get all gangs that the user is a member of
    const query = db
      .select({
        gang: gangs
      })
      .from(userGangs)
      .innerJoin(gangs, eq(userGangs.gangId, gangs.id))
      .where(eq(userGangs.userId, userId));
    
    const result = await query;
    return result.map(r => r.gang);
  }
  
  async addGangMember(memberData: InsertUserGang): Promise<UserGang> {
    const [membership] = await db.insert(userGangs).values(memberData).returning();
    return membership;
  }
}

// Export an instance of the storage
export const storage = new SupabaseStorage();