-- ===========================================
-- PHONE-BASED IDENTITY FOR STUDENT RLS
-- ===========================================

-- 1) Update get_student_id_by_email to support OTP/phone identity
-- If email ends with @student.loan.app, extract phone and find by phone
-- Otherwise fall back to email matching
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_digits text;
  student_uuid uuid;
BEGIN
  -- Check if this is a synthetic OTP email (e.g., 7867869999@student.loan.app)
  IF _email LIKE '%@student.loan.app' THEN
    -- Extract phone digits from email (last 10 digits before @)
    phone_digits := substring(_email from '(\d{10})@student\.loan\.app$');
    
    IF phone_digits IS NOT NULL THEN
      SELECT id INTO student_uuid 
      FROM public.students 
      WHERE phone = phone_digits 
      LIMIT 1;
      
      IF student_uuid IS NOT NULL THEN
        RETURN student_uuid;
      END IF;
    END IF;
  END IF;
  
  -- Fallback: try matching by email
  SELECT id INTO student_uuid
  FROM public.students
  WHERE email = _email
  LIMIT 1;
  
  RETURN student_uuid;
END;
$$;

-- 2) Update students RLS policy
DROP POLICY IF EXISTS "Students can view own record by email" ON students;

CREATE POLICY "Students can view own record"
ON students FOR SELECT
TO public
USING (
  id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
);

-- Add UPDATE policy for students
DROP POLICY IF EXISTS "Students can update own record" ON students;

CREATE POLICY "Students can update own record"
ON students FOR UPDATE
TO authenticated
USING (id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text))
WITH CHECK (id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text));

-- 3) Update leads_new RLS policy for students
DROP POLICY IF EXISTS "Students view own leads by email" ON leads_new;

CREATE POLICY "Students view own leads"
ON leads_new FOR SELECT
TO public
USING (
  student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
);

-- 4) Update academic_tests RLS policy
DROP POLICY IF EXISTS "Students can view their own test scores" ON academic_tests;

CREATE POLICY "Students can view their own test scores"
ON academic_tests FOR SELECT
TO public
USING (
  student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
);

-- 5) Update co_applicants RLS policy for students
DROP POLICY IF EXISTS "Students can view their co-applicant" ON co_applicants;

CREATE POLICY "Students can view their co-applicant"
ON co_applicants FOR SELECT
TO public
USING (
  id IN (
    SELECT co_applicant_id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 6) Update lead_courses RLS policy
DROP POLICY IF EXISTS "Students can view their lead_courses" ON lead_courses;

CREATE POLICY "Students can view their lead_courses"
ON lead_courses FOR SELECT
TO public
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 7) Update lead_documents RLS policies
DROP POLICY IF EXISTS "Students can view their own documents" ON lead_documents;

CREATE POLICY "Students can view their own documents"
ON lead_documents FOR SELECT
TO public
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

DROP POLICY IF EXISTS "Students can upload their own documents" ON lead_documents;

CREATE POLICY "Students can upload their own documents"
ON lead_documents FOR INSERT
TO authenticated
WITH CHECK (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 8) Update lead_universities RLS policy
DROP POLICY IF EXISTS "Students can view their application universities" ON lead_universities;

CREATE POLICY "Students can view their application universities"
ON lead_universities FOR SELECT
TO public
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 9) Update student_clarifications RLS policies
DROP POLICY IF EXISTS "Students can view their own clarifications" ON student_clarifications;

CREATE POLICY "Students can view their own clarifications"
ON student_clarifications FOR SELECT
TO public
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

DROP POLICY IF EXISTS "Students can respond to their own clarifications" ON student_clarifications;

CREATE POLICY "Students can respond to their own clarifications"
ON student_clarifications FOR UPDATE
TO authenticated
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
)
WITH CHECK (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 10) Update application_activities RLS policy for students
DROP POLICY IF EXISTS "Students can view activities for their applications" ON application_activities;

CREATE POLICY "Students can view activities for their applications"
ON application_activities FOR SELECT
TO public
USING (
  lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);

-- 11) Update application_comments RLS policy for students
DROP POLICY IF EXISTS "Students can view public comments on their applications" ON application_comments;

CREATE POLICY "Students can view public comments on their applications"
ON application_comments FOR SELECT
TO public
USING (
  is_internal = false
  AND lead_id IN (
    SELECT id FROM leads_new
    WHERE student_id = public.get_student_id_by_email((auth.jwt() ->> 'email')::text)
  )
);