-- Fix Nisha's missing app_users record
-- This inserts the app_users record that should have been created during user signup

INSERT INTO public.app_users (id, email, role, is_active, partner_id, created_at, updated_at)
VALUES (
  'd5155926-b04d-4b79-ae23-86d329499039'::uuid,
  'nisha@cashkaro.com',
  'admin'::app_role,
  true,
  NULL,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();