-- ============================================
-- FIX LEAD DOCUMENTS RLS POLICIES
-- ============================================
-- The previous migration was too restrictive and broke document fetching
-- This fixes the policies to allow proper access while maintaining security

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Partners can view their lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Partners can insert their lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can insert any lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Partners can update their lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can delete lead documents" ON public.lead_documents;

-- Create more permissive policies that still maintain security

-- SELECT: Admins can view all documents
CREATE POLICY "Admins can view all lead documents"
  ON public.lead_documents
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- SELECT: Partners can view documents for their leads
CREATE POLICY "Partners can view their lead documents"
  ON public.lead_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads_new
      WHERE leads_new.id = lead_documents.lead_id
        AND leads_new.partner_id = get_user_partner(auth.uid())
    )
  );

-- INSERT: Admins can insert any documents
CREATE POLICY "Admins can insert any lead documents"
  ON public.lead_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- INSERT: Partners can insert documents for their leads
CREATE POLICY "Partners can insert their lead documents"
  ON public.lead_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads_new
      WHERE leads_new.id = lead_documents.lead_id
        AND leads_new.partner_id = get_user_partner(auth.uid())
    )
  );

-- UPDATE: Admins can update any documents
CREATE POLICY "Admins can update any lead documents"
  ON public.lead_documents
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- UPDATE: Partners can update their lead documents (only pending ones)
CREATE POLICY "Partners can update their pending lead documents"
  ON public.lead_documents
  FOR UPDATE
  TO authenticated
  USING (
    verification_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.leads_new
      WHERE leads_new.id = lead_documents.lead_id
        AND leads_new.partner_id = get_user_partner(auth.uid())
    )
  );

-- DELETE: Only admins can delete documents
CREATE POLICY "Admins can delete lead documents"
  ON public.lead_documents
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Add comment explaining the policies
COMMENT ON TABLE public.lead_documents IS 
  'Lead documents table with RLS policies. Admins have full access. Partners can view/insert/update(pending only) documents for their leads.';