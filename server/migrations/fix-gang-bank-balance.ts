import { db } from "../db";
import { sql } from "drizzle-orm";

async function fixGangBankBalance() {
  try {
    console.log("Checking gangs table structure for bank_balance/money column...");
    
    // Check if the gangs table has a bank_balance column
    const bankBalanceCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'bank_balance'
    `));
    
    // Check if the gangs table has a money column
    const moneyCheck = await db.execute(sql.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gangs' AND column_name = 'money'
    `));
    
    if (bankBalanceCheck.rows.length === 0 && moneyCheck.rows.length > 0) {
      console.log("Found 'money' column but not 'bank_balance' - renaming column...");
      // Rename money to bank_balance
      await db.execute(sql.raw(`
        ALTER TABLE gangs RENAME COLUMN money TO bank_balance
      `));
      console.log("Successfully renamed 'money' column to 'bank_balance'");
    } else if (bankBalanceCheck.rows.length === 0 && moneyCheck.rows.length === 0) {
      console.log("Neither 'money' nor 'bank_balance' columns found - adding 'bank_balance'...");
      // Add bank_balance column
      await db.execute(sql.raw(`
        ALTER TABLE gangs ADD COLUMN bank_balance INTEGER DEFAULT 0
      `));
      console.log("Successfully added 'bank_balance' column");
    } else {
      console.log("'bank_balance' column already exists, no changes needed");
    }
    
    console.log("Bank balance column check completed!");
    return true;
  } catch (error) {
    console.error("Error fixing gang bank balance column:", error);
    return false;
  }
}

// Execute the migration
fixGangBankBalance();