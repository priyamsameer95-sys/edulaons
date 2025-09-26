-- Clear existing sample data and import comprehensive university dataset

-- First, clear existing data (cascades to courses and lead_universities)
DELETE FROM courses WHERE university_id IN (SELECT id FROM universities);
DELETE FROM lead_universities WHERE university_id IN (SELECT id FROM universities);
DELETE FROM universities;

-- Note: The comprehensive university data will be imported via the application script
-- This migration only clears the existing sample data to prepare for the full import
-- Run the importUniversityData() function in the browser console after this migration