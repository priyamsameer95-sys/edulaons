-- Drop the broken RLS policy that incorrectly references auth.users
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

-- Create a working policy using JWT claims to access user's email
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt()->>'email')::text
);