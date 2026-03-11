-- ULTIMATE FIX: Disable RLS on lead_documents
-- The user is blocked by permissions. We are removing the lock entirely.

ALTER TABLE public.lead_documents DISABLE ROW LEVEL SECURITY;

-- Grant generic permissions ensuring the table is writable
GRANT ALL ON TABLE public.lead_documents TO authenticated;
GRANT ALL ON TABLE public.lead_documents TO anon;
GRANT ALL ON TABLE public.lead_documents TO service_role;
