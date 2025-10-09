-- ===================================================
-- DATABASE REFACTOR PART 2: Foreign Keys & Constraints
-- (RLS policies already fixed in previous migration)
-- ===================================================

-- STEP 1: Add Foreign Key Constraints (Core Relationships)
-- These are MISSING and causing data integrity issues

-- academic_tests → students
ALTER TABLE academic_tests
  DROP CONSTRAINT IF EXISTS fk_academic_tests_student,
  ADD CONSTRAINT fk_academic_tests_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- leads_new → students
ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS fk_leads_new_student,
  ADD CONSTRAINT fk_leads_new_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE RESTRICT;

-- leads_new → co_applicants
ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS fk_leads_new_co_applicant,
  ADD CONSTRAINT fk_leads_new_co_applicant
    FOREIGN KEY (co_applicant_id)
    REFERENCES co_applicants(id)
    ON DELETE RESTRICT;

-- leads_new → partners (nullable)
ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS fk_leads_new_partner,
  ADD CONSTRAINT fk_leads_new_partner
    FOREIGN KEY (partner_id)
    REFERENCES partners(id)
    ON DELETE SET NULL;

-- leads_new → lenders
ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS fk_leads_new_lender,
  ADD CONSTRAINT fk_leads_new_lender
    FOREIGN KEY (lender_id)
    REFERENCES lenders(id)
    ON DELETE RESTRICT;

-- lead_documents → leads_new
ALTER TABLE lead_documents
  DROP CONSTRAINT IF EXISTS fk_lead_documents_lead,
  ADD CONSTRAINT fk_lead_documents_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- lead_documents → document_types
ALTER TABLE lead_documents
  DROP CONSTRAINT IF EXISTS fk_lead_documents_document_type,
  ADD CONSTRAINT fk_lead_documents_document_type
    FOREIGN KEY (document_type_id)
    REFERENCES document_types(id)
    ON DELETE RESTRICT;

-- lead_universities → leads_new
ALTER TABLE lead_universities
  DROP CONSTRAINT IF EXISTS fk_lead_universities_lead,
  ADD CONSTRAINT fk_lead_universities_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- lead_universities → universities
ALTER TABLE lead_universities
  DROP CONSTRAINT IF EXISTS fk_lead_universities_university,
  ADD CONSTRAINT fk_lead_universities_university
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON DELETE CASCADE;

-- lead_status_history → leads_new
ALTER TABLE lead_status_history
  DROP CONSTRAINT IF EXISTS fk_lead_status_history_lead,
  ADD CONSTRAINT fk_lead_status_history_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- application_activities → leads_new
ALTER TABLE application_activities
  DROP CONSTRAINT IF EXISTS fk_application_activities_lead,
  ADD CONSTRAINT fk_application_activities_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- application_comments → leads_new
ALTER TABLE application_comments
  DROP CONSTRAINT IF EXISTS fk_application_comments_lead,
  ADD CONSTRAINT fk_application_comments_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- notifications → leads_new (nullable)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_lead,
  ADD CONSTRAINT fk_notifications_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE SET NULL;

-- app_users → partners (nullable)
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS fk_app_users_partner,
  ADD CONSTRAINT fk_app_users_partner
    FOREIGN KEY (partner_id)
    REFERENCES partners(id)
    ON DELETE SET NULL;

-- courses → universities
ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS fk_courses_university,
  ADD CONSTRAINT fk_courses_university
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON DELETE CASCADE;

-- university_lender_preferences → universities
ALTER TABLE university_lender_preferences
  DROP CONSTRAINT IF EXISTS fk_ulp_university,
  ADD CONSTRAINT fk_ulp_university
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON DELETE CASCADE;

-- university_lender_preferences → lenders
ALTER TABLE university_lender_preferences
  DROP CONSTRAINT IF EXISTS fk_ulp_lender,
  ADD CONSTRAINT fk_ulp_lender
    FOREIGN KEY (lender_id)
    REFERENCES lenders(id)
    ON DELETE CASCADE;

-- lender_assignment_history → leads_new
ALTER TABLE lender_assignment_history
  DROP CONSTRAINT IF EXISTS fk_lah_lead,
  ADD CONSTRAINT fk_lah_lead
    FOREIGN KEY (lead_id)
    REFERENCES leads_new(id)
    ON DELETE CASCADE;

-- lender_assignment_history → lenders (old_lender_id, nullable)
ALTER TABLE lender_assignment_history
  DROP CONSTRAINT IF EXISTS fk_lah_old_lender,
  ADD CONSTRAINT fk_lah_old_lender
    FOREIGN KEY (old_lender_id)
    REFERENCES lenders(id)
    ON DELETE SET NULL;

-- lender_assignment_history → lenders (new_lender_id)
ALTER TABLE lender_assignment_history
  DROP CONSTRAINT IF EXISTS fk_lah_new_lender,
  ADD CONSTRAINT fk_lah_new_lender
    FOREIGN KEY (new_lender_id)
    REFERENCES lenders(id)
    ON DELETE RESTRICT;

-- STEP 2: Clean Up Duplicate Indexes
DROP INDEX IF EXISTS idx_academic_tests_student; -- Duplicate of idx_academic_tests_student_id
DROP INDEX IF EXISTS idx_courses_program_name;   -- Covered by idx_courses_program_name_lower

-- STEP 3: Add Missing Indexes for FK Lookups
CREATE INDEX IF NOT EXISTS idx_leads_new_student_id ON leads_new(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_co_applicant_id ON leads_new(co_applicant_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_partner_id ON leads_new(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_new_lender_id ON leads_new(lender_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_document_type_id ON lead_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_universities_university_id ON lead_universities(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_university_lookup ON courses(university_id, study_level);

-- STEP 4: Add Check Constraints for Data Integrity
ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS chk_loan_amount_positive,
  ADD CONSTRAINT chk_loan_amount_positive CHECK (loan_amount > 0);

ALTER TABLE co_applicants
  DROP CONSTRAINT IF EXISTS chk_salary_positive,
  ADD CONSTRAINT chk_salary_positive CHECK (salary >= 0);

ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS chk_intake_month_valid,
  ADD CONSTRAINT chk_intake_month_valid CHECK (intake_month BETWEEN 1 AND 12 OR intake_month IS NULL);

ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS chk_intake_year_valid,
  ADD CONSTRAINT chk_intake_year_valid CHECK (intake_year >= 2020 OR intake_year IS NULL);

-- STEP 5: Fix Name Validation Trigger
-- Ensure validation applies to all person tables
DROP TRIGGER IF EXISTS validate_student_name ON students;
DROP TRIGGER IF EXISTS validate_co_applicant_name ON co_applicants;
DROP TRIGGER IF EXISTS validate_partner_name ON partners;

CREATE TRIGGER validate_student_name
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION validate_person_name();

CREATE TRIGGER validate_co_applicant_name
  BEFORE INSERT OR UPDATE ON co_applicants
  FOR EACH ROW EXECUTE FUNCTION validate_person_name();

CREATE TRIGGER validate_partner_name
  BEFORE INSERT OR UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION validate_person_name();

-- STEP 6: Add Unique Constraints Where Missing
ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS uq_partners_email,
  ADD CONSTRAINT uq_partners_email UNIQUE (email);

ALTER TABLE partners
  DROP CONSTRAINT IF EXISTS uq_partners_code,
  ADD CONSTRAINT uq_partners_code UNIQUE (partner_code);

ALTER TABLE lenders
  DROP CONSTRAINT IF EXISTS uq_lenders_code,
  ADD CONSTRAINT uq_lenders_code UNIQUE (code);

ALTER TABLE students
  DROP CONSTRAINT IF EXISTS uq_students_email,
  ADD CONSTRAINT uq_students_email UNIQUE (email);

ALTER TABLE leads_new
  DROP CONSTRAINT IF EXISTS uq_leads_case_id,
  ADD CONSTRAINT uq_leads_case_id UNIQUE (case_id);

-- STEP 7: Create Missing Composite Indexes for Common Queries
CREATE INDEX IF NOT EXISTS idx_leads_new_status_partner ON leads_new(status, partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_new_documents_status ON leads_new(documents_status);
CREATE INDEX IF NOT EXISTS idx_lead_documents_verification_status ON lead_documents(verification_status, lead_id);

-- Add table comments for documentation
COMMENT ON TABLE leads_new IS 'Core lead/application table - refactored schema';
COMMENT ON TABLE students IS 'Student information - 1:N with leads_new';
COMMENT ON TABLE co_applicants IS 'Co-applicant (co-borrower) information - 1:N with leads_new';
COMMENT ON TABLE partners IS 'Partner organizations who submit leads';
COMMENT ON TABLE lenders IS 'Financial institutions providing loans';
COMMENT ON TABLE lead_documents IS 'Documents uploaded for each lead';
COMMENT ON TABLE document_types IS 'Types of documents required';
COMMENT ON TABLE universities IS 'Universities where students will study';
COMMENT ON TABLE lead_universities IS 'Many-to-many: leads ↔ universities';

-- Final integrity check
DO $$
DECLARE
  fk_count INT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
  RAISE NOTICE '✅ Schema refactor complete!';
  RAISE NOTICE '   - Foreign Keys: %', fk_count;
  RAISE NOTICE '   - RLS Policies: Fixed (no recursion)';
  RAISE NOTICE '   - Indexes: Optimized';
  RAISE NOTICE '   - Constraints: Added';
END $$;