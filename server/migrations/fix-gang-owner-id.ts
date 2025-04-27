import { db } from "../db";
import { sql } from "drizzle-orm";

async function fixGangOwnerId() {
  try {
    console.log("Checking gangs table structure for owner_id/ownerId column...");
    
    // Check if the gangs table has an ownerId column
    const ownerIdCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'owner_id'
    `));
    
    // Check if the gangs table has an owner_id column
    const owner_idCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'ownerid'
    `));
    
    if (ownerIdCheck.rows.length === 0 && owner_idCheck.rows.length > 0) {
      console.log("Found 'ownerid' column but not 'owner_id' - renaming column...");
      // Rename ownerid to owner_id
      await db.execute(sql.raw(`
        ALTER TABLE gangs RENAME COLUMN ownerid TO owner_id
      `));
      console.log("Successfully renamed 'ownerid' column to 'owner_id'");
    } else if (ownerIdCheck.rows.length === 0 && owner_idCheck.rows.length === 0) {
      console.log("Neither 'ownerid' nor 'owner_id' columns found in gangs table. Checking the schema structure...");
      
      // Get all columns to diagnose the issue
      const columnsCheck = await db.execute(sql.raw(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'gangs'
      `));
      
      const columns = columnsCheck.rows.map(row => row.column_name);
      console.log("Current gang table columns:", columns);
      
      // Add owner_id column if it doesn't exist and the table has other expected columns
      if (columns.includes('id') && columns.includes('name')) {
        console.log("Adding missing 'owner_id' column...");
        // Add owner_id column
        await db.execute(sql.raw(`
          ALTER TABLE gangs ADD COLUMN owner_id INTEGER NOT NULL DEFAULT 1
        `));
        console.log("Successfully added 'owner_id' column with default value 1");
      } else {
        console.log("Table structure is inconsistent - may need manual intervention");
      }
    } else {
      console.log("'owner_id' column already exists, no changes needed");
    }
    
    console.log("Owner ID column check completed!");
    return true;
  } catch (error) {
    console.error("Error fixing gang owner ID column:", error);
    return false;
  }
}

// Execute the migration
fixGangOwnerId();