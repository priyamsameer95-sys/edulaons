-- Remove duplicate/old foreign key constraints that are causing query ambiguity
-- This fixes the "more than one relationship was found" errors

-- Drop the OLD foreign key constraints (with old naming convention)
ALTER TABLE public.leads_new 
  DROP CONSTRAINT IF EXISTS fk_leads_student,
  DROP CONSTRAINT IF EXISTS fk_leads_co_applicant,
  DROP CONSTRAINT IF EXISTS fk_leads_partner,
  DROP CONSTRAINT IF EXISTS fk_leads_lender;

-- Verify only the new constraints remain:
-- leads_new_student_id_fkey
-- leads_new_co_applicant_id_fkey  
-- leads_new_partner_id_fkey
-- leads_new_lender_id_fkey

DO $$ 
BEGIN
  RAISE NOTICE 'Cleaned up duplicate foreign key constraints on leads_new table';
  RAISE NOTICE 'This resolves the PostgREST ambiguous relationship errors';
END $$;