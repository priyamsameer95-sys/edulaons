-- Create a trigger function to automatically create app_users record for new students
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new record in app_users with student role
  -- Only if an app_users record doesn't already exist for this user
  INSERT INTO public.app_users (id, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'student',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to call the function
DROP TRIGGER IF EXISTS on_auth_user_created_create_student ON auth.users;

CREATE TRIGGER on_auth_user_created_create_student
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();

-- Manually create the app_users record for the existing student user who already signed up
-- User ID from the logs: c34f0f39-64cd-4f8a-bbe1-a3b7cb4cdd52
INSERT INTO public.app_users (id, email, role, is_active)
SELECT 
  id, 
  email, 
  'student', 
  true
FROM auth.users 
WHERE id = 'c34f0f39-64cd-4f8a-bbe1-a3b7cb4cdd52'
ON CONFLICT (id) DO NOTHING;