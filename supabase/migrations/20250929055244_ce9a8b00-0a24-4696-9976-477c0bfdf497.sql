-- Insert lenders only if they don't exist
INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT 'HDFC Credila', 'HDFC_CREDILA', 'HDFC Education Loan provider', 'https://www.hdfccredila.com', 'info@hdfccredila.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = 'HDFC_CREDILA');

INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT 'ICICI Bank', 'ICICI', 'ICICI Bank Education Loans', 'https://www.icicibank.com', 'education@icicibank.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = 'ICICI');

INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT 'SBI', 'SBI', 'State Bank of India Education Loans', 'https://www.sbi.co.in', 'education@sbi.co.in', true
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = 'SBI');

INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT 'Axis Bank', 'AXIS', 'Axis Bank Education Loans', 'https://www.axisbank.com', 'education@axisbank.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = 'AXIS');

INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT 'Punjab National Bank', 'PNB', 'PNB Education Loans', 'https://www.pnbindia.in', 'education@pnb.co.in', true
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = 'PNB');

-- Insert partners only if they don't exist
INSERT INTO public.partners (name, email, phone, address, is_active) 
SELECT 'Study Abroad Consultants', 'info@studyabroad.com', '+91-9876543210', 'Mumbai, Maharashtra', true
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE email = 'info@studyabroad.com');

INSERT INTO public.partners (name, email, phone, address, is_active) 
SELECT 'Global Education Partners', 'contact@globaledu.com', '+91-9876543211', 'Delhi, India', true
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE email = 'contact@globaledu.com');

INSERT INTO public.partners (name, email, phone, address, is_active) 
SELECT 'Overseas Education Experts', 'hello@overseas.edu', '+91-9876543212', 'Bangalore, Karnataka', true
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE email = 'hello@overseas.edu');

-- Recreate the migration function with better error handling
CREATE OR REPLACE FUNCTION migrate_existing_leads_safe()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  lead_record RECORD;
  student_id UUID;
  co_applicant_id UUID;
  lender_id UUID;
  default_partner_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Get default lender and partner IDs
  SELECT id INTO lender_id FROM public.lenders WHERE code = 'HDFC_CREDILA' LIMIT 1;
  SELECT id INTO default_partner_id FROM public.partners LIMIT 1;
  
  -- Only migrate leads that haven't been migrated yet
  FOR lead_record IN 
    SELECT * FROM public.leads 
    WHERE id NOT IN (SELECT id FROM public.leads_new)
  LOOP
    -- Create student record
    INSERT INTO public.students (
      name, email, phone, date_of_birth, nationality, country
    ) VALUES (
      lead_record.student_name,
      lead_record.student_email,
      lead_record.student_phone,
      lead_record.student_dob,
      'Indian', -- Default nationality
      'India' -- Default country
    ) RETURNING id INTO student_id;
    
    -- Create co-applicant record
    INSERT INTO public.co_applicants (
      name, relationship, salary, pin_code
    ) VALUES (
      lead_record.co_applicant_name,
      CASE 
        WHEN LOWER(lead_record.co_applicant_relationship) = 'parent' THEN 'parent'::relationship_enum
        WHEN LOWER(lead_record.co_applicant_relationship) = 'spouse' THEN 'spouse'::relationship_enum
        WHEN LOWER(lead_record.co_applicant_relationship) = 'sibling' THEN 'sibling'::relationship_enum
        WHEN LOWER(lead_record.co_applicant_relationship) = 'guardian' THEN 'guardian'::relationship_enum
        ELSE 'other'::relationship_enum
      END,
      lead_record.co_applicant_salary,
      lead_record.co_applicant_pin
    ) RETURNING id INTO co_applicant_id;
    
    -- Get appropriate lender based on existing lender field
    SELECT id INTO lender_id FROM public.lenders 
    WHERE UPPER(name) LIKE '%' || UPPER(lead_record.lender) || '%' 
    LIMIT 1;
    
    -- If no matching lender found, use default
    IF lender_id IS NULL THEN
      SELECT id INTO lender_id FROM public.lenders WHERE code = 'HDFC_CREDILA' LIMIT 1;
    END IF;
    
    -- Create new lead record
    INSERT INTO public.leads_new (
      id,
      case_id,
      student_id,
      co_applicant_id,
      partner_id,
      lender_id,
      loan_amount,
      loan_type,
      study_destination,
      intake_month,
      intake_year,
      status,
      documents_status,
      created_at,
      updated_at
    ) VALUES (
      lead_record.id,
      lead_record.case_id,
      student_id,
      co_applicant_id,
      default_partner_id,
      lender_id,
      lead_record.loan_amount,
      CASE 
        WHEN LOWER(lead_record.loan_type) = 'secured' THEN 'secured'::loan_type_enum
        WHEN LOWER(lead_record.loan_type) = 'unsecured' THEN 'unsecured'::loan_type_enum
        ELSE 'secured'::loan_type_enum
      END,
      CASE 
        WHEN UPPER(lead_record.study_destination) IN ('AUSTRALIA', 'CANADA', 'GERMANY', 'IRELAND', 'NEW ZEALAND', 'UK', 'USA') 
        THEN lead_record.study_destination::study_destination_enum
        ELSE 'Other'::study_destination_enum
      END,
      lead_record.intake_month,
      lead_record.intake_year,
      CASE 
        WHEN LOWER(lead_record.status) = 'new' THEN 'new'::lead_status_enum
        WHEN LOWER(lead_record.status) = 'in_progress' THEN 'in_progress'::lead_status_enum
        WHEN LOWER(lead_record.status) = 'approved' THEN 'approved'::lead_status_enum
        WHEN LOWER(lead_record.status) = 'rejected' THEN 'rejected'::lead_status_enum
        ELSE 'new'::lead_status_enum
      END,
      CASE 
        WHEN LOWER(lead_record.documents_status) = 'pending' THEN 'pending'::document_status_enum
        WHEN LOWER(lead_record.documents_status) = 'uploaded' THEN 'uploaded'::document_status_enum
        WHEN LOWER(lead_record.documents_status) = 'verified' THEN 'verified'::document_status_enum
        ELSE 'pending'::document_status_enum
      END,
      lead_record.created_at,
      lead_record.updated_at
    );
    
    -- Create academic test record if test data exists
    IF lead_record.test_type IS NOT NULL AND lead_record.test_score IS NOT NULL THEN
      INSERT INTO public.academic_tests (
        student_id,
        test_type,
        score
      ) VALUES (
        student_id,
        CASE 
          WHEN UPPER(lead_record.test_type) IN ('IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT', 'SAT') 
          THEN lead_record.test_type::test_type_enum
          ELSE 'Other'::test_type_enum
        END,
        lead_record.test_score
      );
    END IF;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully. Migrated % leads.', migrated_count;
END;
$$;

-- Execute the safe migration function
SELECT migrate_existing_leads_safe();