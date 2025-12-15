-- Clean up orphaned app_users record from failed partner creation attempt
DELETE FROM public.app_users 
WHERE email = 'londonstdunit@hotmail.com' 
  AND id = '79def597-132b-4a03-818d-72f9b05c6df5';

-- Also clean up any orphaned partner record if it exists
DELETE FROM public.partners 
WHERE email = 'londonstdunit@hotmail.com' 
  AND id NOT IN (
    SELECT partner_id FROM app_users WHERE partner_id IS NOT NULL
  );