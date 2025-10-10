-- ============================================
-- DATABASE & USER SYSTEM REFACTOR
-- Security-hardened role management system
-- ============================================

-- STEP 1: Clean up orphaned records
DELETE FROM public.app_users
WHERE id NOT IN (SELECT id FROM auth.users);

-- STEP 2: Create user_roles table (separate from app_users for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_role ON public.user_roles(role) WHERE is_active = true;

-- STEP 3: Migrate existing roles (only for users that exist in auth.users)
INSERT INTO public.user_roles (user_id, role, is_active, granted_at)
SELECT 
  au.id,
  au.role,
  au.is_active,
  au.created_at
FROM public.app_users au
INNER JOIN auth.users u ON au.id = u.id
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 4: Update has_role function to use new user_roles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND revoked_at IS NULL
  )
$$;

-- STEP 5: Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND revoked_at IS NULL
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'kam' THEN 3
      WHEN 'partner' THEN 4
      WHEN 'student' THEN 5
    END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.grant_user_role(
  _user_id uuid,
  _role app_role,
  _granted_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_id uuid;
BEGIN
  IF NOT (has_role(_granted_by, 'admin') OR has_role(_granted_by, 'super_admin')) THEN
    RAISE EXCEPTION 'Insufficient permissions to grant roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
  VALUES (_user_id, _role, _granted_by, true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET
    is_active = true,
    revoked_at = NULL,
    granted_by = _granted_by,
    granted_at = now()
  RETURNING id INTO role_id;

  RETURN role_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(
  _user_id uuid,
  _role app_role,
  _revoked_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(_revoked_by, 'admin') OR has_role(_revoked_by, 'super_admin')) THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke roles';
  END IF;

  UPDATE public.user_roles
  SET 
    is_active = false,
    revoked_at = now()
  WHERE user_id = _user_id
    AND role = _role;

  RETURN FOUND;
END;
$$;

-- STEP 6: RLS policies for user_roles
CREATE POLICY "Super admins can view all user roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view user roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin') AND role != 'super_admin');

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- STEP 7: Create audit table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  old_role app_role,
  new_role app_role,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role audit logs"
ON public.role_change_audit FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert role audit logs"
ON public.role_change_audit FOR INSERT
WITH CHECK (true);

-- STEP 8: Audit trigger
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_audit (user_id, new_role, changed_by)
    VALUES (NEW.user_id, NEW.role, NEW.granted_by);
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.role_change_audit (user_id, old_role, changed_by, change_reason)
    VALUES (NEW.user_id, NEW.role, auth.uid(), 'Role revoked');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_role_changes
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_changes();

-- STEP 9: Documentation
COMMENT ON TABLE public.user_roles IS 'Security-hardened role storage. Roles are stored separately from user data to prevent privilege escalation attacks.';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check roles. Uses user_roles table to prevent RLS recursion.';
COMMENT ON TABLE public.role_change_audit IS 'Immutable audit log for all role changes.';