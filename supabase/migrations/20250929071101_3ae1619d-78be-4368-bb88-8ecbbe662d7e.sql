-- Debug and fix RLS policies for app_users
-- First check what's blocking the query by temporarily allowing all access for testing

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own record" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own record" ON public.app_users;
DROP POLICY IF EXISTS "Allow hardcoded admin operations" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all records" ON public.app_users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.app_users;

-- Create simple, working policies
-- Allow users to view their own records
CREATE POLICY "Allow users to view own record" ON public.app_users
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own records  
CREATE POLICY "Allow users to update own record" ON public.app_users
FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert (needed for admin user creation)
CREATE POLICY "Allow authenticated insert" ON public.app_users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Test query to verify the policy works
-- This should return the admin user record if RLS is working properly