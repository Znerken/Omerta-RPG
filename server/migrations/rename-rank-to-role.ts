import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration script to rename the 'rank' column to 'role' in the gang_members table
 */
async function main() {
  console.log("Starting migration: Rename rank column to role in gang_members table...");
  
  try {
    // First check if role column already exists to avoid duplicate columns
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gang_members' AND column_name = 'role'
    `);
    
    const roleColumnExists = checkResult.rows.length > 0;
    
    if (roleColumnExists) {
      console.log("Role column already exists, skipping creation...");
    } else {
      console.log("Adding 'role' column to gang_members table...");
      await db.execute(sql`
        ALTER TABLE gang_members ADD COLUMN role TEXT
      `);
      console.log("Role column added successfully.");
    }
    
    // Check if rank column exists
    const rankCheckResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gang_members' AND column_name = 'rank'
    `);
    
    const rankColumnExists = rankCheckResult.rows.length > 0;
    
    if (rankColumnExists) {
      console.log("Transferring data from 'rank' to 'role'...");
      // Copy data from rank to role
      await db.execute(sql`
        UPDATE gang_members SET role = rank WHERE role IS NULL
      `);
      
      console.log("Data transferred successfully.");
      
      // Drop rank column (optional - keep commented out for safety)
      // console.log("Dropping 'rank' column...");
      // await db.execute(sql`
      //   ALTER TABLE gang_members DROP COLUMN rank
      // `);
      // console.log("Rank column dropped successfully.");
    } else {
      console.log("Rank column does not exist, already migrated.");
    }
    
    console.log("Setting default value for role column if null...");
    await db.execute(sql`
      UPDATE gang_members SET role = 'Soldier' WHERE role IS NULL
    `);
    
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Migration script finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });