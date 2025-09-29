-- Create hardcoded admin user setup
-- This migration sets up the hardcoded admin user priyam.sameer@cashkaro.com

-- Insert default partner for admin operations if it doesn't exist
INSERT INTO public.partners (name, email, partner_code, is_active) 
VALUES ('Admin Partner', 'admin@system.com', 'admin', true)
ON CONFLICT (partner_code) DO NOTHING;

-- Insert the hardcoded admin user
INSERT INTO public.app_users (
  id, 
  email, 
  role, 
  partner_id, 
  is_active
) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'priyam.sameer@cashkaro.com',
  'super_admin',
  NULL, -- Admin doesn't need a specific partner
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = true;