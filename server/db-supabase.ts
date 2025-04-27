import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';
import * as economySchema from '@shared/schema-economy';
import { eq, sql } from 'drizzle-orm';
import { users } from '@shared/schema';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set WebSocket constructor for Neon serverless
neonConfig.webSocketConstructor = ws;

// Check for database credentials
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create database pool and Drizzle instance
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: { ...schema, ...casinoSchema, ...economySchema } });

// Supabase clients for auth
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Initialize database connection and verify it works
 * @returns True if database connection is successful, false otherwise
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Check database connection
    const result = await db.execute<{ now: Date }>(sql`SELECT NOW()`);
    if (!result || !result.rows || result.rows.length === 0) {
      console.error('Database connection failed: No result returned');
      return false;
    }
    
    const now = result.rows[0].now;
    console.log(`Database connection successful, server time: ${now}`);
    
    // Check Supabase connection
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

/**
 * Create tables if they don't exist
 * This uses the schema defined in shared/schema.ts
 */
export async function createTables(): Promise<void> {
  try {
    // Check if users table exists
    const checkTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const tableExists = checkTable.rows[0]?.exists;
    
    if (!tableExists) {
      console.log('Creating database tables...');
      
      // We're using the neon-serverless driver which doesn't support schema creation
      // We'll use raw SQL to create the tables instead
      
      // Create users table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          supabase_id TEXT,
          level INTEGER NOT NULL DEFAULT 1,
          xp INTEGER NOT NULL DEFAULT 0,
          cash INTEGER NOT NULL DEFAULT 1000,
          respect INTEGER NOT NULL DEFAULT 0,
          avatar TEXT,
          banner_image TEXT,
          bio TEXT,
          html_profile TEXT,
          profile_theme TEXT DEFAULT 'dark',
          show_achievements BOOLEAN DEFAULT TRUE,
          is_admin BOOLEAN DEFAULT FALSE,
          is_jailed BOOLEAN DEFAULT FALSE,
          jail_time_end TIMESTAMP,
          jail_reason TEXT,
          ban_expiry TIMESTAMP,
          ban_reason TEXT,
          status TEXT DEFAULT 'offline',
          last_seen TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Create user_stats table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_stats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          strength INTEGER NOT NULL DEFAULT 10,
          stealth INTEGER NOT NULL DEFAULT 10,
          charisma INTEGER NOT NULL DEFAULT 10,
          intelligence INTEGER NOT NULL DEFAULT 10,
          strength_training_cooldown TIMESTAMP,
          stealth_training_cooldown TIMESTAMP,
          charisma_training_cooldown TIMESTAMP,
          intelligence_training_cooldown TIMESTAMP
        );
      `);
      
      // Create user_friends table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_friends (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          friend_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, friend_id)
        );
      `);
      
      // Create gangs table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS gangs (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          image TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Create gang_members table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS gang_members (
          id SERIAL PRIMARY KEY,
          gang_id INTEGER NOT NULL REFERENCES gangs(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          rank TEXT NOT NULL DEFAULT 'Member',
          contribution INTEGER NOT NULL DEFAULT 0,
          joined_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `);
      
      // Create messages table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER REFERENCES users(id),
          gang_id INTEGER REFERENCES gangs(id),
          content TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'direct',
          read BOOLEAN DEFAULT FALSE,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('Database tables created successfully');
    } else {
      console.log('Database tables already exist');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Synchronize users from Supabase Auth to our game database
 */
export async function syncSupabaseUsers(): Promise<void> {
  try {
    console.log('Synchronizing users from Supabase Auth...');
    
    // Get all Supabase users
    const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to get Supabase users: ${error.message}`);
    }
    
    let syncCount = 0;
    
    // Process each Supabase user
    for (const supabaseUser of supabaseUsers) {
      // Skip users without email
      if (!supabaseUser.email) {
        continue;
      }
      
      // Check if user exists in our database by Supabase ID
      let gameUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, supabaseUser.id)
      });
      
      if (!gameUser) {
        // Check if user exists by email
        gameUser = await db.query.users.findFirst({
          where: eq(users.email, supabaseUser.email)
        });
        
        if (gameUser) {
          // Link existing user to Supabase
          await db
            .update(users)
            .set({ 
              supabaseId: supabaseUser.id,
              // Update last_seen field using native column name
              last_seen: new Date() 
            })
            .where(eq(users.id, gameUser.id));
          
          console.log(`Linked existing user ${gameUser.username} to Supabase ID ${supabaseUser.id}`);
          syncCount++;
        } else {
          // Create new user
          const username = supabaseUser.user_metadata?.username || 
            `user_${Math.random().toString(36).substring(2, 8)}`;
          
          // Use raw SQL to avoid field mapping issues
          const insertResult = await db.execute(sql`
            INSERT INTO users (
              username, 
              email, 
              password, 
              supabase_id, 
              level, 
              xp, 
              cash, 
              respect, 
              is_admin, 
              is_jailed, 
              status, 
              last_seen, 
              created_at
            ) 
            VALUES (
              ${username}, 
              ${supabaseUser.email}, 
              'SUPABASE_AUTH', 
              ${supabaseUser.id}, 
              1, 
              0, 
              1000, 
              0, 
              false, 
              false, 
              'offline', 
              ${new Date()}, 
              ${new Date()}
            )
            RETURNING *
          `);
          
          const newUser = insertResult.rows[0];
          
          // Create stats for new user
          if (newUser) {
            await db.execute(sql`
              INSERT INTO stats (user_id, strength, stealth, charisma, intelligence)
              VALUES (${newUser.id}, 10, 10, 10, 10)
            `);
            
            console.log(`Created new user ${newUser.username} from Supabase ID ${supabaseUser.id}`);
            syncCount++;
          }
        }
      }
    }
    
    console.log(`Synchronized ${syncCount} users with Supabase Auth`);
  } catch (error) {
    console.error('Error synchronizing Supabase users:', error);
    throw error;
  }
}