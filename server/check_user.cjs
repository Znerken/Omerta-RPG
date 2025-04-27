/**
 * This script checks if a user exists in the database
 * Usage: node server/check_user.cjs <username>
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUser(username) {
  try {
    console.log(`Checking user "${username}" in the database...`);

    // Get user from database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.log(`User "${username}" not found in the database`);
      return null;
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.username} (ID: ${user.id}, Email: ${user.email})`);
    
    // Check if user has a Supabase ID
    if (user.supabase_id) {
      console.log(`User is linked to Supabase ID: ${user.supabase_id}`);
    } else {
      console.log(`User is NOT linked to a Supabase account`);
    }

    // Check user stats
    try {
      const statsResult = await pool.query(
        'SELECT * FROM user_stats WHERE user_id = $1',
        [user.id]
      );

      if (statsResult.rows.length === 0) {
        console.log(`User stats not found for user ${user.id}`);
      } else {
        const stats = statsResult.rows[0];
        console.log(`User stats: Strength: ${stats.strength}, Stealth: ${stats.stealth}, Charisma: ${stats.charisma}, Intelligence: ${stats.intelligence}`);
      }
    } catch (error) {
      console.log(`Could not retrieve user stats: ${error.message}`);
    }

    // Check if user is in a gang
    const gangResult = await pool.query(
      'SELECT g.* FROM gangs g JOIN gang_members gm ON g.id = gm.gang_id WHERE gm.user_id = $1',
      [user.id]
    );

    if (gangResult.rows.length === 0) {
      console.log(`User is not in a gang`);
    } else {
      const gang = gangResult.rows[0];
      console.log(`User is in gang: ${gang.name} (ID: ${gang.id})`);
    }

    return user;
  } catch (error) {
    console.error('Error checking user:', error);
    return null;
  } finally {
    await pool.end();
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Usage: node server/check_user.cjs <username>');
  process.exit(1);
}

checkUser(username).catch(console.error);