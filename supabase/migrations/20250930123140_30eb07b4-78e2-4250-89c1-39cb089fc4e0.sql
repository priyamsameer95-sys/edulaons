-- Delete ONLY partner-created leads while keeping admin-created leads
-- This migration can be run anytime to clean partner data

-- Step 1: Store partner lead IDs for reference
CREATE TEMP TABLE partner_lead_ids AS
SELECT id, student_id, co_applicant_id 
FROM public.leads_new 
WHERE partner_id IS NOT NULL;

-- Step 2: Delete lead documents for partner leads
DELETE FROM public.lead_documents
WHERE lead_id IN (SELECT id FROM partner_lead_ids);

-- Step 3: Delete status history for partner leads
DELETE FROM public.lead_status_history
WHERE lead_id IN (SELECT id FROM partner_lead_ids);

-- Step 4: Delete lead-university relationships for partner leads
DELETE FROM public.lead_universities
WHERE lead_id IN (SELECT id FROM partner_lead_ids);

-- Step 5: Delete academic tests for students in partner leads
DELETE FROM public.academic_tests
WHERE student_id IN (SELECT student_id FROM partner_lead_ids);

-- Step 6: Delete the partner leads themselves
DELETE FROM public.leads_new
WHERE partner_id IS NOT NULL;

-- Step 7: Delete orphaned students (not referenced by any remaining leads)
DELETE FROM public.students
WHERE id NOT IN (
  SELECT DISTINCT student_id FROM public.leads_new
);

-- Step 8: Delete orphaned co-applicants (not referenced by any remaining leads)
DELETE FROM public.co_applicants
WHERE id NOT IN (
  SELECT DISTINCT co_applicant_id FROM public.leads_new
);

-- Log the cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Partner lead cleanup completed successfully';
  RAISE NOTICE 'Admin-created leads have been preserved';
  RAISE NOTICE 'All partner-created data and orphaned records removed';
END $$;