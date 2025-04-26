import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable');
}

// Create PostgreSQL connection
const queryClient = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10, // Maximum number of connections
  idle_timeout: 30, // Max idle time for connections in seconds
});

// Create drizzle ORM instance
export const db = drizzle(queryClient, { 
  schema,
  logger: process.env.NODE_ENV !== 'production',
});

/**
 * Initialize the database connection and verify it works
 * @returns true if connection is successful, false otherwise
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test query to verify database connection
    const result = await db.select({ count: schema.users.id.count() }).from(schema.users);
    
    console.log(`Database connection successful. Users in database: ${result[0].count}`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Apply database migrations
 * This function should be called during server initialization
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    // Create a separate connection for migrations
    const migrationClient = postgres(process.env.DATABASE_URL, { 
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    });
    
    const migrationDb = drizzle(migrationClient);
    
    // Apply migrations from the drizzle folder
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    throw error;
  }
}