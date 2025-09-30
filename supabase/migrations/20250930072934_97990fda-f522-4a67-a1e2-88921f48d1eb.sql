-- Fix pre-existing security warnings: Add search_path to functions

-- Fix update_lead_status_timestamps function
CREATE OR REPLACE FUNCTION public.update_lead_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  
  IF OLD.documents_status IS DISTINCT FROM NEW.documents_status THEN
    NEW.documents_status_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix log_lead_status_change function
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.documents_status IS DISTINCT FROM NEW.documents_status THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      old_status,
      new_status,
      old_documents_status,
      new_documents_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      OLD.documents_status,
      NEW.documents_status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;