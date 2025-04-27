import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to check the database structure for the gang_members table
 */
async function main() {
  console.log("Checking database structure for gang_members table...");
  
  try {
    // Check if gang_members table exists
    const tableExistsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gang_members'
      )
    `);
    
    const tableExists = tableExistsResult.rows[0].exists === 'true' || tableExistsResult.rows[0].exists === true;
    
    if (!tableExists) {
      console.log("gang_members table does not exist!");
      return;
    }
    
    // Get column information
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gang_members'
    `);
    
    console.log("gang_members table columns:");
    columnsResult.rows.forEach((column: any) => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Check for constraints
    const constraintsResult = await db.execute(sql`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'gang_members'
    `);
    
    console.log("\ngang_members table constraints:");
    if (constraintsResult.rows.length === 0) {
      console.log("No constraints found");
    } else {
      constraintsResult.rows.forEach((constraint: any) => {
        console.log(`- ${constraint.conname} (${constraint.contype}): ${constraint.def}`);
      });
    }
    
    // Check for indices
    const indicesResult = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'gang_members'
    `);
    
    console.log("\ngang_members table indices:");
    if (indicesResult.rows.length === 0) {
      console.log("No indices found");
    } else {
      indicesResult.rows.forEach((index: any) => {
        console.log(`- ${index.indexname}: ${index.indexdef}`);
      });
    }
    
  } catch (error) {
    console.error("Error checking database structure:", error);
  }
}

main()
  .then(() => {
    console.log("Database structure check complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database check failed:", err);
    process.exit(1);
  });