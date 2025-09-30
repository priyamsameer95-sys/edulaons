-- Fix foreign key constraints in lead_universities table
-- Drop old foreign keys pointing to the wrong table
ALTER TABLE public.lead_universities 
  DROP CONSTRAINT IF EXISTS lead_universities_Global_uni_Rank_fkey;
  
ALTER TABLE public.lead_universities 
  DROP CONSTRAINT IF EXISTS fk_lead_universities_lead_id;

-- Add correct foreign key pointing to leads_new table
ALTER TABLE public.lead_universities 
  ADD CONSTRAINT fk_lead_universities_lead_id 
  FOREIGN KEY (lead_id) REFERENCES public.leads_new(id) ON DELETE CASCADE;