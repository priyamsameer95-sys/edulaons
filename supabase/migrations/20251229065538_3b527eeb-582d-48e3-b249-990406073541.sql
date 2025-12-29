-- Fix notify_admins_on_lead_creation to only notify users with valid auth.users entries
CREATE OR REPLACE FUNCTION public.notify_admins_on_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  student_name TEXT;
  partner_name TEXT;
BEGIN
  -- Get student name
  SELECT name INTO student_name
  FROM students
  WHERE id = NEW.student_id;

  -- Get partner name if exists
  IF NEW.partner_id IS NOT NULL THEN
    SELECT name INTO partner_name
    FROM partners
    WHERE id = NEW.partner_id;
  END IF;

  -- Create notification for each admin ONLY if they have a valid auth.users entry
  FOR admin_user IN 
    SELECT au.id 
    FROM app_users au
    INNER JOIN auth.users u ON au.id = u.id  -- Only users with valid auth entries
    WHERE au.role IN ('admin', 'super_admin') 
    AND au.is_active = true
  LOOP
    INSERT INTO notifications (
      user_id,
      lead_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      admin_user.id,
      NEW.id,
      'lead_created',
      'New Lead Created',
      'Lead ' || NEW.case_id || ' created for ' || COALESCE(student_name, 'Unknown') || 
        CASE WHEN partner_name IS NOT NULL THEN ' via ' || partner_name ELSE '' END,
      jsonb_build_object(
        'case_id', NEW.case_id,
        'student_name', student_name,
        'partner_name', partner_name,
        'loan_amount', NEW.loan_amount,
        'source', NEW.source
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;