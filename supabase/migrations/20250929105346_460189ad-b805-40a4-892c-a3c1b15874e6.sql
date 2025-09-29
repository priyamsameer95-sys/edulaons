-- Add admin-specific fields to lead_documents for verification workflow
ALTER TABLE public.lead_documents 
ADD COLUMN admin_notes TEXT,
ADD COLUMN verified_by UUID REFERENCES auth.users(id),
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Add index for better performance on verification queries
CREATE INDEX idx_lead_documents_verification_status ON public.lead_documents(verification_status);
CREATE INDEX idx_lead_documents_verified_by ON public.lead_documents(verified_by);

-- Update RLS policies for admin document access
CREATE POLICY "Admins can update document verification" 
ON public.lead_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new l 
    WHERE l.id = lead_documents.lead_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);