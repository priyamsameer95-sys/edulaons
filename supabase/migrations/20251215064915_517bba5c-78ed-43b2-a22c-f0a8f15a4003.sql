-- Update handle_new_student_user to check user metadata before creating app_users
-- This prevents the trigger from conflicting with partner/admin creation in edge functions
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create app_users record for students (not partners or admins)
  -- Edge functions set user_metadata.role when creating partners/admins
  -- If no role metadata is set, assume it's a student signup
  IF (NEW.raw_user_meta_data->>'role') IS NULL OR (NEW.raw_user_meta_data->>'role') = 'student' THEN
    INSERT INTO public.app_users (id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'student', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;