-- Database Refactoring: Normalization, Naming Conventions, and Performance Optimization

-- Step 1: Add indexes on foreign keys for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_new_student_id ON public.leads_new(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_co_applicant_id ON public.leads_new(co_applicant_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_id ON public.leads_new(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_lender_id ON public.leads_new(lender_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_status ON public.leads_new(status);
CREATE INDEX IF NOT EXISTS idx_leads_new_documents_status ON public.leads_new(documents_status);
CREATE INDEX IF NOT EXISTS idx_leads_new_created_at ON public.leads_new(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_new_case_id ON public.leads_new(case_id);

-- Step 2: Add indexes on lead_documents for performance
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_document_type_id ON public.lead_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_verification_status ON public.lead_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_lead_documents_uploaded_at ON public.lead_documents(uploaded_at);

-- Step 3: Add indexes on academic_tests
CREATE INDEX IF NOT EXISTS idx_academic_tests_student_id ON public.academic_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_tests_test_type ON public.academic_tests(test_type);

-- Step 4: Add indexes on lead_status_history
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_created_at ON public.lead_status_history(created_at);

-- Step 5: Add indexes on lead_universities junction table
CREATE INDEX IF NOT EXISTS idx_lead_universities_lead_id ON public.lead_universities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_universities_university_id ON public.lead_universities(university_id);

-- Step 6: Add indexes on courses
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_study_level ON public.courses(study_level);
CREATE INDEX IF NOT EXISTS idx_courses_stream_name ON public.courses(stream_name);

-- Step 7: Add indexes on universities for search performance
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_global_rank ON public.universities(global_rank);
CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);

-- Step 8: Add indexes on students for search
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);

-- Step 9: Add indexes on partners
CREATE INDEX IF NOT EXISTS idx_partners_partner_code ON public.partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_partners_email ON public.partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);

-- Step 10: Add indexes on app_users
CREATE INDEX IF NOT EXISTS idx_app_users_partner_id ON public.app_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON public.app_users(is_active);

-- Step 11: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_status ON public.leads_new(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_created ON public.leads_new(partner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_verification ON public.lead_documents(lead_id, verification_status);

-- Step 12: Drop the old deprecated leads table (after confirming data migration is complete)
-- This table is no longer used as all data has been migrated to leads_new
DROP TABLE IF EXISTS public.leads CASCADE;

-- Step 13: Add comments to tables for documentation
COMMENT ON TABLE public.leads_new IS 'Main leads table containing loan applications with normalized relationships';
COMMENT ON TABLE public.students IS 'Normalized student information';
COMMENT ON TABLE public.co_applicants IS 'Normalized co-applicant (guarantor) information';
COMMENT ON TABLE public.partners IS 'Partner organizations that submit leads';
COMMENT ON TABLE public.lenders IS 'Financial institutions offering loans';
COMMENT ON TABLE public.lead_documents IS 'Documents associated with leads';
COMMENT ON TABLE public.lead_status_history IS 'Audit trail for lead status changes';
COMMENT ON TABLE public.academic_tests IS 'Student test scores (IELTS, TOEFL, etc.)';
COMMENT ON TABLE public.lead_universities IS 'Many-to-many relationship between leads and universities';

-- Step 14: Ensure all foreign keys have proper ON DELETE behavior
-- Already configured, but documenting the referential integrity rules:
-- - students, co_applicants, partners, lenders: Should NOT be deleted if referenced by leads
-- - lead_documents, lead_status_history: CASCADE delete when lead is deleted
-- - academic_tests: CASCADE delete when student is deleted