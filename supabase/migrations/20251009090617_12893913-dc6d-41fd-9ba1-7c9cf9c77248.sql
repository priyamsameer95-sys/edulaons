-- Phase 1: Critical Database Fixes (Final)

-- 1. Add 'student' role to app_role enum (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'student') THEN
    ALTER TYPE app_role ADD VALUE 'student';
  END IF;
END $$;

-- 2. Create phone validation function
CREATE OR REPLACE FUNCTION public.validate_phone_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove +91 prefix and clean phone number
  NEW.phone = REGEXP_REPLACE(NEW.phone, '^\+91', '');
  NEW.phone = REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g');
  
  -- Validate phone number is 10 digits
  IF LENGTH(NEW.phone) != 10 THEN
    RAISE EXCEPTION 'Phone number must be exactly 10 digits';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Add phone validation trigger to students table
DROP TRIGGER IF EXISTS validate_student_phone ON public.students;
CREATE TRIGGER validate_student_phone
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.validate_phone_number();

-- 4. Add phone validation trigger to co_applicants table
DROP TRIGGER IF EXISTS validate_co_applicant_phone ON public.co_applicants;
CREATE TRIGGER validate_co_applicant_phone
BEFORE INSERT OR UPDATE ON public.co_applicants
FOR EACH ROW
EXECUTE FUNCTION public.validate_phone_number();

-- 5. Add index for duplicate application prevention
CREATE INDEX IF NOT EXISTS idx_leads_student_intake 
ON public.leads_new(student_id, intake_month, intake_year, study_destination);

-- 6. Add function to check for duplicate applications
CREATE OR REPLACE FUNCTION public.check_duplicate_application(
  _student_id UUID,
  _intake_month INTEGER,
  _intake_year INTEGER,
  _study_destination study_destination_enum
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leads_new
    WHERE student_id = _student_id
      AND intake_month = _intake_month
      AND intake_year = _intake_year
      AND study_destination = _study_destination
      AND status != 'rejected'
  )
$$;