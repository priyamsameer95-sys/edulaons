-- Delete the orphaned app_users record so we can recreate properly
DELETE FROM app_users WHERE email = 'test@admin.com';