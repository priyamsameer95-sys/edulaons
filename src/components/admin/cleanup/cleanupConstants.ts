export const EMAILS_TO_DELETE = [
  'priyam.sameer.95@gmail.com',
  'riddhi@cashkaro.com',
  'mohsinfd@gmail.com',
  'priyam.sameer.khet@gmail.com',
  'kartik@cashkaro.com',
  'shahrukh.khan@cashkaro.com'
] as const;

export const CLEANUP_SQL = `BEGIN;

-- Nullify Super Admin's partner_id
UPDATE public.app_users 
SET partner_id = NULL 
WHERE id = '01675fb4-4255-474d-bba7-824956bf3d27';

-- Delete lead-related data
DELETE FROM public.lead_documents;
DELETE FROM public.lead_universities;
DELETE FROM public.academic_tests;
DELETE FROM public.application_activities;
DELETE FROM public.application_comments;
DELETE FROM public.lead_status_history;
DELETE FROM public.lender_assignment_history;
DELETE FROM public.eligibility_scores;
DELETE FROM public.leads_new;
DELETE FROM public.co_applicants;
DELETE FROM public.students;
DELETE FROM public.lenders;
DELETE FROM public.partners;

-- Delete app_users except Super Admin
DELETE FROM public.app_users 
WHERE id != '01675fb4-4255-474d-bba7-824956bf3d27';
DELETE FROM public.user_roles 
WHERE user_id != '01675fb4-4255-474d-bba7-824956bf3d27';

-- Clean audit tables
DELETE FROM public.admin_security_audit;
DELETE FROM public.data_access_logs;
DELETE FROM public.activity_completions;
DELETE FROM public.notifications;
DELETE FROM public.auth_error_logs;

COMMIT;`;

export const SUPABASE_PROJECT_ID = 'cdcoukzjumcfwskkcxkr';
