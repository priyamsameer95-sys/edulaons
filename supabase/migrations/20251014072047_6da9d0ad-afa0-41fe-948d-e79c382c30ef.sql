-- Fix first_login_at tracking for students

-- Step 1: Update historical data - mark students who have already logged in
UPDATE public.app_users au
SET first_login_at = u.last_sign_in_at
FROM auth.users u
WHERE au.id = u.id
  AND au.role = 'student'
  AND au.first_login_at IS NULL
  AND u.last_sign_in_at IS NOT NULL;

-- Step 2: Add RLS policy to allow users to set their own first_login_at (one time only)
CREATE POLICY "Users can set their own first_login_at once"
ON public.app_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND first_login_at IS NULL)
WITH CHECK (auth.uid() = id);