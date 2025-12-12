-- Insert into app_users table
INSERT INTO public.app_users (id, email, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bhavya.mittal@cashkaro.com',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET is_active = true, updated_at = now()
RETURNING id;