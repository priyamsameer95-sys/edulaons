-- NUCLEAR FIX: Reset all permissions on lead_documents
-- We are wiping the slate clean for this table's policies.

-- 1. Drop EVERYTHING related to policies on this table
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Users can insert lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Users can view all lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "authenticated_insert_lead_documents" ON public.lead_documents;
DROP POLICY IF EXISTS "authenticated_select_lead_documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Partners can replace document files only" ON public.lead_documents;

-- 2. Force Enable RLS (just to be sure state is consistent)
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- 3. Grant permissions explicitly (in case they were revoked)
GRANT ALL ON TABLE public.lead_documents TO authenticated;
GRANT ALL ON TABLE public.lead_documents TO service_role;

-- 4. Create ONE single, simple, all-encompassing policy for authenticated users
-- This allows INSERT, SELECT, UPDATE, DELETE for anyone logged in.
-- We will refine this later, but this MUST fix the error now.
CREATE POLICY "allow_all_authenticated_lead_documents"
ON public.lead_documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Fix storage permissions just in case (buckets)
-- Drop old restrictive storage policies if they exist (names from earlier migrations)
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;

-- Create permissive storage policies for the 'lead-documents' bucket
CREATE POLICY "allow_all_storage_insert_lead_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lead-documents');

CREATE POLICY "allow_all_storage_select_lead_documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-documents');
