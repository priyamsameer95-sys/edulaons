-- Step 1: Delete duplicate student records (keep oldest by created_at)
-- First, check if duplicates have leads associated
WITH ranked_students AS (
  SELECT 
    id,
    phone,
    email,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM students
  WHERE phone IS NOT NULL AND phone != ''
),
duplicates_to_delete AS (
  SELECT id FROM ranked_students WHERE rn > 1
),
-- Check for leads associated with duplicates
leads_to_update AS (
  SELECT ln.id as lead_id, ln.student_id, rs.id as keep_student_id
  FROM leads_new ln
  JOIN ranked_students rs ON ln.student_id IN (SELECT id FROM duplicates_to_delete)
  JOIN ranked_students rs2 ON rs2.phone = (SELECT phone FROM students WHERE id = ln.student_id)
  WHERE rs2.rn = 1
)
-- First update leads to point to the original student
UPDATE leads_new ln
SET student_id = (
  SELECT r1.id 
  FROM ranked_students r1 
  WHERE r1.phone = (SELECT phone FROM students WHERE id = ln.student_id)
  AND r1.rn = 1
)
WHERE ln.student_id IN (SELECT id FROM duplicates_to_delete);

-- Step 2: Now delete the duplicate student records
WITH ranked_students AS (
  SELECT 
    id,
    phone,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM students
  WHERE phone IS NOT NULL AND phone != ''
)
DELETE FROM students 
WHERE id IN (SELECT id FROM ranked_students WHERE rn > 1);

-- Step 3: Add unique constraint on phone
ALTER TABLE students ADD CONSTRAINT students_phone_unique UNIQUE (phone);