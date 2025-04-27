/**
 * This script is a simple launcher for the migration process
 * It ensures we have compiled TypeScript before running the migration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to check if a file exists
function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Helper function to run a command and log its output
function runCommand(command, label = '') {
  console.log(`${label ? `[${label}] ` : ''}Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return false;
  }
}

async function main() {
  console.log('OMERTÀ Migration to Supabase');
  console.log('===========================');

  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  // Check if .env file exists
  if (!exists('.env')) {
    console.error('Error: .env file not found');
    console.log('Please create a .env file with the following variables:');
    requiredEnvVars.forEach(variable => console.log(`- ${variable}`));
    process.exit(1);
  }

  // Check for required environment variables
  let missingVars = [];
  requiredEnvVars.forEach(variable => {
    if (!process.env[variable]) {
      try {
        // Try to read from .env file directly
        const envContent = fs.readFileSync('.env', 'utf8');
        const envLines = envContent.split('\n');
        const varLine = envLines.find(line => line.startsWith(`${variable}=`));
        if (!varLine) {
          missingVars.push(variable);
        }
      } catch (error) {
        missingVars.push(variable);
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables:');
    missingVars.forEach(variable => console.log(`- ${variable}`));
    console.log('Please add these variables to your .env file');
    process.exit(1);
  }

  // Compile TypeScript files if needed
  const migrationTsPath = path.join(__dirname, 'migration.ts');
  const migrationJsPath = path.join(__dirname, 'migration.js');

  if (!exists(migrationJsPath) || 
      fs.statSync(migrationTsPath).mtime > fs.statSync(migrationJsPath).mtime) {
    console.log('Compiling TypeScript files...');
    if (!runCommand('npx tsc', 'TypeScript')) {
      console.error('Failed to compile TypeScript files');
      process.exit(1);
    }
  }

  // Run the migration
  console.log('Running migration script...');
  if (!runCommand('node server/migration.js', 'Migration')) {
    console.error('Migration failed');
    process.exit(1);
  }

  console.log('\nMigration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Switch to Supabase implementation:');
  console.log('   $ node switch-to-supabase.js');
  console.log('2. Start the server:');
  console.log('   $ npm run dev');
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});