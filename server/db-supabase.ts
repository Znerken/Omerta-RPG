import { drizzle } from 'drizzle-orm/postgres-js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { supabaseAdmin } from './supabase';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import * as casinoSchema from '@shared/schema-casino';

// We'll use the Postgres.js adapter for Drizzle with Supabase
// Get Supabase connection string from environment
const connectionString = process.env.SUPABASE_URL!.replace('supabase', 'supabase-postgres') + '/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Postgres client
const client = postgres(connectionString, { max: 1 });

// Create Drizzle database instance
export const db: PostgresJsDatabase<typeof schema & typeof casinoSchema> = drizzle(client, { 
  schema: { ...schema, ...casinoSchema } 
});

// Function to initialize the database tables if needed
export async function initializeDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Verify that we can connect and query
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('Database connection successful:', result);
    
    // Here we could add any initialization queries or migrations
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// SQL helper for raw queries
import { sql } from 'drizzle-orm';
export { sql };