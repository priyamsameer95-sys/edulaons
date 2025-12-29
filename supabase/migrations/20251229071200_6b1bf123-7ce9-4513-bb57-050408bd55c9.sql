-- Clean up orphan app_users records that have no matching auth.users entry
-- This prevents login issues for admin/partner accounts

DELETE FROM app_users 
WHERE id NOT IN (SELECT id FROM auth.users)
AND role IN ('admin', 'super_admin', 'partner');

-- Log how many were affected (for audit)
-- Note: The above delete will cascade properly