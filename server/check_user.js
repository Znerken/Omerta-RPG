// Script to check if a specific user exists in the database
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function checkUser(username) {
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
    // Connect to the database
    console.log(`Checking for user '${username}'...`);
    const client = await pool.connect();

    try {
      // Query for the user
      const result = await client.query(
        'SELECT id, username, email, supabase_id FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        console.log(`User '${username}' not found.`);
      } else {
        console.log('User found:');
        console.log(result.rows[0]);
      }
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get username from command line arguments
const username = process.argv[2] || 'extortionist';

// Check the user
checkUser(username);