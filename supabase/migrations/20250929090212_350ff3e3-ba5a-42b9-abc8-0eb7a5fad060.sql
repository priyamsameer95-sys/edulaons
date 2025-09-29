-- Drop the overly permissive policy that allows all authenticated users to see all leads
DROP POLICY IF EXISTS "Public stats access for partner leads" ON public.leads_new;

-- The remaining policy "Partner users can view their leads" with expression:
-- ((partner_id = get_user_partner(auth.uid())) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
-- will ensure proper partner isolation while allowing admins to see all leads