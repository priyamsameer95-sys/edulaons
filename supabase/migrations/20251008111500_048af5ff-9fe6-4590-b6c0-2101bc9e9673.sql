-- Fix critical security issues with RLS policies

-- 1. Fix partners table - Remove public SELECT policy and add proper role-based access
DROP POLICY IF EXISTS "Partners are publicly viewable when active" ON public.partners;

-- Partners can view all active partners (for partner listings)
CREATE POLICY "Authenticated users can view active partners"
ON public.partners
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can view all partners
CREATE POLICY "Admins can view all partners"
ON public.partners
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Partners can view their own partner record
CREATE POLICY "Partners can view their own record"
ON public.partners
FOR SELECT
TO authenticated
USING (id = get_user_partner(auth.uid()));

-- 2. Fix lead_documents table - Remove overly permissive policies
DROP POLICY IF EXISTS "Users can view all lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Users can insert lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Users can update lead documents" ON public.lead_documents;

-- Note: The existing role-based policies for partners and admins remain:
-- - "Admins can view all lead documents"
-- - "Admins can insert/update/delete any lead documents"
-- - "Partners can view/insert their lead documents"
-- - "Partners can update their pending lead documents"

-- 3. Fix courses table - Remove public INSERT policy (should only be admin)
DROP POLICY IF EXISTS "Allow public insert on courses" ON public.courses;

CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- 4. Fix universities table - Remove public INSERT policy (should only be admin)
DROP POLICY IF EXISTS "Allow public insert on universities" ON public.universities;

CREATE POLICY "Admins can insert universities"
ON public.universities
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));