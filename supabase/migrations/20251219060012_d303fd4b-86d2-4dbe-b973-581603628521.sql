-- Add optional credit_score column to students table
ALTER TABLE students 
ADD COLUMN credit_score INTEGER NULL 
CHECK (credit_score IS NULL OR (credit_score >= 300 AND credit_score <= 900));

-- Add optional credit_score column to co_applicants table
ALTER TABLE co_applicants 
ADD COLUMN credit_score INTEGER NULL 
CHECK (credit_score IS NULL OR (credit_score >= 300 AND credit_score <= 900));

-- Add comment to explain the column
COMMENT ON COLUMN students.credit_score IS 'Optional CIBIL credit score (300-900)';
COMMENT ON COLUMN co_applicants.credit_score IS 'Optional CIBIL credit score (300-900)';