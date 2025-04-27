/**
 * Switch to the clean Supabase implementation
 * Usage: node switch-to-clean-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Files to replace with clean versions
const filesToReplace = [
  { from: 'server/auth-supabase-clean.ts', to: 'server/auth-supabase.ts' },
  { from: 'server/storage-supabase-clean.ts', to: 'server/storage-supabase.ts' },
  { from: 'server/routes-supabase-clean.ts', to: 'server/routes-supabase.ts' },
  { from: 'server/index-supabase-clean.ts', to: 'server/index-supabase.ts' },
  { from: 'server/websocket-supabase-clean.ts', to: 'server/websocket-supabase.ts' }
];

// Update package.json to use the clean implementation
function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update scripts to use index-supabase.ts
  packageJson.scripts.dev = 'NODE_ENV=development tsx server/index-supabase.ts';
  packageJson.scripts.start = 'NODE_ENV=production tsx server/index-supabase.ts';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json to use clean Supabase implementation');
}

// Copy files
function copyFiles() {
  for (const file of filesToReplace) {
    const fromPath = path.join(process.cwd(), file.from);
    const toPath = path.join(process.cwd(), file.to);

    // Check if source file exists
    if (!fs.existsSync(fromPath)) {
      console.error(`Source file ${file.from} does not exist!`);
      continue;
    }

    // Backup existing file if it exists
    if (fs.existsSync(toPath)) {
      const backupPath = `${toPath}.bak`;
      fs.copyFileSync(toPath, backupPath);
      console.log(`Backed up ${file.to} to ${file.to}.bak`);
    }

    // Copy the file
    fs.copyFileSync(fromPath, toPath);
    console.log(`Copied ${file.from} to ${file.to}`);
  }
}

// Main function
function switchToCleanImplementation() {
  console.log('Switching to clean Supabase implementation...');
  
  try {
    copyFiles();
    updatePackageJson();
    
    console.log('\nSwitched to clean Supabase implementation successfully!');
    console.log('To run the server, use:');
    console.log('  npm run dev');
  } catch (error) {
    console.error('Error switching to clean implementation:', error);
  }
}

// Run the script
switchToCleanImplementation();