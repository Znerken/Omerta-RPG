/**
 * This script links an existing user to a Supabase account
 * Usage: node server/link_supabase_user.cjs <username>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Create Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function linkUser(username, password = 'TemporaryPassword123!') {
  try {
    console.log(`Linking user "${username}" to Supabase...`);

    // Get user from database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.error(`User "${username}" not found in the database`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.username} (ID: ${user.id}, Email: ${user.email})`);

    // Check if user is already linked
    if (user.supabase_id) {
      console.log(`User "${username}" is already linked to Supabase ID: ${user.supabase_id}`);
      
      // Verify if the Supabase user exists
      const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(user.supabase_id);
      
      if (error) {
        console.log(`Error fetching Supabase user: ${error.message}`);
        console.log('Creating a new Supabase user instead...');
      } else {
        console.log(`Verified Supabase user: ${supabaseUser.user.email}`);
        process.exit(0);
      }
    }

    // Create a Supabase user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        game_user_id: user.id
      }
    });

    if (authError) {
      console.error(`Error creating Supabase user: ${authError.message}`);
      process.exit(1);
    }

    console.log(`Created Supabase user: ${authUser.user.email} (ID: ${authUser.user.id})`);

    // Update user in database with Supabase ID
    await pool.query(
      'UPDATE users SET supabase_id = $1 WHERE id = $2',
      [authUser.user.id, user.id]
    );

    console.log(`Updated user "${username}" with Supabase ID: ${authUser.user.id}`);
    console.log(`Temporary password for login: ${password}`);
    console.log('Done!');

  } catch (error) {
    console.error('Error linking user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Usage: node server/link_supabase_user.cjs <username>');
  process.exit(1);
}

linkUser(username).catch(console.error);