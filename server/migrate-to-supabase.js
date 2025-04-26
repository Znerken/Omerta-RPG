#!/usr/bin/env node

/**
 * This script is a simple launcher for the migration process
 * It ensures we have compiled TypeScript before running the migration
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to check if a path exists
function exists(filePath) {
  return fs.existsSync(filePath);
}

// Directory where build files are stored
const buildDir = path.join(__dirname, '..', 'build');

// Path to the compiled migration script
const migrationScript = path.join(buildDir, 'server', 'migration.js');

// Function to run a command and display its output
function runCommand(command, label = '') {
  console.log(`\n> ${label || command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Check if we need to build TypeScript files
if (!exists(migrationScript)) {
  console.log('Compiled migration script not found, building TypeScript files...');
  
  // Check if tsc is available
  try {
    execSync('npx tsc --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('TypeScript compiler not found. Please install it with:');
    console.error('npm install -g typescript');
    process.exit(1);
  }
  
  // Compile TypeScript files
  if (!runCommand('npx tsc', 'Compiling TypeScript files')) {
    console.error('Failed to compile TypeScript files');
    process.exit(1);
  }
}

// Ensure the compiled script exists
if (!exists(migrationScript)) {
  console.error(`Migration script not found at: ${migrationScript}`);
  console.error('Make sure TypeScript compilation is working correctly');
  process.exit(1);
}

console.log('\n=======================================');
console.log('Starting Supabase migration process...');
console.log('=======================================\n');

// Run the migration script
if (!runCommand(`node ${migrationScript}`, 'Running migration script')) {
  console.error('Migration failed');
  process.exit(1);
}

console.log('\n=======================================');
console.log('Migration completed successfully!');
console.log('=======================================\n');