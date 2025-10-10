-- Phase 1: Database Schema Updates for Multi-Role User Creation & Notifications

-- 1.1 Add first login tracking to app_users
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_app_users_first_login_at 
ON public.app_users(first_login_at) 
WHERE first_login_at IS NOT NULL;

COMMENT ON COLUMN public.app_users.first_login_at IS 'Timestamp when user logged in for the first time. Used to trigger Super Admin notifications for student first logins.';

-- 1.2 Add email invitation tracking to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS email_invite_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_token TEXT;

CREATE INDEX IF NOT EXISTS idx_students_invite_status 
ON public.students(email_invite_sent, invite_sent_at);

COMMENT ON COLUMN public.students.email_invite_sent IS 'Whether invitation email has been sent to student';
COMMENT ON COLUMN public.students.invite_sent_at IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN public.students.invite_token IS 'Temporary token for first-time login verification';

-- 1.3 Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receive_student_first_login BOOLEAN DEFAULT true,
  receive_partner_creation BOOLEAN DEFAULT true,
  receive_lead_updates BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.notification_preferences (user_id, receive_student_first_login)
SELECT id, true 
FROM public.app_users 
WHERE role = 'super_admin' 
ON CONFLICT (user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

-- Phase 4: Database Trigger for First Login Detection

-- 4.1 Create trigger function
CREATE OR REPLACE FUNCTION public.notify_on_student_first_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
  super_admin_record RECORD;
  notification_pref RECORD;
  student_name TEXT;
  student_email TEXT;
BEGIN
  IF NEW.role = 'student' AND OLD.first_login_at IS NULL AND NEW.first_login_at IS NOT NULL THEN
    
    BEGIN
      SELECT s.name, s.email, s.id
      INTO student_record
      FROM students s
      WHERE s.email = NEW.email
      LIMIT 1;
      
      IF FOUND THEN
        student_name := student_record.name;
        student_email := student_record.email;
        
        INSERT INTO application_activities (
          lead_id,
          activity_type,
          description,
          actor_id,
          actor_role,
          actor_name,
          metadata
        )
        SELECT 
          l.id,
          'student_first_login',
          'Student ' || student_name || ' logged in for the first time',
          NEW.id,
          'student',
          student_name,
          jsonb_build_object(
            'student_id', student_record.id,
            'login_time', NEW.first_login_at,
            'email', student_email
          )
        FROM leads_new l
        WHERE l.student_id = student_record.id;
        
        FOR super_admin_record IN 
          SELECT au.id, au.email
          FROM app_users au
          WHERE au.role = 'super_admin' 
            AND au.is_active = true
        LOOP
          SELECT receive_student_first_login, in_app_notifications
          INTO notification_pref
          FROM notification_preferences
          WHERE user_id = super_admin_record.id;
          
          IF NOT FOUND OR (notification_pref.receive_student_first_login AND notification_pref.in_app_notifications) THEN
            INSERT INTO notifications (
              user_id,
              notification_type,
              title,
              message,
              metadata,
              action_url
            )
            SELECT 
              super_admin_record.id,
              'student_first_login',
              'New Student First Login',
              'Student ' || student_name || ' (' || student_email || ') has logged in for the first time',
              jsonb_build_object(
                'student_id', student_record.id,
                'student_name', student_name,
                'student_email', student_email,
                'login_time', NEW.first_login_at
              ),
              '/admin?tab=leads&student=' || student_record.id
            FROM leads_new l
            WHERE l.student_id = student_record.id
            LIMIT 1;
          END IF;
        END LOOP;
        
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error in notify_on_student_first_login: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_student_first_login ON public.app_users;
CREATE TRIGGER on_student_first_login
  AFTER UPDATE OF first_login_at
  ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_student_first_login();

COMMENT ON FUNCTION public.notify_on_student_first_login() IS 'Notifies Super Admins when a student logs in for the first time';