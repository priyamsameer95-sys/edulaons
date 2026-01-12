-- Normalize country names in universities table for consistency
UPDATE universities 
SET country = 'United States' 
WHERE country = 'USA';

-- Also normalize any other potential variants
UPDATE universities 
SET country = 'United Kingdom' 
WHERE country IN ('UK', 'GB');