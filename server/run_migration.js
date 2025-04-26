// Script to run the SQL migration to add supabase_id column
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function runMigration() {
  // Get database URL from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Create a database client
  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'server', 'add_supabase_id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Connect to the database
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      // Execute the SQL
      console.log('Running migration...');
      const result = await client.query(sql);
      console.log('Migration completed successfully!');
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
runMigration();