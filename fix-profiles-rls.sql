-- Fix RLS policies for profiles table
-- This script fixes the row-level security issue

-- First, let's check if the table exists and drop existing policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
    
    -- Recreate the policies with proper permissions
    CREATE POLICY "Users can view their own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert their own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
    
    -- Allow anyone to insert profiles (for the trigger function)
    CREATE POLICY "Allow profile creation" ON profiles
      FOR INSERT WITH CHECK (true);
    
    RAISE NOTICE 'RLS policies updated successfully';
END $$;
