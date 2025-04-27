/**
 * Run the migration script from PostgreSQL to Supabase
 * This script will:
 * 1. Check if TypeScript is compiled
 * 2. Execute the migration
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runMigration() {
  console.log('Starting Postgres to Supabase migration...');
  
  try {
    // Check if we need to compile TypeScript first
    const migrationTsPath = path.join(__dirname, 'migration.ts');
    const migrationJsPath = path.join(__dirname, 'migration.js');
    
    if (!fs.existsSync(migrationJsPath) || 
        fs.statSync(migrationTsPath).mtime > fs.statSync(migrationJsPath).mtime) {
      console.log('Compiling TypeScript files...');
      await runCommand('npx tsc');
    }
    
    // Run the migration
    console.log('Executing migration script...');
    await runCommand('node server/migration.js');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      console.log(stdout);
      resolve(stdout);
    });
    
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

// Run the migration
runMigration().catch(console.error);