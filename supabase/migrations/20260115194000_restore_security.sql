-- RESTORE SECURITY: Final Corrective Migration
-- 1. Enable RLS (Security Best Practice)
-- 2. Fix Foreign Key (Data Integrity)
-- 3. Apply Robust Access Policy (Functionality)

-- A. Fix the Foreign Key to point to the correct table (leads_new)
ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS lead_documents_lead_id_fkey;

ALTER TABLE public.lead_documents 
DROP CONSTRAINT IF EXISTS fk_lead_documents_leads;

-- Only add if it doesn't exist (using DO block for safety would be ideal, but standard ADD is fine)
ALTER TABLE public.lead_documents
ADD CONSTRAINT lead_documents_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES public.leads_new(id)
ON DELETE CASCADE;

-- B. Re-enable Row Level Security
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- C. Clean up any temporary/permissive policies
DROP POLICY IF EXISTS "allow_all_authenticated_lead_documents" ON public.lead_documents;
DROP POLICY IF EXISTS "authenticated_insert_lead_documents" ON public.lead_documents;
DROP POLICY IF EXISTS "authenticated_select_lead_documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.lead_documents;

-- D. Re-apply the robust policy using the Security Definer function
-- Ensure function exists (re-definition)
CREATE OR REPLACE FUNCTION public.check_is_lead_owner(lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email TEXT;
  current_phone TEXT;
  is_owner BOOLEAN;
BEGIN
  current_email := auth.jwt() ->> 'email';
  -- Standardize user phone from JWT (last 10 digits)
  current_phone := RIGHT(regexp_replace((auth.jwt() -> 'user_metadata' ->> 'phone')::text, '\D', '', 'g'), 10);

  -- Check ownership
  SELECT EXISTS (
    SELECT 1 
    FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE l.id = lead_id
    AND (
      (current_email IS NOT NULL AND LOWER(s.email) = LOWER(current_email))
      OR 
      (current_phone IS NOT NULL AND RIGHT(regexp_replace(s.phone, '\D', '', 'g'), 10) = current_phone)
    )
  ) INTO is_owner;

  RETURN is_owner;
END;
$$;

CREATE POLICY "Students can upload their own documents"
ON public.lead_documents
FOR INSERT
TO authenticated
WITH CHECK (
  check_is_lead_owner(lead_id)
);

-- E. Allow Viewing (Select) for Owner
CREATE POLICY "Students can view their own documents"
ON public.lead_documents
FOR SELECT
TO authenticated
USING (
  check_is_lead_owner(lead_id)
);

-- F. Allow Partners to View/Update (Restoring legacy policy logic if needed, or simplified)
-- For now, ensure students are covered. Admin/Service Role always bypass RLS.
