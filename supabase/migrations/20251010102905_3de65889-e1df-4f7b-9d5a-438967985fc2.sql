
-- ============================================
-- CRITICAL SECURITY FIXES FOR ADMIN DASHBOARD  
-- (Fixed co_applicants policy)
-- ============================================

-- 1. FIX CRITICAL: Remove unrestricted partner insertion policy
DROP POLICY IF EXISTS "Partners can be inserted by everyone for now" ON public.partners;

CREATE POLICY "Only admins can create partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. FIX: Restrict public access to business intelligence
DROP POLICY IF EXISTS "Universities are viewable by everyone" ON public.universities;

CREATE POLICY "Universities viewable by authenticated users only"
ON public.universities
FOR SELECT
TO authenticated
USING (true);

-- 3. FIX: Restrict course catalog
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;

CREATE POLICY "Courses viewable by authenticated users only"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- 4. FIX: Restrict lender data
DROP POLICY IF EXISTS "Lenders are viewable by everyone" ON public.lenders;

CREATE POLICY "Lenders viewable by authenticated users only"
ON public.lenders
FOR SELECT
TO authenticated
USING (true);

-- 5. FIX: Restrict university-lender preferences
DROP POLICY IF EXISTS "University lender preferences are viewable by everyone" ON public.university_lender_preferences;
DROP POLICY IF EXISTS "Everyone can view university lender preferences" ON public.university_lender_preferences;

CREATE POLICY "Only admins can view university-lender preferences"
ON public.university_lender_preferences
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 6. FIX: Restrict document types
DROP POLICY IF EXISTS "Document types are viewable by everyone" ON public.document_types;

CREATE POLICY "Document types viewable by authenticated users only"
ON public.document_types
FOR SELECT
TO authenticated
USING (true);

-- 7. ENHANCE: Stricter partner access to student data
DROP POLICY IF EXISTS "Partners can view students for their leads" ON public.students;
DROP POLICY IF EXISTS "students_partners_view" ON public.students;

CREATE POLICY "Partners can only view students for their assigned leads"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  (
    public.has_role(auth.uid(), 'partner'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.leads_new ln
      INNER JOIN public.app_users au ON au.partner_id = ln.partner_id
      WHERE ln.student_id = students.id
      AND au.id = auth.uid()
    )
  ) OR
  email = (auth.jwt() ->> 'email'::text)
);

-- 8. ENHANCE: Stricter co-applicant access (FIXED to use correct schema)
DROP POLICY IF EXISTS "Partners can view co-applicants for their leads" ON public.co_applicants;
DROP POLICY IF EXISTS "Partners can view their own co-applicants" ON public.co_applicants;

CREATE POLICY "Partners can only view co-applicants for their assigned leads"
ON public.co_applicants
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  (
    public.has_role(auth.uid(), 'partner'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.leads_new ln
      INNER JOIN public.app_users au ON au.partner_id = ln.partner_id
      WHERE ln.co_applicant_id = co_applicants.id
      AND au.id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.leads_new ln
    INNER JOIN public.students s ON ln.student_id = s.id
    WHERE ln.co_applicant_id = co_applicants.id
    AND s.email = (auth.jwt() ->> 'email'::text)
  )
);

-- 9. AUDIT: Create security audit log for admin actions
CREATE TABLE IF NOT EXISTS public.admin_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_lead_id UUID,
  target_partner_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_security_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can view audit logs"
ON public.admin_security_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can insert audit logs"
ON public.admin_security_audit
FOR INSERT
TO authenticated
WITH CHECK (admin_user_id = auth.uid());

-- 10. Helper function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _target_user_id UUID DEFAULT NULL,
  _target_lead_id UUID DEFAULT NULL,
  _target_partner_id UUID DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _audit_id UUID;
BEGIN
  INSERT INTO public.admin_security_audit (
    admin_user_id,
    action,
    target_user_id,
    target_lead_id,
    target_partner_id,
    details
  ) VALUES (
    auth.uid(),
    _action,
    _target_user_id,
    _target_lead_id,
    _target_partner_id,
    _details
  ) RETURNING id INTO _audit_id;
  
  RETURN _audit_id;
END;
$$;
