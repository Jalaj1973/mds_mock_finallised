-- Fix the RLS policies for profiles table
-- The issue is that the policies reference 'user_id' but the profiles table uses 'id'

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

-- Create correct policies using 'id' instead of 'user_id'
-- Allow everyone to read profiles
CREATE POLICY "Allow public read access to profiles"
ON profiles
FOR SELECT
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- Also add a policy to allow profile creation (for the trigger function)
CREATE POLICY "Allow profile creation for new users"
ON profiles
FOR INSERT
WITH CHECK (true);
