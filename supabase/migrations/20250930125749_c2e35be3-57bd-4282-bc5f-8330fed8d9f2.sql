-- Fix RLS policies: Change from public to authenticated role
-- This is critical - policies were blocking authenticated users!

-- Drop existing policies
DROP POLICY IF EXISTS "Active partners can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins and super_admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Active partners can insert co-applicants" ON public.co_applicants;
DROP POLICY IF EXISTS "Admins and super_admins can insert co-applicants" ON public.co_applicants;

-- Recreate policies with correct role (authenticated instead of public)
CREATE POLICY "Admins and super_admins can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Active partners can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role = 'partner'
    AND partner_id IS NOT NULL
    AND is_active = true
  )
);

CREATE POLICY "Admins and super_admins can insert co-applicants" 
ON public.co_applicants 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Active partners can insert co-applicants" 
ON public.co_applicants 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role = 'partner'
    AND partner_id IS NOT NULL
    AND is_active = true
  )
);