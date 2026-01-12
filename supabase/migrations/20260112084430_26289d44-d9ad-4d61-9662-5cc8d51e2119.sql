-- Add state column to co_applicants
ALTER TABLE co_applicants ADD COLUMN IF NOT EXISTS state TEXT;

-- Clean up corrupted PIN data (state names stored as PIN)
UPDATE co_applicants 
SET state = pin_code, pin_code = '000000'
WHERE pin_code IS NOT NULL 
  AND pin_code NOT SIMILAR TO '[0-9]{6}';

-- Add comment
COMMENT ON COLUMN co_applicants.state IS 'Co-applicant state/UT of residence';

-- Fix audit log RLS to allow admin access (not just super_admin)
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON user_management_logs;

CREATE POLICY "Admins can view all audit logs" ON user_management_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);