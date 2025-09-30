-- Phase 1: Add Foreign Key Constraints to enable Supabase nested queries

-- First, check for and clean up any orphaned records
-- Remove leads_new records with invalid student_id references
DELETE FROM public.leads_new 
WHERE student_id NOT IN (SELECT id FROM public.students);

-- Remove leads_new records with invalid co_applicant_id references
DELETE FROM public.leads_new 
WHERE co_applicant_id NOT IN (SELECT id FROM public.co_applicants);

-- Remove leads_new records with invalid lender_id references
DELETE FROM public.leads_new 
WHERE lender_id NOT IN (SELECT id FROM public.lenders);

-- Remove leads_new records with invalid partner_id references (where partner_id is not null)
DELETE FROM public.leads_new 
WHERE partner_id IS NOT NULL 
AND partner_id NOT IN (SELECT id FROM public.partners);

-- Now add the foreign key constraints
-- This will enable Supabase nested queries to work properly

-- Add foreign key for student_id
ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_new_student 
FOREIGN KEY (student_id) 
REFERENCES public.students(id) 
ON DELETE CASCADE;

-- Add foreign key for co_applicant_id
ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_new_co_applicant 
FOREIGN KEY (co_applicant_id) 
REFERENCES public.co_applicants(id) 
ON DELETE CASCADE;

-- Add foreign key for lender_id
ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_new_lender 
FOREIGN KEY (lender_id) 
REFERENCES public.lenders(id) 
ON DELETE RESTRICT;

-- Add foreign key for partner_id (nullable)
ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_new_partner 
FOREIGN KEY (partner_id) 
REFERENCES public.partners(id) 
ON DELETE SET NULL;

-- Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_leads_new_student_id ON public.leads_new(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_co_applicant_id ON public.leads_new(co_applicant_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_lender_id ON public.leads_new(lender_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_id ON public.leads_new(partner_id);