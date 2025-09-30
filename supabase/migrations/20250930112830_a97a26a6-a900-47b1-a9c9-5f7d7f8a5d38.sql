-- Drop duplicate foreign key constraint on lead_documents table
-- This is causing issues with Supabase's ability to resolve relationships
-- We keep the named constraint fk_lead_documents_document_type and remove the auto-generated one

ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS lead_documents_document_type_id_fkey;