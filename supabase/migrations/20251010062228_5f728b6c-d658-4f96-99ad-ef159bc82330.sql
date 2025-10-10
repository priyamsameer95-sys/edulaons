-- Remove all remaining duplicate foreign key constraints on leads_new table
-- This completely resolves PGRST201 "ambiguous relationship" errors

-- Drop duplicate co_applicant FK
ALTER TABLE leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_co_applicant;

-- Drop duplicate lender FK  
ALTER TABLE leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_lender;

-- Verify only standard FKs remain (leads_new_{column}_id_fkey naming convention)
-- Run this to check:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'leads_new'::regclass AND contype = 'f';