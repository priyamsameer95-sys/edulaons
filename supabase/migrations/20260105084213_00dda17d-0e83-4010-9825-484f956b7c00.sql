-- Update all Co-applicant document names to use proper capitalization (Co-Applicant)
UPDATE document_types 
SET name = 'Co-Applicant PAN', updated_at = now()
WHERE name = 'Co-applicant PAN';

UPDATE document_types 
SET name = 'Non-financial Co-Applicant PAN', updated_at = now()
WHERE name = 'Non-financial Co-applicant PAN';

UPDATE document_types 
SET name = 'Co-Applicant Photo', updated_at = now()
WHERE name = 'Co-applicant Photo';

UPDATE document_types 
SET name = 'Non-financial Co-Applicant Photo', updated_at = now()
WHERE name = 'Non-financial Co-applicant Photo';