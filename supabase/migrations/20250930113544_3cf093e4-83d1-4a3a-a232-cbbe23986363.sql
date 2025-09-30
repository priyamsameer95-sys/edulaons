-- Convert verification_status from TEXT to document_status_enum
-- This aligns individual document status with the lead-level document status enum

-- First, update any existing values to match enum values
UPDATE public.lead_documents
SET verification_status = 'pending'
WHERE verification_status NOT IN ('pending', 'uploaded', 'verified', 'rejected', 'resubmission_required');

-- Drop the policy that depends on verification_status
DROP POLICY IF EXISTS "Partners can update their pending lead documents" ON public.lead_documents;

-- Drop and recreate the column with enum type
ALTER TABLE public.lead_documents 
DROP COLUMN verification_status;

ALTER TABLE public.lead_documents 
ADD COLUMN verification_status document_status_enum NOT NULL DEFAULT 'pending'::document_status_enum;

-- Recreate the policy with the enum type
CREATE POLICY "Partners can update their pending lead documents"
ON public.lead_documents
FOR UPDATE
USING (
  verification_status = 'pending'::document_status_enum
  AND EXISTS (
    SELECT 1 FROM leads_new
    WHERE leads_new.id = lead_documents.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

-- Create a function to sync document statuses to lead level
CREATE OR REPLACE FUNCTION public.sync_lead_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_status document_status_enum;
BEGIN
  -- Determine lead-level document status based on all documents for this lead
  SELECT CASE
    WHEN COUNT(*) FILTER (WHERE verification_status = 'rejected') > 0 THEN 'rejected'::document_status_enum
    WHEN COUNT(*) FILTER (WHERE verification_status = 'resubmission_required') > 0 THEN 'resubmission_required'::document_status_enum
    WHEN COUNT(*) FILTER (WHERE verification_status = 'pending') > 0 THEN 'pending'::document_status_enum
    WHEN COUNT(*) FILTER (WHERE verification_status = 'uploaded') > 0 THEN 'uploaded'::document_status_enum
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE verification_status = 'verified') THEN 'verified'::document_status_enum
    ELSE 'pending'::document_status_enum
  END INTO lead_status
  FROM public.lead_documents
  WHERE lead_id = COALESCE(NEW.lead_id, OLD.lead_id);

  -- Update the lead's document status
  UPDATE public.leads_new
  SET documents_status = lead_status
  WHERE id = COALESCE(NEW.lead_id, OLD.lead_id);

  RETURN NEW;
END;
$$;

-- Create trigger to sync document status changes to lead level
DROP TRIGGER IF EXISTS sync_document_status_trigger ON public.lead_documents;
CREATE TRIGGER sync_document_status_trigger
AFTER INSERT OR UPDATE OF verification_status OR DELETE ON public.lead_documents
FOR EACH ROW
EXECUTE FUNCTION public.sync_lead_document_status();