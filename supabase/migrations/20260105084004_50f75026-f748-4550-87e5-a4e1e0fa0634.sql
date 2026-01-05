-- Update document type name to use proper capitalization
UPDATE document_types 
SET name = 'Co-Applicant Aadhaar', updated_at = now()
WHERE name = 'Co-applicant Aadhaar';

-- Also update Non-financial Co-applicant Aadhaar for consistency
UPDATE document_types 
SET name = 'Non-financial Co-Applicant Aadhaar', updated_at = now()
WHERE name = 'Non-financial Co-applicant Aadhaar';