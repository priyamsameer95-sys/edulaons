-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications to realtime publication (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Function to notify all admins when a document is uploaded
CREATE OR REPLACE FUNCTION notify_admins_on_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  student_name TEXT;
  doc_type_name TEXT;
  case_id_val TEXT;
BEGIN
  -- Get lead info
  SELECT 
    s.name,
    l.case_id
  INTO student_name, case_id_val
  FROM leads_new l
  JOIN students s ON l.student_id = s.id
  WHERE l.id = NEW.lead_id;

  -- Get document type name
  SELECT name INTO doc_type_name
  FROM document_types
  WHERE id = NEW.document_type_id;

  -- Create notification for each admin
  FOR admin_user IN 
    SELECT id FROM app_users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_active = true
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
      NEW.lead_id,
      'document_uploaded',
      'New Document Uploaded',
      COALESCE(doc_type_name, 'Document') || ' uploaded for ' || COALESCE(student_name, 'Unknown') || ' (' || COALESCE(case_id_val, 'N/A') || ')',
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', doc_type_name,
        'student_name', student_name,
        'case_id', case_id_val
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document uploads
DROP TRIGGER IF EXISTS trigger_notify_admins_document_upload ON lead_documents;
CREATE TRIGGER trigger_notify_admins_document_upload
AFTER INSERT ON lead_documents
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_document_upload();

-- Function to notify all admins when a lead is created
CREATE OR REPLACE FUNCTION notify_admins_on_lead_creation()
RETURNS TRIGGER AS $$
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

  -- Create notification for each admin
  FOR admin_user IN 
    SELECT id FROM app_users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_active = true
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lead creation
DROP TRIGGER IF EXISTS trigger_notify_admins_lead_creation ON leads_new;
CREATE TRIGGER trigger_notify_admins_lead_creation
AFTER INSERT ON leads_new
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_lead_creation();

-- Function to notify on lead status change
CREATE OR REPLACE FUNCTION notify_on_lead_status_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  student_name TEXT;
  old_status_display TEXT;
  new_status_display TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT name INTO student_name
  FROM students
  WHERE id = NEW.student_id;

  -- Format status for display (replace underscores with spaces, title case)
  old_status_display := INITCAP(REPLACE(OLD.status::TEXT, '_', ' '));
  new_status_display := INITCAP(REPLACE(NEW.status::TEXT, '_', ' '));

  -- Create notification for each admin
  FOR admin_user IN 
    SELECT id FROM app_users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_active = true
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
      'status_change',
      'Lead Status Updated',
      NEW.case_id || ': ' || old_status_display || ' → ' || new_status_display,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_on_status_change ON leads_new;
CREATE TRIGGER trigger_notify_on_status_change
AFTER UPDATE ON leads_new
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_on_lead_status_change();

-- Function to notify on document verification/rejection
CREATE OR REPLACE FUNCTION notify_on_document_verification()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  student_name TEXT;
  doc_type_name TEXT;
  case_id_val TEXT;
  notification_type_val TEXT;
  title_val TEXT;
BEGIN
  -- Only trigger if verification_status changed to verified or rejected
  IF OLD.verification_status = NEW.verification_status THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status NOT IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get lead and student info
  SELECT 
    s.name,
    l.case_id
  INTO student_name, case_id_val
  FROM leads_new l
  JOIN students s ON l.student_id = s.id
  WHERE l.id = NEW.lead_id;

  -- Get document type name
  SELECT name INTO doc_type_name
  FROM document_types
  WHERE id = NEW.document_type_id;

  -- Set notification type and title based on status
  IF NEW.verification_status = 'verified' THEN
    notification_type_val := 'document_verified';
    title_val := 'Document Verified';
  ELSE
    notification_type_val := 'document_rejected';
    title_val := 'Document Rejected';
  END IF;

  -- Create notification for each admin (for audit trail)
  FOR admin_user IN 
    SELECT id FROM app_users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_active = true
    AND id != COALESCE(NEW.verified_by, '00000000-0000-0000-0000-000000000000')
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
      NEW.lead_id,
      notification_type_val,
      title_val,
      COALESCE(doc_type_name, 'Document') || ' for ' || COALESCE(student_name, 'Unknown') || ' (' || COALESCE(case_id_val, 'N/A') || ')' ||
        CASE WHEN NEW.verification_status = 'rejected' AND NEW.verification_notes IS NOT NULL 
          THEN ': ' || LEFT(NEW.verification_notes, 50) 
          ELSE '' 
        END,
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', doc_type_name,
        'student_name', student_name,
        'case_id', case_id_val,
        'verification_status', NEW.verification_status,
        'notes', NEW.verification_notes
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document verification
DROP TRIGGER IF EXISTS trigger_notify_document_verification ON lead_documents;
CREATE TRIGGER trigger_notify_document_verification
AFTER UPDATE ON lead_documents
FOR EACH ROW
WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
EXECUTE FUNCTION notify_on_document_verification();

-- Function to notify on lender assignment
CREATE OR REPLACE FUNCTION notify_on_lender_assignment()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  student_name TEXT;
  lender_name TEXT;
  old_lender_name TEXT;
BEGIN
  -- Only trigger if lender_id changed
  IF OLD.lender_id = NEW.lender_id THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT name INTO student_name
  FROM students
  WHERE id = NEW.student_id;

  -- Get new lender name
  SELECT name INTO lender_name
  FROM lenders
  WHERE id = NEW.lender_id;

  -- Get old lender name if exists
  IF OLD.lender_id IS NOT NULL THEN
    SELECT name INTO old_lender_name
    FROM lenders
    WHERE id = OLD.lender_id;
  END IF;

  -- Create notification for each admin
  FOR admin_user IN 
    SELECT id FROM app_users 
    WHERE role IN ('admin', 'super_admin') 
    AND is_active = true
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
      'lender_assigned',
      'Lender Assigned',
      NEW.case_id || ': Assigned to ' || COALESCE(lender_name, 'Unknown') ||
        CASE WHEN old_lender_name IS NOT NULL THEN ' (was: ' || old_lender_name || ')' ELSE '' END,
      jsonb_build_object(
        'case_id', NEW.case_id,
        'student_name', student_name,
        'lender_name', lender_name,
        'old_lender_name', old_lender_name,
        'lender_id', NEW.lender_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lender assignment
DROP TRIGGER IF EXISTS trigger_notify_lender_assignment ON leads_new;
CREATE TRIGGER trigger_notify_lender_assignment
AFTER UPDATE ON leads_new
FOR EACH ROW
WHEN (OLD.lender_id IS DISTINCT FROM NEW.lender_id)
EXECUTE FUNCTION notify_on_lender_assignment();