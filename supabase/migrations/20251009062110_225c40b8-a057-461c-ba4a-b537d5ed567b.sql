-- Manual cascade delete for test data cleanup
-- Delete all related records first, then the student

DO $$
DECLARE
  v_student_id UUID;
  v_lead_ids UUID[];
  v_co_applicant_ids UUID[];
  v_counts RECORD;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id
  FROM students
  WHERE email = 'priyam.sameer.khet@gmail.com';
  
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'No student found with email priyam.sameer.khet@gmail.com';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found student: %', v_student_id;
  
  -- Get all lead IDs and co-applicant IDs for this student
  SELECT 
    array_agg(DISTINCT id),
    array_agg(DISTINCT co_applicant_id)
  INTO v_lead_ids, v_co_applicant_ids
  FROM leads_new
  WHERE student_id = v_student_id;
  
  RAISE NOTICE 'Found % leads to delete', array_length(v_lead_ids, 1);
  
  -- Delete in correct order (children first):
  
  -- 1. Delete lead_documents (references leads_new)
  DELETE FROM lead_documents WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted lead_documents';
  
  -- 2. Delete lead_universities (references leads_new)
  DELETE FROM lead_universities WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted lead_universities';
  
  -- 3. Delete application_activities (references leads_new)
  DELETE FROM application_activities WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted application_activities';
  
  -- 4. Delete application_comments (references leads_new)
  DELETE FROM application_comments WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted application_comments';
  
  -- 5. Delete lead_status_history (references leads_new)
  DELETE FROM lead_status_history WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted lead_status_history';
  
  -- 6. Delete lender_assignment_history (references leads_new)
  DELETE FROM lender_assignment_history WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted lender_assignment_history';
  
  -- 7. Delete notifications (references leads_new, nullable)
  DELETE FROM notifications WHERE lead_id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted notifications';
  
  -- 8. Delete academic_tests (references students)
  DELETE FROM academic_tests WHERE student_id = v_student_id;
  RAISE NOTICE '  ✓ Deleted academic_tests';
  
  -- 9. Delete leads_new records
  DELETE FROM leads_new WHERE id = ANY(v_lead_ids);
  RAISE NOTICE '  ✓ Deleted % leads', array_length(v_lead_ids, 1);
  
  -- 10. Delete co_applicants (now safe as leads_new deleted)
  DELETE FROM co_applicants WHERE id = ANY(v_co_applicant_ids);
  RAISE NOTICE '  ✓ Deleted % co_applicants', array_length(v_co_applicant_ids, 1);
  
  -- 11. Finally delete the student
  DELETE FROM students WHERE id = v_student_id;
  RAISE NOTICE '  ✓ Deleted student';
  
  RAISE NOTICE '✅ CLEANUP COMPLETE for priyam.sameer.khet@gmail.com';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during cleanup: %', SQLERRM;
    RAISE;
END $$;