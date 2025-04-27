/**
 * This script is a simple launcher for the migration process
 * It ensures we have compiled TypeScript before running the migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function exists(filePath) {
  return fs.existsSync(filePath);
}

function runCommand(command, label = '') {
  console.log(`Running ${label || command}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    console.error(`Error running command ${command}: ${error.message}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('Starting migration process');
  
  // Check if we need to compile TypeScript first
  const migrationCompiledPath = path.join(__dirname, 'migration.js');
  
  if (!exists(migrationCompiledPath)) {
    console.log('TypeScript files need to be compiled first');
    
    // Use tsx directly to avoid having to compile TypeScript first
    const { success } = runCommand('npx tsx server/migration.ts', 'migration with tsx');
    
    if (!success) {
      console.error('Migration failed');
      process.exit(1);
    }
  } else {
    // Run the compiled JavaScript file
    const { success } = runCommand('node server/migration.js', 'migration');
    
    if (!success) {
      console.error('Migration failed');
      process.exit(1);
    }
  }
  
  console.log('Migration process completed successfully');
}

main().catch(error => {
  console.error('Migration process failed:', error);
  process.exit(1);
});