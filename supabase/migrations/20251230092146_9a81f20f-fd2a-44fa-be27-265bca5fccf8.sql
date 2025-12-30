-- Create trigger function for lead status changes to notify partners
CREATE OR REPLACE FUNCTION public.notify_partner_on_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_user RECORD;
  student_name TEXT;
  old_status_text TEXT;
  new_status_text TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify if lead belongs to a partner
  IF NEW.partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT name INTO student_name
  FROM students
  WHERE id = NEW.student_id;

  old_status_text := REPLACE(OLD.status::text, '_', ' ');
  new_status_text := REPLACE(NEW.status::text, '_', ' ');

  -- Notify each partner user associated with this lead's partner
  FOR partner_user IN 
    SELECT au.id 
    FROM app_users au
    INNER JOIN auth.users u ON au.id = u.id
    WHERE au.partner_id = NEW.partner_id
    AND au.role = 'partner'
    AND au.is_active = true
  LOOP
    INSERT INTO notifications (
      user_id, lead_id, notification_type, title, message, metadata
    ) VALUES (
      partner_user.id,
      NEW.id,
      'status_update',
      'Lead Status Updated',
      'Lead ' || NEW.case_id || ' for ' || COALESCE(student_name, 'Unknown') || ' status changed to ' || new_status_text,
      jsonb_build_object(
        'case_id', NEW.case_id,
        'student_name', student_name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead status changes
DROP TRIGGER IF EXISTS trigger_notify_partner_on_status_change ON leads_new;
CREATE TRIGGER trigger_notify_partner_on_status_change
  AFTER UPDATE OF status ON leads_new
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_on_lead_status_change();

-- Create trigger function for document events to notify partners
CREATE OR REPLACE FUNCTION public.notify_partner_on_document_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_user RECORD;
  lead_record RECORD;
  student_name TEXT;
  doc_type_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Get the lead details
  SELECT l.*, s.name as student_name, p.id as partner_id
  INTO lead_record
  FROM leads_new l
  JOIN students s ON s.id = l.student_id
  LEFT JOIN partners p ON p.id = l.partner_id
  WHERE l.id = NEW.lead_id;

  -- Only notify if lead belongs to a partner
  IF lead_record.partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  student_name := lead_record.student_name;

  -- Get document type name
  SELECT name INTO doc_type_name
  FROM document_types
  WHERE id = NEW.document_type_id;

  -- Handle INSERT (document uploaded)
  IF TG_OP = 'INSERT' THEN
    notification_type := 'document_uploaded';
    notification_title := 'Document Uploaded';
    notification_message := COALESCE(doc_type_name, 'Document') || ' uploaded for lead ' || lead_record.case_id;
  -- Handle UPDATE (verification status changed)
  ELSIF TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    IF NEW.verification_status = 'verified' THEN
      notification_type := 'document_verified';
      notification_title := 'Document Verified';
      notification_message := COALESCE(doc_type_name, 'Document') || ' for lead ' || lead_record.case_id || ' has been verified';
    ELSIF NEW.verification_status = 'rejected' THEN
      notification_type := 'document_rejected';
      notification_title := 'Document Rejected';
      notification_message := COALESCE(doc_type_name, 'Document') || ' for lead ' || lead_record.case_id || ' was rejected' || 
        CASE WHEN NEW.verification_notes IS NOT NULL THEN ': ' || NEW.verification_notes ELSE '' END;
    ELSE
      -- Don't notify for other status changes
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Notify each partner user
  FOR partner_user IN 
    SELECT au.id 
    FROM app_users au
    INNER JOIN auth.users u ON au.id = u.id
    WHERE au.partner_id = lead_record.partner_id
    AND au.role = 'partner'
    AND au.is_active = true
  LOOP
    INSERT INTO notifications (
      user_id, lead_id, notification_type, title, message, metadata
    ) VALUES (
      partner_user.id,
      NEW.lead_id,
      notification_type,
      notification_title,
      notification_message,
      jsonb_build_object(
        'case_id', lead_record.case_id,
        'student_name', student_name,
        'document_type', doc_type_name,
        'verification_status', NEW.verification_status
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create triggers for document events
DROP TRIGGER IF EXISTS trigger_notify_partner_on_document_upload ON lead_documents;
CREATE TRIGGER trigger_notify_partner_on_document_upload
  AFTER INSERT ON lead_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_on_document_event();

DROP TRIGGER IF EXISTS trigger_notify_partner_on_document_status_change ON lead_documents;
CREATE TRIGGER trigger_notify_partner_on_document_status_change
  AFTER UPDATE OF verification_status ON lead_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_on_document_event();