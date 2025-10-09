-- Allow students to view their own student records
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);