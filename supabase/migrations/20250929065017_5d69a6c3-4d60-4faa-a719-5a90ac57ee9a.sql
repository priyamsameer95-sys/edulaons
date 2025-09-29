-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('partner', 'admin', 'super_admin');

-- Create app_users table for role management
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'partner',
  partner_id UUID REFERENCES public.partners(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for app_users
CREATE POLICY "Users can view their own profile"
ON public.app_users
FOR SELECT
USING (auth.uid()::text = id::text OR EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id::text = auth.uid()::text 
  AND au.role IN ('admin', 'super_admin')
));

CREATE POLICY "Admins can view all users"
ON public.app_users
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id::text = auth.uid()::text 
  AND au.role IN ('admin', 'super_admin')
));

CREATE POLICY "Admins can insert users"
ON public.app_users
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id::text = auth.uid()::text 
  AND au.role IN ('admin', 'super_admin')
));

CREATE POLICY "Admins can update users"
ON public.app_users
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.app_users au 
  WHERE au.id::text = auth.uid()::text 
  AND au.role IN ('admin', 'super_admin')
));

-- Add partner_code to partners table for URL routing
ALTER TABLE public.partners ADD COLUMN partner_code TEXT UNIQUE;

-- Update existing partners with partner codes
UPDATE public.partners 
SET partner_code = LOWER(REPLACE(name, ' ', '-'))
WHERE partner_code IS NULL;

-- Make partner_code required
ALTER TABLE public.partners ALTER COLUMN partner_code SET NOT NULL;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Create function to get user's partner
CREATE OR REPLACE FUNCTION public.get_user_partner(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id
  FROM public.app_users
  WHERE id = _user_id
    AND is_active = true
$$;

-- Update RLS policies for leads_new to support multi-tenant access
DROP POLICY IF EXISTS "Leads are viewable by everyone for now" ON public.leads_new;
DROP POLICY IF EXISTS "Leads can be inserted by everyone for now" ON public.leads_new;
DROP POLICY IF EXISTS "Leads can be updated by everyone for now" ON public.leads_new;

CREATE POLICY "Partner users can view their leads"
ON public.leads_new
FOR SELECT
USING (
  partner_id = public.get_user_partner(auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Partner users can insert their leads"
ON public.leads_new
FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner(auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Partner users can update their leads"
ON public.leads_new
FOR UPDATE
USING (
  partner_id = public.get_user_partner(auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();