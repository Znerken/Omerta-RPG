/**
 * Switch between original and Supabase implementations
 * Usage: node switch-to-supabase.js [--original|--supabase]
 */

const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || '--supabase';

// Files to switch
const files = [
  {
    original: 'server/index.ts',
    supabase: 'server/index-supabase.ts',
    target: 'server/index.ts'
  },
  {
    original: 'server/routes.ts',
    supabase: 'server/routes-supabase.ts',
    target: 'server/routes.ts'
  },
  {
    original: 'server/db.ts',
    supabase: 'server/db-supabase.ts',
    target: 'server/db.ts'
  },
  {
    original: 'server/auth.ts',
    supabase: 'server/auth-supabase.ts',
    target: 'server/auth.ts'
  },
  {
    original: 'server/storage.ts',
    supabase: 'server/storage-supabase.ts',
    target: 'server/storage.ts'
  },
  {
    original: 'client/src/App.tsx',
    supabase: 'client/src/App-supabase.tsx',
    target: 'client/src/App.tsx'
  },
  {
    original: 'client/src/main.tsx',
    supabase: 'client/src/main-supabase.tsx',
    target: 'client/src/main.tsx'
  }
];

// Backup original files if they haven't been backed up yet
function backupOriginalFiles() {
  files.forEach(file => {
    const originalPath = file.original;
    const backupPath = `${originalPath}.original`;
    
    if (fs.existsSync(originalPath) && !fs.existsSync(backupPath)) {
      console.log(`Backing up ${originalPath} to ${backupPath}`);
      fs.copyFileSync(originalPath, backupPath);
    }
  });
}

// Switch to desired implementation
function switchImplementation(toOriginal = false) {
  files.forEach(file => {
    const sourcePath = toOriginal ? `${file.original}.original` : file.supabase;
    const targetPath = file.target;
    
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file ${sourcePath} does not exist. Skipping.`);
      return;
    }
    
    console.log(`Copying ${sourcePath} to ${targetPath}`);
    fs.copyFileSync(sourcePath, targetPath);
  });
}

// Add Supabase client environment variables to Vite config
function updateViteConfig(toOriginal = false) {
  const viteConfigPath = 'vite.config.ts';
  
  if (!fs.existsSync(viteConfigPath)) {
    console.error(`${viteConfigPath} not found. Skipping Vite config update.`);
    return;
  }
  
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (toOriginal) {
    // Remove Supabase environment variables if reverting
    viteConfig = viteConfig.replace(
      /\s*VITE_SUPABASE_URL: true,?\n\s*VITE_SUPABASE_ANON_KEY: true,?/g,
      ''
    );
  } else if (!viteConfig.includes('VITE_SUPABASE_URL')) {
    // Add Supabase environment variables if they don't exist
    viteConfig = viteConfig.replace(
      /define: {([^}]*)}/,
      'define: {$1  VITE_SUPABASE_URL: true,\n    VITE_SUPABASE_ANON_KEY: true,\n  }'
    );
  }
  
  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log(`Updated ${viteConfigPath}`);
}

// Main execution
backupOriginalFiles();

if (mode === '--original') {
  console.log('Switching to original implementation...');
  switchImplementation(true);
  updateViteConfig(true);
} else {
  console.log('Switching to Supabase implementation...');
  switchImplementation(false);
  updateViteConfig(false);
}

console.log('Done! Restart your server to apply the changes.');
console.log('If you haven\'t already, be sure to set up the required environment variables.');
console.log('See .env.example for the required variables.');