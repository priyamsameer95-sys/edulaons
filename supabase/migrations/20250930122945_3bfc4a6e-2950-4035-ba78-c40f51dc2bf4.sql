-- COMPREHENSIVE CLEANUP: Remove all leads and related data while preserving master data
-- This will give you a fresh start for lead management

-- Step 1: Delete lead documents (child table - must go first)
DELETE FROM public.lead_documents;

-- Step 2: Delete lead status history (references leads)
DELETE FROM public.lead_status_history;

-- Step 3: Delete lead-university relationships (if any)
DELETE FROM public.lead_universities;

-- Step 4: Delete academic tests (references students)
DELETE FROM public.academic_tests;

-- Step 5: Delete leads from both tables
DELETE FROM public.leads_new;
DELETE FROM public.leads;

-- Step 6: Delete students (no longer referenced by leads)
DELETE FROM public.students;

-- Step 7: Delete co-applicants (no longer referenced by leads)
DELETE FROM public.co_applicants;

-- Step 8: Optional - Clean up any orphaned files in storage
-- This will be done manually if needed via storage bucket management

-- Summary of what was preserved:
-- ✓ partners (master data)
-- ✓ lenders (master data)
-- ✓ universities (master data)
-- ✓ courses (master data)
-- ✓ document_types (configuration)
-- ✓ app_users (user accounts)
-- ✓ data_access_logs (audit trail)

-- Log the cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully';
  RAISE NOTICE 'All leads, students, co-applicants, and related records have been deleted';
  RAISE NOTICE 'Master data (partners, lenders, universities, courses) has been preserved';
END $$;