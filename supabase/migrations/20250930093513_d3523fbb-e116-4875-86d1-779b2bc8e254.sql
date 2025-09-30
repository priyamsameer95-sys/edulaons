-- =====================================================
-- EMERGENCY SECURITY LOCKDOWN - PHASE 1
-- Removing public access and implementing role-based access
-- CRITICAL: This secures student PII, financial data, and business information
-- =====================================================

-- 1. STUDENTS TABLE - Remove public access, implement partner isolation
DROP POLICY IF EXISTS "Students are viewable by everyone for now" ON public.students;
DROP POLICY IF EXISTS "Students can be inserted by everyone for now" ON public.students;
DROP POLICY IF EXISTS "Students can be updated by everyone for now" ON public.students;

-- Admins can view all students
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can only view students associated with their leads
CREATE POLICY "Partners can view their own students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.student_id = students.id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Admins can insert students
CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can insert students (for their leads)
CREATE POLICY "Partners can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_partner(auth.uid()) IS NOT NULL
);

-- Admins can update students
CREATE POLICY "Admins can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can update their own students
CREATE POLICY "Partners can update their own students"
ON public.students
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.student_id = students.id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- 2. CO-APPLICANTS TABLE - Secure financial data (salaries up to ₹24L exposed)
DROP POLICY IF EXISTS "Co-applicants are viewable by everyone for now" ON public.co_applicants;
DROP POLICY IF EXISTS "Co-applicants can be inserted by everyone for now" ON public.co_applicants;
DROP POLICY IF EXISTS "Co-applicants can be updated by everyone for now" ON public.co_applicants;

-- Admins can view all co-applicants
CREATE POLICY "Admins can view all co-applicants"
ON public.co_applicants
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can only view co-applicants associated with their leads
CREATE POLICY "Partners can view their own co-applicants"
ON public.co_applicants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.co_applicant_id = co_applicants.id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Admins can insert co-applicants
CREATE POLICY "Admins can insert co-applicants"
ON public.co_applicants
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can insert co-applicants (for their leads)
CREATE POLICY "Partners can insert co-applicants"
ON public.co_applicants
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_partner(auth.uid()) IS NOT NULL
);

-- Admins can update co-applicants
CREATE POLICY "Admins can update co-applicants"
ON public.co_applicants
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can update their own co-applicants
CREATE POLICY "Partners can update their own co-applicants"
ON public.co_applicants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.co_applicant_id = co_applicants.id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- 3. ACADEMIC TESTS TABLE - Secure test scores
DROP POLICY IF EXISTS "Academic tests are viewable by everyone for now" ON public.academic_tests;
DROP POLICY IF EXISTS "Academic tests can be inserted by everyone for now" ON public.academic_tests;
DROP POLICY IF EXISTS "Academic tests can be updated by everyone for now" ON public.academic_tests;

-- Admins can view all academic tests
CREATE POLICY "Admins can view all academic tests"
ON public.academic_tests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can only view tests for their students
CREATE POLICY "Partners can view their students' tests"
ON public.academic_tests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.student_id = academic_tests.student_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Admins can insert academic tests
CREATE POLICY "Admins can insert academic tests"
ON public.academic_tests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can insert tests for their students
CREATE POLICY "Partners can insert tests for their students"
ON public.academic_tests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.student_id = academic_tests.student_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Admins can update academic tests
CREATE POLICY "Admins can update academic tests"
ON public.academic_tests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can update their students' tests
CREATE POLICY "Partners can update their students' tests"
ON public.academic_tests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.student_id = academic_tests.student_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- 4. LEAD_UNIVERSITIES TABLE - Secure lead-university associations
DROP POLICY IF EXISTS "Lead universities are viewable by everyone for now" ON public.lead_universities;

-- Admins can view all lead-university associations
CREATE POLICY "Admins can view all lead universities"
ON public.lead_universities
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can only view associations for their leads
CREATE POLICY "Partners can view their lead universities"
ON public.lead_universities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = lead_universities.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Admins can manage lead-university associations
CREATE POLICY "Admins can insert lead universities"
ON public.lead_universities
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Partners can insert for their leads
CREATE POLICY "Partners can insert their lead universities"
ON public.lead_universities
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = lead_universities.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

CREATE POLICY "Admins can update lead universities"
ON public.lead_universities
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Partners can update their lead universities"
ON public.lead_universities
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = lead_universities.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

CREATE POLICY "Admins can delete lead universities"
ON public.lead_universities
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Partners can delete their lead universities"
ON public.lead_universities
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = lead_universities.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- 5. OLD LEADS TABLE - Lock it down (should be migrated away from)
DROP POLICY IF EXISTS "Leads are viewable by everyone for now" ON public.leads;

-- Only admins can access old leads
CREATE POLICY "Only admins can access old leads"
ON public.leads
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- 6. PARTNERS TABLE - Restrict updates to admins only
DROP POLICY IF EXISTS "Partners can be updated by everyone for now" ON public.partners;

-- Keep public read for active partners (needed for public partner pages)
-- But restrict updates to admins only
CREATE POLICY "Admins can update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- 7. LENDERS TABLE - Keep public read, restrict write to admins
DROP POLICY IF EXISTS "Lenders can be inserted by everyone for now" ON public.lenders;

CREATE POLICY "Admins can insert lenders"
ON public.lenders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can update lenders"
ON public.lenders
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can delete lenders"
ON public.lenders
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);