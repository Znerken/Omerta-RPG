// Run this file with NODE_ENV=development node jail_user.js

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function jailUser(userId, durationMinutes, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Calculate jail end time
    const now = new Date();
    const jailTimeEnd = new Date();
    jailTimeEnd.setMinutes(jailTimeEnd.getMinutes() + durationMinutes);
    
    console.log(`Attempting to jail user ${userId} until ${jailTimeEnd.toISOString()} for reason: ${reason}`);
    
    // First check if the user exists
    const userCheckResult = await client.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheckResult.rows.length === 0) {
      console.log(`No user found with ID ${userId}`);
      return;
    }
    
    const username = userCheckResult.rows[0].username;
    
    // Update user in database
    const updateResult = await client.query(
      `UPDATE users 
      SET is_jailed = true, 
          jail_time_end = $1, 
          jail_reason = $2
      WHERE id = $3
      RETURNING id, username, is_jailed, jail_time_end`,
      [jailTimeEnd, reason, userId]
    );
    
    await client.query('COMMIT');
    
    if (updateResult.rows.length > 0) {
      const user = updateResult.rows[0];
      console.log(`User ${username} (ID: ${userId}) has been jailed until ${user.jail_time_end}`);
    } else {
      console.log(`Failed to jail user ${username} (ID: ${userId})`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error jailing user:', error);
  } finally {
    client.release();
  }
}

// Jail user 18 (tester_BekYqEC0) for 60 minutes
jailUser(18, 60, 'Testing jail feature').then(() => process.exit(0));