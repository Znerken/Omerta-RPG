import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Create Supabase client with server-side admin privileges
// Note: This uses the service role key which has full admin access,
// so it should never be exposed to the client
export const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create system buckets for file storage
export async function createStorageBuckets() {
  try {
    // Create avatars bucket
    const { data: avatarBucketData, error: avatarBucketError } = await supabaseClient.storage.createBucket(
      'avatars',
      {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      }
    );
    
    if (avatarBucketError) {
      if (avatarBucketError.message.includes('already exists')) {
        console.log('Avatars bucket already exists');
      } else {
        console.error('Error creating avatars bucket:', avatarBucketError);
      }
    } else {
      console.log('Avatars bucket created successfully:', avatarBucketData);
    }
    
    // Create gang logos bucket
    const { data: gangLogosBucketData, error: gangLogosBucketError } = await supabaseClient.storage.createBucket(
      'gang-logos',
      {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      }
    );
    
    if (gangLogosBucketError) {
      if (gangLogosBucketError.message.includes('already exists')) {
        console.log('Gang logos bucket already exists');
      } else {
        console.error('Error creating gang logos bucket:', gangLogosBucketError);
      }
    } else {
      console.log('Gang logos bucket created successfully:', gangLogosBucketData);
    }
    
    // Create banners bucket
    const { data: bannersBucketData, error: bannersBucketError } = await supabaseClient.storage.createBucket(
      'banners',
      {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      }
    );
    
    if (bannersBucketError) {
      if (bannersBucketError.message.includes('already exists')) {
        console.log('Banners bucket already exists');
      } else {
        console.error('Error creating banners bucket:', bannersBucketError);
      }
    } else {
      console.log('Banners bucket created successfully:', bannersBucketData);
    }
    
    // Create items bucket
    const { data: itemsBucketData, error: itemsBucketError } = await supabaseClient.storage.createBucket(
      'items',
      {
        public: true,
        fileSizeLimit: 1024 * 1024 * 1, // 1MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      }
    );
    
    if (itemsBucketError) {
      if (itemsBucketError.message.includes('already exists')) {
        console.log('Items bucket already exists');
      } else {
        console.error('Error creating items bucket:', itemsBucketError);
      }
    } else {
      console.log('Items bucket created successfully:', itemsBucketData);
    }
    
    console.log('Storage buckets initialized');
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
}

// Initialize Supabase (call this during server startup)
export async function initializeSupabase() {
  try {
    // Create storage buckets
    await createStorageBuckets();
    
    console.log('Supabase initialized successfully');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}