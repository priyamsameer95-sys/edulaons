-- Step 2: Data migration and cleanup

-- Delete document_requirements rows with old loan_classification values
-- (these will need to be re-created with proper mappings later)
DELETE FROM document_requirements 
WHERE loan_classification IN ('unsecured_nbfc', 'psu_bank', 'undecided');

-- Update existing leads_new rows to use new loan_classification values
UPDATE leads_new 
SET loan_classification = 'unsecured' 
WHERE loan_classification IN ('unsecured_nbfc', 'psu_bank', 'undecided', NULL);

-- Update existing leads_new rows to use new case_complexity values
UPDATE leads_new 
SET case_complexity = 'straightforward' 
WHERE case_complexity IN ('edge_case', 'high_risk');

-- Set default for loan_classification column to 'unsecured'
ALTER TABLE leads_new 
ALTER COLUMN loan_classification SET DEFAULT 'unsecured';