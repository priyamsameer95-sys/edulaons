-- Create CashKaro partner and setup hardcoded access
-- Step 1: Create CashKaro partner
INSERT INTO public.partners (name, partner_code, email, phone, address, is_active)
VALUES (
  'CashKaro',
  'cashkaro', 
  'priyam@cashkaro.com',
  '9955240477',
  'CashKaro Office',
  true
) ON CONFLICT (partner_code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

-- Step 2: Update existing app_users record for priyam@cashkaro.com to be linked to CashKaro partner
UPDATE public.app_users 
SET 
  role = 'partner'::app_role,
  partner_id = (SELECT id FROM public.partners WHERE partner_code = 'cashkaro'),
  is_active = true
WHERE id = '01675fb4-4255-474d-bba7-824956bf3d27'::uuid;

-- Step 3: Update existing leads to be associated with CashKaro partner
UPDATE public.leads_new 
SET partner_id = (SELECT id FROM public.partners WHERE partner_code = 'cashkaro')
WHERE partner_id = (SELECT id FROM public.partners WHERE partner_code = 'study-abroad-consultants');