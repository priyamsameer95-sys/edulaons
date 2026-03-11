-- 1. Ensure city column exists (if not already)
ALTER TABLE universities ADD COLUMN IF NOT EXISTS city text;

-- 2. Change global_rank to text to support ranges (e.g. '701-750')
ALTER TABLE universities ALTER COLUMN global_rank TYPE text USING global_rank::text;

-- 3. Data Migration: Split country into city and country

-- Case A: Handles format "City,, Country" (double comma separator)
UPDATE universities 
SET 
  city = trim(split_part(country, ',,', 1)), 
  country = trim(split_part(country, ',,', 2)) 
WHERE country LIKE '%,,%';

-- Case B: Handles format "City, Country" (single comma separator)
-- Only runs for rows that haven't been split yet (where city is null)
UPDATE universities 
SET 
  city = trim(split_part(country, ',', 1)), 
  country = trim(split_part(country, ',', 2)) 
WHERE city IS NULL AND country LIKE '%,%' AND country NOT LIKE '%,,%';

-- 4. Final cleanup
-- Set city to 'Unknown' if still empty but name exists
UPDATE universities SET city = 'Unknown' WHERE city IS NULL OR city = '';
UPDATE universities SET city = trim(city);
UPDATE universities SET country = trim(country);
