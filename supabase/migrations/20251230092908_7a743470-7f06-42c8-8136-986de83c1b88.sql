-- Create trigger function to notify partner when a lead is created for them
CREATE OR REPLACE FUNCTION public.notify_partner_on_lead_created()
RETURNS TRIGGER AS $$
DECLARE
  partner_user RECORD;
  student_name TEXT;
  partner_name TEXT;
BEGIN
  -- Only notify if lead belongs to a partner
  IF NEW.partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT name INTO student_name
  FROM students
  WHERE id = NEW.student_id;

  -- Get partner name
  SELECT name INTO partner_name
  FROM partners
  WHERE id = NEW.partner_id;

  -- Notify each partner user associated with this lead's partner
  FOR partner_user IN 
    SELECT au.id 
    FROM app_users au
    WHERE au.partner_id = NEW.partner_id
    AND au.role = 'partner'
    AND au.is_active = true
  LOOP
    INSERT INTO notifications (
      user_id, lead_id, notification_type, title, message, metadata
    ) VALUES (
      partner_user.id,
      NEW.id,
      'lead_created',
      'New Lead Created',
      NEW.case_id || ' - ' || COALESCE(student_name, 'Unknown Student'),
      jsonb_build_object(
        'case_id', NEW.case_id,
        'student_name', student_name,
        'loan_amount', NEW.loan_amount,
        'source', COALESCE(NEW.source, 'manual')
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on leads_new for partner lead creation notification
DROP TRIGGER IF EXISTS trigger_notify_partner_on_lead_created ON leads_new;
CREATE TRIGGER trigger_notify_partner_on_lead_created
  AFTER INSERT ON leads_new
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_on_lead_created();