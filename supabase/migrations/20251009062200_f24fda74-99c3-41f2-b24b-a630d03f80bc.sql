-- Fix FK constraint to allow cascade delete, then clean up test data

-- Change leads_new → students FK to CASCADE instead of RESTRICT
ALTER TABLE leads_new
  DROP CONSTRAINT fk_leads_new_student,
  ADD CONSTRAINT fk_leads_new_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- Also fix co_applicants constraint
ALTER TABLE leads_new
  DROP CONSTRAINT fk_leads_new_co_applicant,
  ADD CONSTRAINT fk_leads_new_co_applicant
    FOREIGN KEY (co_applicant_id)
    REFERENCES co_applicants(id)
    ON DELETE CASCADE;

-- Now safely delete test data
DO $$
DECLARE
  v_student_id UUID;
  v_lead_count INT;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE email = 'priyam.sameer.khet@gmail.com';
  
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'No test data found for priyam.sameer.khet@gmail.com';
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO v_lead_count FROM leads_new WHERE student_id = v_student_id;
  
  RAISE NOTICE 'Cleaning up: % leads for student %', v_lead_count, v_student_id;
  
  -- This will now cascade properly
  DELETE FROM students WHERE id = v_student_id;
  
  RAISE NOTICE '✅ Test data deleted: 1 student + % leads + related records', v_lead_count;
END $$;