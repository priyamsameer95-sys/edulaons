-- Fix data integrity: sync app_users role with active user_roles
-- User riddhi@cashkaro.com has role=partner in app_users but active role=student in user_roles
UPDATE app_users 
SET role = 'student'
WHERE id = '7e3fccb7-04f3-4bda-9387-f53e8a377f80' 
AND role = 'partner';

-- Add a function to validate email uniqueness across all tables (case-insensitive)
CREATE OR REPLACE FUNCTION public.validate_email_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check students table
  IF TG_TABLE_NAME != 'students' THEN
    SELECT COUNT(*) INTO existing_count 
    FROM students 
    WHERE LOWER(email) = LOWER(NEW.email);
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Email already exists in the system';
    END IF;
  END IF;
  
  -- Check partners table
  IF TG_TABLE_NAME != 'partners' THEN
    SELECT COUNT(*) INTO existing_count 
    FROM partners 
    WHERE LOWER(email) = LOWER(NEW.email);
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Email already exists in the system';
    END IF;
  END IF;
  
  -- Check app_users table (for non-student roles only, since students can have matching email)
  IF TG_TABLE_NAME != 'app_users' THEN
    SELECT COUNT(*) INTO existing_count 
    FROM app_users 
    WHERE LOWER(email) = LOWER(NEW.email) AND role NOT IN ('student');
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Email already exists in the system';
    END IF;
  END IF;
  
  -- Check protected_accounts
  SELECT COUNT(*) INTO existing_count 
  FROM protected_accounts 
  WHERE LOWER(email) = LOWER(NEW.email);
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Email is protected and cannot be used';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to partners table for email validation
DROP TRIGGER IF EXISTS validate_partner_email ON partners;
CREATE TRIGGER validate_partner_email
  BEFORE INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION validate_email_uniqueness();

-- Add index for case-insensitive email lookup (performance optimization)
CREATE INDEX IF NOT EXISTS idx_students_email_lower ON students (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_partners_email_lower ON partners (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_app_users_email_lower ON app_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_protected_accounts_email_lower ON protected_accounts (LOWER(email));