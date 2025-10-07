-- Admin User Access Console - RLS Policies
-- Allow admins and super_admins to view all users
CREATE POLICY "Admins can view all app_users"
ON app_users FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow super_admins to insert new users (partners and admins)
CREATE POLICY "Super admins can insert app_users"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to update any users
CREATE POLICY "Super admins can update app_users"
ON app_users FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to delete users (except themselves and the protected super admin)
CREATE POLICY "Super admins can delete app_users"
ON app_users FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  AND id != auth.uid() 
  AND id != (SELECT id FROM auth.users WHERE email = 'priyam.sameer@cashkaro.com')
);