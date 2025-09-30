-- Fix invalid "/login" data in students and co_applicants tables
-- This addresses the critical data quality issue shown in the screenshot

-- Update invalid student names
UPDATE public.students
SET name = 'Unknown Student'
WHERE name = '/login' OR name LIKE '%/login%' OR name LIKE '/%';

-- Update invalid co-applicant names
UPDATE public.co_applicants
SET name = 'Unknown Co-Applicant'
WHERE name = '/login' OR name LIKE '%/login%' OR name LIKE '/%';

-- Add validation trigger to prevent future invalid names
CREATE OR REPLACE FUNCTION public.validate_person_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent names that look like URLs or paths
  IF NEW.name ~ '^/' OR NEW.name ~ 'login' OR LENGTH(TRIM(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Invalid name: % - Names cannot contain URLs, paths, or be too short', NEW.name;
  END IF;
  
  -- Trim whitespace
  NEW.name = TRIM(NEW.name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to students table
DROP TRIGGER IF EXISTS validate_student_name ON public.students;
CREATE TRIGGER validate_student_name
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_person_name();

-- Apply validation trigger to co_applicants table
DROP TRIGGER IF EXISTS validate_co_applicant_name ON public.co_applicants;
CREATE TRIGGER validate_co_applicant_name
  BEFORE INSERT OR UPDATE ON public.co_applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_person_name();