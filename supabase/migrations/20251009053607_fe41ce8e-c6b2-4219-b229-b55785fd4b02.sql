-- Step 1: Clean up temp placeholder emails completely
-- First, delete lead_universities for leads with temp emails
DELETE FROM lead_universities 
WHERE lead_id IN (
  SELECT l.id FROM leads_new l
  JOIN students s ON l.student_id = s.id
  WHERE s.email LIKE '%@temp.placeholder'
);

-- Delete academic_tests for temp students
DELETE FROM academic_tests 
WHERE student_id IN (
  SELECT id FROM students 
  WHERE email LIKE '%@temp.placeholder'
);

-- Store co_applicant_ids we need to delete after
CREATE TEMP TABLE temp_co_applicants_to_delete AS
SELECT DISTINCT co_applicant_id FROM leads_new l
JOIN students s ON l.student_id = s.id
WHERE s.email LIKE '%@temp.placeholder';

-- Delete leads with temp emails
DELETE FROM leads_new 
WHERE student_id IN (
  SELECT id FROM students 
  WHERE email LIKE '%@temp.placeholder'
);

-- Delete co_applicants
DELETE FROM co_applicants 
WHERE id IN (SELECT co_applicant_id FROM temp_co_applicants_to_delete);

-- Delete temp students
DELETE FROM students 
WHERE email LIKE '%@temp.placeholder';

-- Step 2: Handle regular email duplicates
-- Update leads to point to the most recent student record per email
WITH duplicate_students AS (
  SELECT 
    email,
    ARRAY_AGG(id ORDER BY created_at DESC) as student_ids,
    (ARRAY_AGG(id ORDER BY created_at DESC))[1] as keep_id
  FROM students
  GROUP BY email
  HAVING COUNT(*) > 1
)
UPDATE leads_new
SET student_id = ds.keep_id
FROM duplicate_students ds
WHERE leads_new.student_id = ANY(ds.student_ids)
  AND leads_new.student_id != ds.keep_id;

-- Delete duplicate student records (keeping the most recent)
WITH duplicate_students AS (
  SELECT 
    email,
    ARRAY_AGG(id ORDER BY created_at DESC) as student_ids
  FROM students
  GROUP BY email
  HAVING COUNT(*) > 1
)
DELETE FROM students
WHERE id IN (
  SELECT UNNEST(student_ids[2:])
  FROM duplicate_students
);

-- Step 3: Add unique constraint
ALTER TABLE students ADD CONSTRAINT students_email_unique UNIQUE (email);