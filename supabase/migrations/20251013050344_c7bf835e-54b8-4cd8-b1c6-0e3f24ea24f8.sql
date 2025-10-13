-- Phase 1: Add 'student' role to app_role enum and fix RLS policies for students

-- Step 1: Add 'student' to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- Step 2: Update RLS policy on leads_new to allow students to view their applications
-- Drop the existing restrictive policy and create a better one
DROP POLICY IF EXISTS "Students can view their own applications" ON public.leads_new;

CREATE POLICY "Students can view their own applications"
ON public.leads_new
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id 
    FROM students s
    WHERE s.email = (auth.jwt() ->> 'email')
  )
);

-- Step 3: Ensure students can view related data through joins
-- Update students table policy to be more permissive for joins
DROP POLICY IF EXISTS "students_view_own" ON public.students;

CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'partner'::app_role) AND EXISTS (
    SELECT 1 FROM leads_new ln
    JOIN app_users au ON au.partner_id = ln.partner_id
    WHERE ln.student_id = students.id AND au.id = auth.uid()
  ))
);

-- Step 4: Ensure lead_universities can be accessed by students
DROP POLICY IF EXISTS "Students can view their application universities" ON public.lead_universities;

CREATE POLICY "Students can view their application universities"
ON public.lead_universities
FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT l.id FROM leads_new l
    JOIN students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt() ->> 'email')
  )
);

-- Step 5: Create a helper function to check if user is a student
CREATE OR REPLACE FUNCTION public.is_student_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Step 6: Add comment for clarity
COMMENT ON FUNCTION public.is_student_user IS 'Check if the current authenticated user is a student based on their email';
