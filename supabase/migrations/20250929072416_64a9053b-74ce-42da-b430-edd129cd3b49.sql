-- Fix admin access and setup proper CashKaro partner
-- Step 1: Restore priyam.sameer@cashkaro.com as admin
UPDATE public.app_users 
SET 
  role = 'admin'::app_role,
  partner_id = NULL,
  is_active = true
WHERE id = '01675fb4-4255-474d-bba7-824956bf3d27'::uuid;

-- Step 2: Update CashKaro partner email to kanika.basra@cashkaro.com
UPDATE public.partners 
SET 
  email = 'kanika.basra@cashkaro.com',
  phone = '9955240477'
WHERE partner_code = 'cashkaro';

-- Step 3: Create app_users record for kanika.basra@cashkaro.com as CashKaro partner
INSERT INTO public.app_users (id, email, role, partner_id, is_active)
VALUES (
  gen_random_uuid(),
  'kanika.basra@cashkaro.com',
  'partner'::app_role,
  (SELECT id FROM public.partners WHERE partner_code = 'cashkaro'),
  true
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id,
  is_active = EXCLUDED.is_active;