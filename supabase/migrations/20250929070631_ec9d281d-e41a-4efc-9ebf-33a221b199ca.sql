-- Fix infinite recursion in RLS policies for app_users table
-- Drop existing recursive policies that cause infinite loops
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update users" ON public.app_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.app_users;

-- Create simple, non-recursive RLS policies
-- Users can always view their own record
CREATE POLICY "Users can view own record" ON public.app_users
FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON public.app_users
FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow hardcoded admin to be inserted/updated (specific UUID)
CREATE POLICY "Allow hardcoded admin operations" ON public.app_users
FOR ALL USING (
  id = '00000000-0000-0000-0000-000000000001'::uuid OR 
  auth.uid()::text = id::text
);

-- Create a simple function to check if current user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin') 
    AND is_active = true
  )
$$;

-- Allow admins to view all records (using the new function)
CREATE POLICY "Admins can view all records" ON public.app_users
FOR SELECT USING (is_current_user_admin() OR auth.uid()::text = id::text);

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON public.app_users
FOR INSERT WITH CHECK (is_current_user_admin());

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON public.app_users
FOR UPDATE USING (is_current_user_admin() OR auth.uid()::text = id::text);