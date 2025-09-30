-- COMPREHENSIVE FIX: Add missing foreign key constraints to leads_new table
-- This enables Supabase nested queries to work properly

-- Step 1: Clean up any orphaned records that would prevent FK creation
DO $$ 
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check orphaned student references
  SELECT COUNT(*) INTO orphaned_count
  FROM public.leads_new l
  WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = l.student_id);
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % leads with invalid student references', orphaned_count;
  END IF;

  -- Check orphaned co_applicant references
  SELECT COUNT(*) INTO orphaned_count
  FROM public.leads_new l
  WHERE NOT EXISTS (SELECT 1 FROM public.co_applicants c WHERE c.id = l.co_applicant_id);
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % leads with invalid co_applicant references', orphaned_count;
  END IF;

  -- Check orphaned partner references
  SELECT COUNT(*) INTO orphaned_count
  FROM public.leads_new l
  WHERE l.partner_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.id = l.partner_id);
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % leads with invalid partner references', orphaned_count;
  END IF;

  -- Check orphaned lender references
  SELECT COUNT(*) INTO orphaned_count
  FROM public.leads_new l
  WHERE NOT EXISTS (SELECT 1 FROM public.lenders le WHERE le.id = l.lender_id);
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % leads with invalid lender references', orphaned_count;
  END IF;

  RAISE NOTICE 'Data integrity check completed';
END $$;

-- Step 2: Drop any existing foreign key constraints (to avoid conflicts)
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_student;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_co_applicant;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_partner;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_lender;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_student;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_co_applicant;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_partner;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_lender;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS leads_new_student_id_fkey;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS leads_new_co_applicant_id_fkey;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS leads_new_partner_id_fkey;
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS leads_new_lender_id_fkey;

-- Step 3: Add NEW foreign key constraints with proper naming
ALTER TABLE public.leads_new
  ADD CONSTRAINT leads_new_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES public.students(id) 
  ON DELETE RESTRICT;

ALTER TABLE public.leads_new
  ADD CONSTRAINT leads_new_co_applicant_id_fkey 
  FOREIGN KEY (co_applicant_id) 
  REFERENCES public.co_applicants(id) 
  ON DELETE RESTRICT;

ALTER TABLE public.leads_new
  ADD CONSTRAINT leads_new_partner_id_fkey 
  FOREIGN KEY (partner_id) 
  REFERENCES public.partners(id) 
  ON DELETE RESTRICT;

ALTER TABLE public.leads_new
  ADD CONSTRAINT leads_new_lender_id_fkey 
  FOREIGN KEY (lender_id) 
  REFERENCES public.lenders(id) 
  ON DELETE RESTRICT;

-- Step 4: Add indexes on foreign key columns for better join performance
CREATE INDEX IF NOT EXISTS idx_leads_new_student_id ON public.leads_new(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_co_applicant_id ON public.leads_new(co_applicant_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_id ON public.leads_new(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_lender_id ON public.leads_new(lender_id);

-- Step 5: Ensure lead_documents also has proper FK to leads_new
ALTER TABLE public.lead_documents DROP CONSTRAINT IF EXISTS lead_documents_lead_id_fkey;
ALTER TABLE public.lead_documents DROP CONSTRAINT IF EXISTS fk_lead_documents_lead;

ALTER TABLE public.lead_documents
  ADD CONSTRAINT lead_documents_lead_id_fkey 
  FOREIGN KEY (lead_id) 
  REFERENCES public.leads_new(id) 
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);

-- Step 6: Add indexes on commonly queried columns for dashboard performance
CREATE INDEX IF NOT EXISTS idx_leads_new_status ON public.leads_new(status);
CREATE INDEX IF NOT EXISTS idx_leads_new_documents_status ON public.leads_new(documents_status);
CREATE INDEX IF NOT EXISTS idx_leads_new_created_at ON public.leads_new(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_status ON public.leads_new(partner_id, status);