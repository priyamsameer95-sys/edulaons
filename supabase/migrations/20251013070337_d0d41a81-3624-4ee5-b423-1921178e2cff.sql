-- Phase 2: Create app_users record for student and add trigger for future students

-- Step 1: Create app_users record for the existing student user
INSERT INTO public.app_users (id, email, role, is_active)
VALUES (
  'c34f0f39-64cd-4f8a-bbe1-a3b7cb4cdd52',
  'priyam.sameer.khet@gmail.com',
  'student',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'student', is_active = true;

-- Step 2: Create trigger to automatically create app_users for new auth users who are students
DROP TRIGGER IF EXISTS on_auth_user_created_create_student_app_user ON auth.users;

CREATE TRIGGER on_auth_user_created_create_student_app_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();

-- Step 3: Ensure any existing auth users who are students but don't have app_users records get them
INSERT INTO public.app_users (id, email, role, is_active)
SELECT 
  au.id,
  au.email,
  'student'::app_role,
  true
FROM auth.users au
INNER JOIN public.students s ON s.email = au.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_users apu WHERE apu.id = au.id
)
ON CONFLICT (id) DO NOTHING;