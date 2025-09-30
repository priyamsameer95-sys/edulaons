-- Fix RLS policies for students table to allow super_admin and admin to insert
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Partners can insert students" ON public.students;

-- Create new combined policy for admins and super_admins
CREATE POLICY "Admins and super_admins can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

-- Create policy for partners to insert students
CREATE POLICY "Active partners can insert students" 
ON public.students 
FOR INSERT 
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

-- Fix co_applicants policies as well
DROP POLICY IF EXISTS "Admins can insert co-applicants" ON public.co_applicants;
DROP POLICY IF EXISTS "Partners can insert co-applicants" ON public.co_applicants;

-- Create new combined policy for admins and super_admins
CREATE POLICY "Admins and super_admins can insert co-applicants" 
ON public.co_applicants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

-- Create policy for partners to insert co-applicants
CREATE POLICY "Active partners can insert co-applicants" 
ON public.co_applicants 
FOR INSERT 
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