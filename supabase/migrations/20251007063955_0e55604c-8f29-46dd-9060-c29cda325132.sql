-- Add soft delete columns to app_users
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Create user management audit logs table
CREATE TABLE IF NOT EXISTS public.user_management_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'deactivate', 'reactivate', 'delete_attempt')),
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_user_email TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_management_logs
ALTER TABLE public.user_management_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.user_management_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert audit logs (for edge function)
CREATE POLICY "System can insert audit logs"
ON public.user_management_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_management_logs_target_user ON public.user_management_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_logs_performed_by ON public.user_management_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_user_management_logs_created_at ON public.user_management_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_management_logs_action ON public.user_management_logs(action);

-- Add comment
COMMENT ON TABLE public.user_management_logs IS 'Audit trail for all user management actions including create, update, deactivate, and reactivate operations';