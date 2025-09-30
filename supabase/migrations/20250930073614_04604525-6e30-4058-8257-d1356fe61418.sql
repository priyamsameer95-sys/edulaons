-- Critical Fix: Assign partner_id to super_admin account
-- This fixes the auto-logout issue for priyam.sameer@cashkaro.com

UPDATE app_users 
SET partner_id = '4d30adb1-65b8-4b8e-bd65-ebebd3bd3d52'
WHERE email = 'priyam.sameer@cashkaro.com' AND partner_id IS NULL;

-- Add audit logging for authentication issues
CREATE TABLE IF NOT EXISTS public.auth_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on auth_error_logs
ALTER TABLE public.auth_error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth error logs
CREATE POLICY "Admins can view auth error logs"
ON public.auth_error_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.id = auth.uid() 
    AND app_users.role IN ('admin', 'super_admin')
  )
);

-- System can insert auth error logs
CREATE POLICY "System can insert auth error logs"
ON public.auth_error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);