-- Fix infinite recursion in students RLS policies
-- Create a security definer function to get student ID by email without triggering RLS
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.students
  WHERE email = _email
  LIMIT 1
$$;

-- Drop the problematic policy on leads_new
DROP POLICY IF EXISTS "Students can view their own applications" ON public.leads_new;

-- Recreate it using the security definer function to avoid circular reference
CREATE POLICY "Students can view their own applications"
ON public.leads_new
FOR SELECT
USING (
  student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
);