
-- =====================================================
-- Partner Document Status Enforcement
-- Partner can ONLY upload/re-upload files, NEVER change status
-- Admin/Super Admin are the ONLY roles that can change document status
-- =====================================================

-- Drop existing overly permissive partner update policy
DROP POLICY IF EXISTS "Partners can update their pending lead documents" ON public.lead_documents;

-- Create new restricted policy: Partners can ONLY update file-related fields (for re-upload)
-- They CANNOT update: verification_status, verification_notes, verified_by, verified_at, admin_notes
CREATE POLICY "Partners can replace document files only"
ON public.lead_documents
FOR UPDATE
TO authenticated
USING (
  -- Partner owns this lead
  EXISTS (
    SELECT 1 FROM leads_new
    WHERE leads_new.id = lead_documents.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
  -- Document is in a state that allows re-upload (pending/rejected/uploaded, NOT verified)
  AND verification_status IN ('pending', 'uploaded', 'rejected', 'resubmission_required')
)
WITH CHECK (
  -- Partner owns this lead
  EXISTS (
    SELECT 1 FROM leads_new
    WHERE leads_new.id = lead_documents.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Create a trigger function to enforce Partner cannot update status fields
CREATE OR REPLACE FUNCTION public.enforce_partner_document_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM app_users
  WHERE id = auth.uid();
  
  -- If user is admin or super_admin, allow all updates
  IF user_role IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;
  
  -- For non-admin users (partners, students), restrict status field updates
  -- Only allow file-related field changes, status must remain unchanged or go to 'uploaded' on re-upload
  IF user_role = 'partner' OR user_role = 'student' THEN
    -- Prevent changing verification_status to anything other than 'uploaded' 
    -- (which happens automatically on re-upload via edge function)
    IF OLD.verification_status IS DISTINCT FROM NEW.verification_status 
       AND NEW.verification_status NOT IN ('uploaded', 'pending') THEN
      RAISE EXCEPTION 'Partners cannot change document verification status to %', NEW.verification_status;
    END IF;
    
    -- Prevent modifying admin-only fields
    IF OLD.verification_notes IS DISTINCT FROM NEW.verification_notes THEN
      RAISE EXCEPTION 'Partners cannot modify verification notes';
    END IF;
    
    IF OLD.admin_notes IS DISTINCT FROM NEW.admin_notes THEN
      RAISE EXCEPTION 'Partners cannot modify admin notes';
    END IF;
    
    IF OLD.verified_by IS DISTINCT FROM NEW.verified_by THEN
      RAISE EXCEPTION 'Partners cannot modify verified_by field';
    END IF;
    
    IF OLD.verified_at IS DISTINCT FROM NEW.verified_at THEN
      RAISE EXCEPTION 'Partners cannot modify verified_at field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_partner_document_restrictions_trigger ON public.lead_documents;

-- Create the trigger
CREATE TRIGGER enforce_partner_document_restrictions_trigger
BEFORE UPDATE ON public.lead_documents
FOR EACH ROW
EXECUTE FUNCTION public.enforce_partner_document_restrictions();

-- Add comment for documentation
COMMENT ON FUNCTION public.enforce_partner_document_restrictions() IS 
'Enforces that Partners can only update file-related fields on documents. 
Verification status and admin notes can ONLY be modified by Admin/Super Admin.
KB Compliance: Partner is READ-ONLY for status, can ONLY upload/re-upload documents.';
