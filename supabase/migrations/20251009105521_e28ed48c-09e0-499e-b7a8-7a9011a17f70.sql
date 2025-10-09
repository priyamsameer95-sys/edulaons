-- Create protected accounts table for system-critical users
CREATE TABLE IF NOT EXISTS public.protected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.protected_accounts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view protected accounts
CREATE POLICY "Super admins can view protected accounts"
ON public.protected_accounts
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Only super admins can manage protected accounts
CREATE POLICY "Super admins can insert protected accounts"
ON public.protected_accounts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update protected accounts"
ON public.protected_accounts
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete protected accounts"
ON public.protected_accounts
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

-- Insert the primary super admin account
INSERT INTO public.protected_accounts (email, reason) 
VALUES ('priyam.sameer@cashkaro.com', 'Primary super admin account - cannot be deleted or modified')
ON CONFLICT (email) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_protected_accounts_email ON public.protected_accounts(email);