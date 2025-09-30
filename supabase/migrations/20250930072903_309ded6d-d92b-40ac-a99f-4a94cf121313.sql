-- CRITICAL SECURITY FIX: Enforce strict partner isolation
-- Remove existing permissive policies and create strict separation

-- Drop existing policies on leads_new
DROP POLICY IF EXISTS "Partner users can view their leads" ON public.leads_new;
DROP POLICY IF EXISTS "Partner users can insert their leads" ON public.leads_new;
DROP POLICY IF EXISTS "Partner users can update their leads" ON public.leads_new;

-- Create STRICT policy for partners - NO EXCEPTIONS
CREATE POLICY "Partners can ONLY view their own leads" ON public.leads_new
FOR SELECT 
TO authenticated
USING (
  -- Partner users can ONLY see leads where partner_id matches EXACTLY
  -- No admin bypass, no super_admin bypass
  partner_id = get_user_partner(auth.uid()) 
  AND get_user_partner(auth.uid()) IS NOT NULL
  AND (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'partner'
);

-- Create SEPARATE policy for admin operations
CREATE POLICY "Admins can view all leads for administration" ON public.leads_new
FOR SELECT 
TO authenticated
USING (
  -- Only users with admin or super_admin role
  (SELECT role FROM public.app_users WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Create STRICT insert policy for partners
CREATE POLICY "Partners can ONLY insert their own leads" ON public.leads_new
FOR INSERT 
TO authenticated
WITH CHECK (
  partner_id = get_user_partner(auth.uid()) 
  AND get_user_partner(auth.uid()) IS NOT NULL
  AND (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'partner'
);

-- Create admin insert policy
CREATE POLICY "Admins can insert leads" ON public.leads_new
FOR INSERT 
TO authenticated
WITH CHECK (
  (SELECT role FROM public.app_users WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Create STRICT update policy for partners
CREATE POLICY "Partners can ONLY update their own leads" ON public.leads_new
FOR UPDATE 
TO authenticated
USING (
  partner_id = get_user_partner(auth.uid()) 
  AND get_user_partner(auth.uid()) IS NOT NULL
  AND (SELECT role FROM public.app_users WHERE id = auth.uid()) = 'partner'
);

-- Create admin update policy
CREATE POLICY "Admins can update leads" ON public.leads_new
FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM public.app_users WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Create audit logging table to track data access
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_role app_role NOT NULL,
  partner_id uuid,
  table_name text NOT NULL,
  action text NOT NULL,
  record_count integer DEFAULT 0,
  accessed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.data_access_logs
FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM public.app_users WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Create function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
  current_user_role app_role;
  current_partner_id uuid;
BEGIN
  -- Get current user details
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  SELECT role, partner_id INTO current_user_role, current_partner_id 
  FROM public.app_users WHERE id = auth.uid();
  
  -- Log the access
  INSERT INTO public.data_access_logs (
    user_id,
    user_email,
    user_role,
    partner_id,
    table_name,
    action,
    record_count
  ) VALUES (
    auth.uid(),
    current_user_email,
    current_user_role,
    current_partner_id,
    TG_TABLE_NAME,
    TG_OP,
    1
  );
  
  RETURN NEW;
END;
$$;

-- CRITICAL: Fix the user role issue
-- Remove super_admin role from accounts that should be partners
UPDATE public.app_users 
SET role = 'partner'
WHERE email LIKE '%@cashkaro.com' 
  AND role = 'super_admin'
  AND partner_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE public.data_access_logs IS 'Audit trail for data access - tracks who accessed what data and when';
COMMENT ON POLICY "Partners can ONLY view their own leads" ON public.leads_new IS 'CRITICAL SECURITY: Partners can only see their own leads - no exceptions';