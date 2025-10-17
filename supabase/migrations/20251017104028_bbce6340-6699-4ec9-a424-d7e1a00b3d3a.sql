-- Manually confirm email for nisha@cashkaro.com
-- This bypasses the email confirmation requirement for the existing user
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'nisha@cashkaro.com'
  AND email_confirmed_at IS NULL;