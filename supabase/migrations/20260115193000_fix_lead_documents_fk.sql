-- FIX: Update Foreign Key on lead_documents to point to leads_new
-- The table lead_documents likely references the old 'leads' table.
-- We need to repoint it to 'leads_new'.

-- 1. Drop the old FK constraint (name might vary, trying standard names)
ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS lead_documents_lead_id_fkey;

ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS fk_lead_documents_leads;

-- 2. Add the correct FK constraint pointing to leads_new
ALTER TABLE public.lead_documents
ADD CONSTRAINT lead_documents_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES public.leads_new(id)
ON DELETE CASCADE;

-- 3. Just to be absolutely sure, GRANT access again (redundant but safe)
GRANT ALL ON TABLE public.lead_documents TO authenticated;
