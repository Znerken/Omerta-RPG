// Script to switch between original and Supabase implementations
// This creates symbolic links to the correct implementation files

import fs from 'fs';
import path from 'path';

// Define implementation types
const ORIGINAL = 'original';
const SUPABASE = 'supabase';

// Configuration for files to switch
const filesToSwitch = [
  {
    target: 'index.ts',
    original: 'index.ts',
    supabase: 'index-supabase.ts',
  },
  {
    target: 'auth.ts',
    original: 'auth.ts',
    supabase: 'auth-supabase.ts',
  },
  {
    target: 'routes.ts',
    original: 'routes.ts',
    supabase: 'routes-supabase.ts',
  },
  {
    target: 'storage.ts',
    original: 'storage.ts',
    supabase: 'storage-supabase.ts',
  },
  {
    target: 'db.ts',
    original: 'db.ts',
    supabase: 'db-supabase.ts',
  },
];

// Client-side files to switch
const clientFilesToSwitch = [
  {
    target: '../client/src/App.tsx',
    original: '../client/src/App.tsx',
    supabase: '../client/src/App-supabase.tsx',
  },
  {
    target: '../client/src/main.tsx',
    original: '../client/src/main.tsx',
    supabase: '../client/src/main-supabase.tsx',
  },
];

/**
 * Switch implementation between original and Supabase
 * @param {string} implementation ORIGINAL or SUPABASE
 */
function switchImplementation(implementation) {
  console.log(`Switching to ${implementation} implementation...`);

  // Validate implementation
  if (implementation !== ORIGINAL && implementation !== SUPABASE) {
    console.error(`Invalid implementation: ${implementation}`);
    console.error(`Valid options are: ${ORIGINAL} or ${SUPABASE}`);
    process.exit(1);
  }

  // Switch server files
  switchServerFiles(implementation);
  
  // Switch client files
  switchClientFiles(implementation);

  console.log(`Successfully switched to ${implementation} implementation.`);
  
  // Print restart instructions
  console.log('');
  console.log('Please restart the application to apply changes:');
  console.log('- Stop the current process');
  console.log('- Run: npm run dev');
}

/**
 * Switch server-side implementation files
 * @param {string} implementation ORIGINAL or SUPABASE
 */
function switchServerFiles(implementation) {
  for (const file of filesToSwitch) {
    const targetPath = path.join(process.cwd(), file.target);
    const sourcePath = path.join(
      process.cwd(),
      implementation === ORIGINAL ? file.original : file.supabase
    );

    // Skip if source file doesn't exist
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Source file not found: ${sourcePath}. Skipping.`);
      continue;
    }

    try {
      // Remove existing file if it's a symbolic link
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          // If it's a real file, back it up
          const backupPath = `${targetPath}.bak`;
          fs.renameSync(targetPath, backupPath);
          console.log(`Backed up ${targetPath} to ${backupPath}`);
        }
      }

      // Create symbolic link
      fs.symlinkSync(path.basename(sourcePath), targetPath);
      console.log(`Linked ${sourcePath} to ${targetPath}`);
    } catch (error) {
      console.error(`Error switching ${file.target}:`, error);
    }
  }
}

/**
 * Switch client-side implementation files
 * @param {string} implementation ORIGINAL or SUPABASE
 */
function switchClientFiles(implementation) {
  for (const file of clientFilesToSwitch) {
    const targetPath = path.join(process.cwd(), file.target);
    const sourcePath = path.join(
      process.cwd(),
      implementation === ORIGINAL ? file.original : file.supabase
    );

    // Skip if source file doesn't exist
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Source file not found: ${sourcePath}. Skipping.`);
      continue;
    }

    try {
      // Remove existing file if it's a symbolic link
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          // If it's a real file, back it up
          const backupPath = `${targetPath}.bak`;
          fs.renameSync(targetPath, backupPath);
          console.log(`Backed up ${targetPath} to ${backupPath}`);
        }
      }

      // Create symbolic link
      fs.symlinkSync(path.basename(sourcePath), targetPath);
      console.log(`Linked ${sourcePath} to ${targetPath}`);
    } catch (error) {
      console.error(`Error switching ${file.target}:`, error);
    }
  }
}

// Get implementation from command line arguments
const implementation = process.argv[2]?.toLowerCase();

if (!implementation) {
  console.error('Please specify an implementation: original or supabase');
  console.error('Usage: node server/supabase-switch.js <implementation>');
  process.exit(1);
}

// Run the switch
switchImplementation(implementation);