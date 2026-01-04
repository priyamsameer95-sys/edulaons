-- First, allow NULL in students.email column
ALTER TABLE public.students ALTER COLUMN email DROP NOT NULL;

-- Clean up synthetic emails from students table
UPDATE public.students
SET email = NULL
WHERE email ILIKE '%@student.loan.app%'
   OR email ILIKE '%@student.placeholder%'
   OR email ILIKE '%@quick.placeholder%'
   OR email ILIKE '%@temp.placeholder%'
   OR email ILIKE '%@lead.%';

-- Update app_users with real emails from students where phone matches
UPDATE public.app_users au
SET email = s.email
FROM public.students s
WHERE s.email IS NOT NULL 
  AND s.email NOT ILIKE '%placeholder%'
  AND s.email NOT ILIKE '%@student.loan.app%'
  AND s.email NOT ILIKE '%@lead.%'
  AND au.email ILIKE '%@student.loan.app%'
  AND s.phone = REPLACE(au.email, '@student.loan.app', '');