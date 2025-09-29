-- Fix the admin user record to match the actual authenticated user ID
-- Delete any existing records for this email to avoid conflicts
DELETE FROM public.app_users WHERE email = 'priyam.sameer@cashkaro.com';

-- Insert the correct admin user record with the actual authenticated user ID
INSERT INTO public.app_users (
  id, 
  email, 
  role, 
  partner_id, 
  is_active
) 
VALUES (
  '01675fb4-4255-474d-bba7-824956bf3d27'::uuid,  -- The actual authenticated user ID
  'priyam.sameer@cashkaro.com',
  'super_admin',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = 'priyam.sameer@cashkaro.com',
  role = 'super_admin',
  is_active = true;