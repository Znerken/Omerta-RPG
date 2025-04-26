-- Script to add supabase_id column to users table
-- This is needed for the Supabase migration

-- Check if the column already exists
DO $$ 
BEGIN
    -- Check if supabase_id column exists in users table
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name = 'supabase_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE users ADD COLUMN supabase_id TEXT UNIQUE;
        RAISE NOTICE 'Added supabase_id column to users table';
    ELSE
        RAISE NOTICE 'supabase_id column already exists in users table';
    END IF;
END $$;