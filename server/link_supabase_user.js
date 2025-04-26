// Script to link an existing user to a Supabase account
import pg from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Make sure Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables.');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function linkUser(username, password = 'TemporaryPassword123!') {
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
    console.log(`Looking up user '${username}'...`);
    const client = await pool.connect();

    try {
      // Find the user
      const userResult = await client.query(
        'SELECT id, username, email, supabase_id FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        console.error(`User '${username}' not found.`);
        return;
      }

      const user = userResult.rows[0];
      console.log('User found:', user);

      // Check if already linked
      if (user.supabase_id) {
        console.log(`User '${username}' is already linked to Supabase ID: ${user.supabase_id}`);
        return;
      }

      // Create user in Supabase Auth
      console.log(`Creating Supabase account for '${username}'...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          username: user.username,
          game_user_id: user.id,
        },
      });

      if (error) {
        console.error('Failed to create Supabase user:', error.message);
        return;
      }

      console.log('Supabase user created:', {
        id: data.user.id,
        email: data.user.email,
      });

      // Update the user with Supabase ID
      const updateResult = await client.query(
        'UPDATE users SET supabase_id = $1 WHERE id = $2 RETURNING id, username, supabase_id',
        [data.user.id, user.id]
      );

      console.log('User linked successfully:', updateResult.rows[0]);
      console.log(`\nUser '${username}' can now login with:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${password}`);

    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error linking user:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Please provide a username to link.');
  console.error('Usage: node server/link_supabase_user.js <username> [password]');
  process.exit(1);
}

// Get optional password
const password = process.argv[3] || 'TemporaryPassword123!';

// Link the user
linkUser(username, password);