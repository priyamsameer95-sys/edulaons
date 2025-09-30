-- Fix foreign key constraint in lead_documents table
-- Drop old constraint pointing to leads table
ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS lead_documents_lead_id_fkey;

-- Add new constraint pointing to leads_new table
ALTER TABLE public.lead_documents 
ADD CONSTRAINT fk_lead_documents_lead_id 
FOREIGN KEY (lead_id) 
REFERENCES public.leads_new(id) 
ON DELETE CASCADE;