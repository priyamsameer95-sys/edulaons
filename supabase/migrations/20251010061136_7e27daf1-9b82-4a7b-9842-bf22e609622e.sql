-- Remove duplicate foreign key constraint on leads_new.student_id
-- This resolves PGRST201 "ambiguous relationship" error for students table
ALTER TABLE leads_new DROP CONSTRAINT IF EXISTS fk_leads_new_student;

-- Verify only one FK remains (leads_new_student_id_fkey)
-- Run this to check: SELECT conname FROM pg_constraint WHERE conname LIKE '%leads_new%student%';