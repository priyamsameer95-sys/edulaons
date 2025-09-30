-- ============================================
-- COMPREHENSIVE SCHEMA REFACTOR & OPTIMIZATION (SAFE VERSION)
-- ============================================
-- This migration adds missing constraints, indexes, and optimizations
-- while checking for existing objects to prevent conflicts

-- ============================================
-- PART 1: ADD MISSING FOREIGN KEY CONSTRAINTS (IF NOT EXISTS)
-- ============================================

-- Helper function to check if constraint exists
DO $$
BEGIN
    -- Add foreign key to leads_new.co_applicant_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_leads_co_applicant' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT fk_leads_co_applicant 
          FOREIGN KEY (co_applicant_id) REFERENCES public.co_applicants(id) ON DELETE RESTRICT;
    END IF;

    -- Add foreign key to leads_new.partner_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_leads_partner' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT fk_leads_partner 
          FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE RESTRICT;
    END IF;

    -- Add foreign key to leads_new.lender_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_leads_lender' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT fk_leads_lender 
          FOREIGN KEY (lender_id) REFERENCES public.lenders(id) ON DELETE RESTRICT;
    END IF;

    -- Add foreign key to academic_tests.student_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_academic_tests_student' AND conrelid = 'public.academic_tests'::regclass
    ) THEN
        ALTER TABLE public.academic_tests 
          ADD CONSTRAINT fk_academic_tests_student 
          FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to lead_documents.lead_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_lead_documents_lead' AND conrelid = 'public.lead_documents'::regclass
    ) THEN
        ALTER TABLE public.lead_documents 
          ADD CONSTRAINT fk_lead_documents_lead 
          FOREIGN KEY (lead_id) REFERENCES public.leads_new(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to lead_documents.document_type_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_lead_documents_document_type' AND conrelid = 'public.lead_documents'::regclass
    ) THEN
        ALTER TABLE public.lead_documents 
          ADD CONSTRAINT fk_lead_documents_document_type 
          FOREIGN KEY (document_type_id) REFERENCES public.document_types(id) ON DELETE RESTRICT;
    END IF;

    -- Add foreign key to lead_status_history.lead_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_lead_status_history_lead' AND conrelid = 'public.lead_status_history'::regclass
    ) THEN
        ALTER TABLE public.lead_status_history 
          ADD CONSTRAINT fk_lead_status_history_lead 
          FOREIGN KEY (lead_id) REFERENCES public.leads_new(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to lead_universities.lead_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_lead_universities_lead' AND conrelid = 'public.lead_universities'::regclass
    ) THEN
        ALTER TABLE public.lead_universities 
          ADD CONSTRAINT fk_lead_universities_lead 
          FOREIGN KEY (lead_id) REFERENCES public.leads_new(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to lead_universities.university_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_lead_universities_university' AND conrelid = 'public.lead_universities'::regclass
    ) THEN
        ALTER TABLE public.lead_universities 
          ADD CONSTRAINT fk_lead_universities_university 
          FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE RESTRICT;
    END IF;

    -- Add foreign key to courses.university_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_courses_university' AND conrelid = 'public.courses'::regclass
    ) THEN
        ALTER TABLE public.courses 
          ADD CONSTRAINT fk_courses_university 
          FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to app_users.partner_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_app_users_partner' AND conrelid = 'public.app_users'::regclass
    ) THEN
        ALTER TABLE public.app_users 
          ADD CONSTRAINT fk_app_users_partner 
          FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- PART 2: CREATE PERFORMANCE INDEXES
-- ============================================

-- Indexes for leads_new table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_id ON public.leads_new(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_student_id ON public.leads_new(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_lender_id ON public.leads_new(lender_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_status ON public.leads_new(status);
CREATE INDEX IF NOT EXISTS idx_leads_new_documents_status ON public.leads_new(documents_status);
CREATE INDEX IF NOT EXISTS idx_leads_new_created_at ON public.leads_new(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_new_updated_at ON public.leads_new(updated_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_status 
  ON public.leads_new(partner_id, status) 
  WHERE partner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_new_partner_created 
  ON public.leads_new(partner_id, created_at DESC) 
  WHERE partner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_new_status_updated 
  ON public.leads_new(status, status_updated_at DESC);

-- Indexes for lead_documents (document verification queries)
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_verification_status ON public.lead_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_lead_documents_uploaded_at ON public.lead_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_documents_document_type_id ON public.lead_documents(document_type_id);

-- Composite index for document verification workflows
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_verification 
  ON public.lead_documents(lead_id, verification_status, uploaded_at DESC);

-- Indexes for lead_status_history (activity feeds and audit trails)
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_created_at ON public.lead_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_by ON public.lead_status_history(changed_by);

-- Composite index for activity queries
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_created 
  ON public.lead_status_history(lead_id, created_at DESC);

-- Indexes for students (lookups by email/phone)
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);

-- Indexes for partners (active partner lookups)
CREATE INDEX IF NOT EXISTS idx_partners_partner_code ON public.partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active) WHERE is_active = true;

-- Indexes for app_users (authentication and role checks)
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_partner_id ON public.app_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_active_role 
  ON public.app_users(role, is_active) 
  WHERE is_active = true;

-- Indexes for academic_tests
CREATE INDEX IF NOT EXISTS idx_academic_tests_student_id ON public.academic_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_tests_test_type ON public.academic_tests(test_type);

-- Indexes for universities (search and filter)
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);

-- Indexes for courses (program search)
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_study_level ON public.courses(study_level);
CREATE INDEX IF NOT EXISTS idx_courses_stream_name ON public.courses(stream_name);

-- Indexes for data_access_logs (audit trail queries)
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON public.data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_accessed_at ON public.data_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_table_name ON public.data_access_logs(table_name);

-- ============================================
-- PART 3: OPTIMIZE RLS POLICIES WITH INDEXES
-- ============================================

-- Create index to support partner-based RLS policies
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_rls 
  ON public.leads_new(partner_id, id) 
  WHERE partner_id IS NOT NULL;

-- Create index to support document RLS lookups
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_rls 
  ON public.lead_documents(lead_id, id);

-- ============================================
-- PART 4: ADD MATERIALIZED VIEW FOR ANALYTICS
-- ============================================

-- Create materialized view for partner statistics (improves dashboard performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.partner_statistics AS
SELECT 
  p.id as partner_id,
  p.name as partner_name,
  p.partner_code,
  COUNT(l.id) as total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'new') as new_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'in_progress') as in_progress_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'approved') as approved_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'rejected') as rejected_leads,
  SUM(l.loan_amount) as total_loan_amount,
  SUM(l.loan_amount) FILTER (WHERE l.status = 'approved') as approved_loan_amount,
  MAX(l.created_at) as last_lead_date,
  COUNT(DISTINCT l.lender_id) as active_lenders
FROM public.partners p
LEFT JOIN public.leads_new l ON p.id = l.partner_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.partner_code;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_statistics_partner_id 
  ON public.partner_statistics(partner_id);

-- Create function to refresh partner statistics
CREATE OR REPLACE FUNCTION public.refresh_partner_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.partner_statistics;
END;
$$;

-- ============================================
-- PART 5: ADD VALIDATION CONSTRAINTS (IF NOT EXISTS)
-- ============================================

DO $$
BEGIN
    -- Add check constraint for loan amount if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_loan_amount_positive' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT check_loan_amount_positive 
          CHECK (loan_amount > 0);
    END IF;

    -- Add check constraint for salary if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_salary_positive' AND conrelid = 'public.co_applicants'::regclass
    ) THEN
        ALTER TABLE public.co_applicants 
          ADD CONSTRAINT check_salary_positive 
          CHECK (salary >= 0);
    END IF;

    -- Add check constraint for file size if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_file_size_positive' AND conrelid = 'public.lead_documents'::regclass
    ) THEN
        ALTER TABLE public.lead_documents 
          ADD CONSTRAINT check_file_size_positive 
          CHECK (file_size > 0);
    END IF;

    -- Add check constraint for intake month if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_intake_month_valid' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT check_intake_month_valid 
          CHECK (intake_month IS NULL OR (intake_month >= 1 AND intake_month <= 12));
    END IF;

    -- Add check constraint for intake year if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_intake_year_reasonable' AND conrelid = 'public.leads_new'::regclass
    ) THEN
        ALTER TABLE public.leads_new 
          ADD CONSTRAINT check_intake_year_reasonable 
          CHECK (intake_year IS NULL OR (intake_year >= 2020 AND intake_year <= 2030));
    END IF;
END $$;

-- ============================================
-- PART 6: OPTIMIZE EXISTING FUNCTIONS
-- ============================================

-- Optimize the has_role function with better performance
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Optimize get_user_partner function
CREATE OR REPLACE FUNCTION public.get_user_partner(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id
  FROM public.app_users
  WHERE id = _user_id
    AND is_active = true
    AND partner_id IS NOT NULL
  LIMIT 1
$$;

-- ============================================
-- PART 7: ADD HELPFUL STATISTICS FUNCTIONS
-- ============================================

-- Function to get lead statistics for a partner
CREATE OR REPLACE FUNCTION public.get_partner_lead_stats(_partner_id uuid)
RETURNS TABLE (
  total_leads bigint,
  new_leads bigint,
  in_progress_leads bigint,
  approved_leads bigint,
  rejected_leads bigint,
  total_loan_amount numeric,
  approved_loan_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::bigint as total_leads,
    COUNT(*) FILTER (WHERE status = 'new')::bigint as new_leads,
    COUNT(*) FILTER (WHERE status = 'in_progress')::bigint as in_progress_leads,
    COUNT(*) FILTER (WHERE status = 'approved')::bigint as approved_leads,
    COUNT(*) FILTER (WHERE status = 'rejected')::bigint as rejected_leads,
    SUM(loan_amount) as total_loan_amount,
    SUM(loan_amount) FILTER (WHERE status = 'approved') as approved_loan_amount
  FROM public.leads_new
  WHERE partner_id = _partner_id;
$$;

-- ============================================
-- PART 8: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update statistics for query planner optimization
ANALYZE public.leads_new;
ANALYZE public.lead_documents;
ANALYZE public.lead_status_history;
ANALYZE public.students;
ANALYZE public.partners;
ANALYZE public.app_users;

-- ============================================
-- PART 9: GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant permissions on materialized view
GRANT SELECT ON public.partner_statistics TO authenticated;
GRANT SELECT ON public.partner_statistics TO anon;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.refresh_partner_statistics() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_partner_lead_stats(uuid) TO authenticated;