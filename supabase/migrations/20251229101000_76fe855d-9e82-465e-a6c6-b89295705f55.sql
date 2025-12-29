-- Delete orphaned app_users entry for duplicate student account
-- The auth.users record must be deleted manually from Supabase Dashboard > Auth > Users

DELETE FROM app_users 
WHERE id = 'a6f0c7ec-4412-4284-824a-8316449e8ba8' 
  AND email = '+919955240477@student.loan.app';

-- Add a comment documenting what happened
COMMENT ON TABLE app_users IS 'Stores user role and status. Orphaned duplicate +919955240477@student.loan.app was cleaned up on 2025-12-29.';