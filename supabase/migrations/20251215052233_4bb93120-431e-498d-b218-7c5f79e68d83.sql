-- Update bhavya.mittal@cashkaro.com to admin role
UPDATE app_users 
SET role = 'admin', updated_at = now()
WHERE email = 'bhavya.mittal@cashkaro.com';

-- Also update user_roles table if exists
INSERT INTO user_roles (user_id, role, is_active, granted_at)
SELECT id, 'admin', true, now()
FROM app_users 
WHERE email = 'bhavya.mittal@cashkaro.com'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, revoked_at = NULL;