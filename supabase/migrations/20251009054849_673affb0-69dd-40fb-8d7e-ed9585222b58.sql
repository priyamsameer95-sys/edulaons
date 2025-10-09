-- Phase 1: CRITICAL - Allow students to view their own applications
CREATE POLICY "Students can view their own applications"
ON public.leads_new
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE email = (auth.jwt()->>'email')::text
  )
);

-- Phase 2: Related Data Access - Students can view their co-applicant details
CREATE POLICY "Students can view their co-applicant"
ON public.co_applicants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT co_applicant_id FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt()->>'email')::text
  )
);

-- Students can view their universities
CREATE POLICY "Students can view their application universities"
ON public.lead_universities
FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT l.id FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt()->>'email')::text
  )
);

-- Students can view their test scores
CREATE POLICY "Students can view their own test scores"
ON public.academic_tests
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students
    WHERE email = (auth.jwt()->>'email')::text
  )
);

-- Phase 4: Document Access - Students can view their own documents
CREATE POLICY "Students can view their own documents"
ON public.lead_documents
FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT l.id FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt()->>'email')::text
  )
);

-- Students can upload their own documents
CREATE POLICY "Students can upload their own documents"
ON public.lead_documents
FOR INSERT
TO authenticated
WITH CHECK (
  lead_id IN (
    SELECT l.id FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt()->>'email')::text
  )
);