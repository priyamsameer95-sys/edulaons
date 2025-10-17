-- Delete orphaned app_users record for nisha@cashkaro.com
-- This user exists in app_users but not in auth.users, preventing login
DELETE FROM app_users 
WHERE email = 'nisha@cashkaro.com' 
  AND id = 'd5155926-b04d-4b79-ae23-86d329499039';