
-- Delete all lead-related data in correct order (respecting foreign keys)

-- Step 1: Delete dependent junction/history tables
DELETE FROM lead_courses;
DELETE FROM lead_universities;
DELETE FROM eligibility_scores;
DELETE FROM lead_status_history;
DELETE FROM lead_documents;
DELETE FROM application_activities;
DELETE FROM application_comments;
DELETE FROM lender_assignment_history;
DELETE FROM notifications WHERE lead_id IS NOT NULL;

-- Step 2: Delete main leads table
DELETE FROM leads_new;

-- Step 3: Delete related entities (no longer referenced)
DELETE FROM co_applicants;
DELETE FROM academic_tests;
DELETE FROM students;
