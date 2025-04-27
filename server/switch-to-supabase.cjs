/**
 * Switch between original and Supabase implementations
 * Usage: node server/switch-to-supabase.cjs [--original|--supabase]
 */

const fs = require('fs');
const path = require('path');

// Configuration for file mappings
const fileMappings = [
  { original: 'server/index.ts', supabase: 'server/index-supabase.ts' },
  { original: 'server/auth.ts', supabase: 'server/auth-supabase.ts' },
  { original: 'server/db.ts', supabase: 'server/db-supabase.ts' },
  { original: 'server/routes.ts', supabase: 'server/routes-supabase.ts' },
  { original: 'server/storage.ts', supabase: 'server/storage-supabase.ts' },
  { original: 'client/src/App.tsx', supabase: 'client/src/App-supabase.tsx' },
  { original: 'client/src/main.tsx', supabase: 'client/src/main-supabase.tsx' },
];

const backupFolder = path.join(__dirname, 'backup');

// Check command line arguments
const args = process.argv.slice(2);
const toOriginal = args.includes('--original');
const toSupabase = args.includes('--supabase') || (!toOriginal && args.length === 0);

if (!fs.existsSync(backupFolder)) {
  fs.mkdirSync(backupFolder, { recursive: true });
}

// Backup original files if they don't exist
function backupOriginalFiles() {
  console.log('Backing up original files...');
  
  for (const mapping of fileMappings) {
    const originalPath = path.join(__dirname, '..', mapping.original);
    const backupPath = path.join(backupFolder, path.basename(mapping.original));
    
    if (fs.existsSync(originalPath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(originalPath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    }
  }
}

// Switch between implementations
function switchImplementation(toOriginal = false) {
  const sourceLabel = toOriginal ? 'Original' : 'Supabase';
  console.log(`Switching to ${sourceLabel} implementation...`);
  
  for (const mapping of fileMappings) {
    const source = toOriginal ? mapping.original : mapping.supabase;
    const target = mapping.original;
    const sourcePath = path.join(__dirname, '..', source);
    const targetPath = path.join(__dirname, '..', target);
    
    // Skip if source doesn't exist
    if (!fs.existsSync(sourcePath)) {
      console.log(`Warning: Source file ${sourcePath} doesn't exist, skipping.`);
      continue;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${source} to ${target}`);
  }
  
  // Update vite.config.ts to use the right server entry point
  updateViteConfig(toOriginal);
  
  console.log(`Successfully switched to ${sourceLabel} implementation!`);
  console.log('Run "npm run dev" to start the server with the new implementation.');
}

// Update vite.config.ts to use the right entry point
function updateViteConfig(toOriginal = false) {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.log(`Warning: vite.config.ts not found at ${viteConfigPath}, skipping.`);
    return;
  }
  
  let content = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Replace the server entry point
  const originalEntryPoint = 'server: { entry: \'./server/index.ts\' }';
  const supabaseEntryPoint = 'server: { entry: \'./server/index-supabase.ts\' }';
  
  const targetEntryPoint = toOriginal ? originalEntryPoint : supabaseEntryPoint;
  const currentEntryPoint = toOriginal ? supabaseEntryPoint : originalEntryPoint;
  
  if (content.includes(currentEntryPoint)) {
    content = content.replace(currentEntryPoint, targetEntryPoint);
    fs.writeFileSync(viteConfigPath, content, 'utf8');
    console.log(`Updated vite.config.ts to use ${toOriginal ? 'original' : 'Supabase'} entry point.`);
  } else if (!content.includes(targetEntryPoint)) {
    console.log(`Warning: Could not find entry point pattern in vite.config.ts.`);
  }
}

// Main execution
try {
  // First backup original files
  backupOriginalFiles();
  
  // Then switch implementation
  switchImplementation(toOriginal);
} catch (error) {
  console.error('Error switching implementations:', error);
  process.exit(1);
}