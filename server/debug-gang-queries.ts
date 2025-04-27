import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to debug queries and print the raw SQL
 */
async function main() {
  console.log("Debugging gang SQL queries...");
  
  try {
    // Get the raw SQL for getGangMember
    const userId = 1;
    const rawQuery = `
      SELECT * FROM gang_members 
      WHERE user_id = ${userId}
    `;
    
    console.log("Raw query for getGangMember:");
    console.log(rawQuery);
    
    // Execute raw query
    console.log("\nExecuting raw query...");
    const result = await db.execute(sql.raw(rawQuery));
    console.log("Result:", result.rows);
    
    // Test adding a gang member
    console.log("\nTesting gang member insertion with raw SQL...");
    const insertQuery = `
      INSERT INTO gang_members (gang_id, user_id, role) 
      VALUES (1, 2, 'Soldier')
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    console.log("Raw insertion query:");
    console.log(insertQuery);
    
    try {
      const insertResult = await db.execute(sql.raw(insertQuery));
      console.log("Insertion result:", insertResult.rows);
    } catch (error) {
      console.error("Error with insertion:", error);
    }
    
  } catch (error) {
    console.error("Error debugging queries:", error);
  }
}

main()
  .then(() => {
    console.log("SQL debugging complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("SQL debugging failed:", err);
    process.exit(1);
  });