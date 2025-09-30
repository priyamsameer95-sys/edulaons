-- CRITICAL FIX: Remove duplicate foreign key constraints that are breaking queries

-- Drop OLD duplicate foreign keys (if they exist)
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_student;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_co_applicant;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_partner;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_lender;

-- The new constraints (fk_leads_new_*) from the previous migration should remain
-- This will resolve the "more than one relationship was found" error