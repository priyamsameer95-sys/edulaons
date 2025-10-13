-- Fix RLS recursion between students and leads_new tables

-- Drop problematic recursive policies on students
DROP POLICY IF EXISTS "Partners can only view students for their assigned leads" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

-- Create safe student viewing policy without joins to leads_new
CREATE POLICY "Students can view own record by email"
ON public.students FOR SELECT
USING (email = (auth.jwt()->>'email'));

-- Create safe partner student viewing without recursion
CREATE POLICY "Partners view students directly"
ON public.students FOR SELECT  
USING (
  has_role(auth.uid(), 'partner'::app_role)
  AND id IN (
    SELECT DISTINCT student_id 
    FROM public.leads_new 
    WHERE partner_id = get_user_partner(auth.uid())
  )
);

-- Fix leads_new student policy to avoid recursion
DROP POLICY IF EXISTS "Students can view their own applications" ON public.leads_new;

CREATE POLICY "Students view own leads by email"
ON public.leads_new FOR SELECT
USING (
  student_id = (
    SELECT get_student_id_by_email((auth.jwt()->>'email'))
  )
);