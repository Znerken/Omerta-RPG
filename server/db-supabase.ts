import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { supabaseAdmin } from './supabase';

// Keep a single database connection instance
let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize database connection
 * @returns True if successful, false if failed
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable not set');
      return false;
    }

    // Create connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Maximum number of clients the pool should contain
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    });

    // Test connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('Database connected successfully');
    } finally {
      client.release();
    }

    // Initialize Drizzle ORM
    dbInstance = drizzle(pool, { schema });

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/**
 * Get database instance
 * @returns Drizzle ORM instance
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    if (!dbInstance) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbInstance[prop as keyof typeof dbInstance];
  }
});

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
    console.log('Database connection closed');
  }
}

/**
 * Reset database data - for testing only
 * WARNING: This will delete all data
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot reset database in production');
  }
  
  // For safety, we're not implementing this functionality
  console.warn('Database reset functionality not implemented for safety reasons');
}

/**
 * Create tables if they don't exist
 * This uses Drizzle's schema to create tables
 */
export async function createTables(): Promise<void> {
  // In a real implementation, you would use Drizzle migrations
  // For this example, we're keeping it simple
  console.log('Table creation should be handled by Drizzle migrations');
}

/**
 * Synchronize Supabase Auth users with our database
 * This function fetches all users from Supabase Auth and ensures
 * they exist in our database.
 */
export async function syncSupabaseUsers(): Promise<void> {
  try {
    // Get all users from Supabase Auth
    const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('No Supabase users found to sync');
      return;
    }

    console.log(`Found ${supabaseUsers.length} Supabase users to sync`);

    // Get our users by Supabase ID
    const dbUsers = await db.select().from(schema.users).where(
      schema.users.supabaseId.isNotNull()
    );

    // Map Supabase IDs to user IDs for quick lookup
    const existingUserMap = new Map(
      dbUsers.map(user => [user.supabaseId, user.id])
    );

    // Count stats
    let created = 0;
    let skipped = 0;

    // Process users
    for (const supabaseUser of supabaseUsers) {
      // Skip if user exists
      if (existingUserMap.has(supabaseUser.id)) {
        skipped++;
        continue;
      }

      // Extract metadata
      const metadata = supabaseUser.user_metadata as Record<string, any> || {};
      const username = metadata.username || supabaseUser.email?.split('@')[0] || 'user' + Math.floor(Math.random() * 10000);

      // Create user in our database
      try {
        const [user] = await db.insert(schema.users).values({
          username,
          email: supabaseUser.email || '',
          password: 'SUPABASE_AUTH', // We don't use passwords with Supabase auth
          supabaseId: supabaseUser.id,
          level: 1,
          cash: 1000,
          bank: 0,
          respect: 0,
          experience: 0,
          health: 100,
          max_health: 100,
          energy: 100,
          max_energy: 100,
          is_admin: false,
          banned: false,
          jailed: false,
        }).returning();

        // Create user stats, profile, etc. here
        
        created++;
      } catch (error) {
        console.error(`Error creating user for Supabase ID ${supabaseUser.id}:`, error);
      }
    }

    console.log(`Supabase user sync complete. Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error syncing Supabase users:', error);
    throw error;
  }
}