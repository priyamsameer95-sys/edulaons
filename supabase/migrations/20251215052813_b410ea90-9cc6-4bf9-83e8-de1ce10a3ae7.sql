-- Clean up: Remove the student record and associated lead for admin email
-- First delete lead_universities associations
DELETE FROM lead_universities WHERE lead_id = '02e17d8d-5e6c-4248-8fbe-365a204bdc5d';

-- Delete any lead_documents
DELETE FROM lead_documents WHERE lead_id = '02e17d8d-5e6c-4248-8fbe-365a204bdc5d';

-- Delete any lead_status_history
DELETE FROM lead_status_history WHERE lead_id = '02e17d8d-5e6c-4248-8fbe-365a204bdc5d';

-- Delete eligibility_scores
DELETE FROM eligibility_scores WHERE lead_id = '02e17d8d-5e6c-4248-8fbe-365a204bdc5d';

-- Delete the lead
DELETE FROM leads_new WHERE id = '02e17d8d-5e6c-4248-8fbe-365a204bdc5d';

-- Delete co_applicant linked to student
DELETE FROM co_applicants WHERE id IN (
  SELECT co_applicant_id FROM leads_new WHERE student_id = '91ec8862-fcf9-4c18-bd5e-76504b87ac14'
);

-- Delete the student record
DELETE FROM students WHERE id = '91ec8862-fcf9-4c18-bd5e-76504b87ac14';

-- Delete academic tests for the student
DELETE FROM academic_tests WHERE student_id = '91ec8862-fcf9-4c18-bd5e-76504b87ac14';

-- Ensure bhavya.mittal@cashkaro.com has proper admin role in user_roles
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'admin', true, now()
FROM app_users 
WHERE email = 'bhavya.mittal@cashkaro.com'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, revoked_at = NULL;

-- Create a function to check email uniqueness across all entities
CREATE OR REPLACE FUNCTION public.check_email_exists_system_wide(check_email text)
RETURNS TABLE(exists_in text, entity_id uuid, entity_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'students'::text as exists_in, s.id as entity_id, 'student'::text as entity_role
  FROM students s WHERE LOWER(s.email) = LOWER(check_email)
  UNION ALL
  SELECT 'partners'::text, p.id, 'partner'::text
  FROM partners p WHERE LOWER(p.email) = LOWER(check_email)
  UNION ALL
  SELECT 'app_users'::text, au.id, au.role::text
  FROM app_users au WHERE LOWER(au.email) = LOWER(check_email);
END;
$$;

-- Add protected emails list (admin emails that should never be used for students/leads)
INSERT INTO protected_accounts (email, reason, created_by)
VALUES ('bhavya.mittal@cashkaro.com', 'Admin account - cannot be used as student or lead', NULL)
ON CONFLICT (email) DO NOTHING;