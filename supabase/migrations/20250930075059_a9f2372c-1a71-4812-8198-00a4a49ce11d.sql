-- Phase 1: Restructure Document Types with Categories
-- Clear existing document types and create new categorized structure

-- First, delete existing document types (will cascade delete lead_documents if configured)
TRUNCATE TABLE document_types CASCADE;

-- Student Documents Category
INSERT INTO document_types (name, category, description, required, accepted_formats, max_file_size_pdf, max_file_size_image, display_order) VALUES
('PAN Copy', 'student', 'Student''s PAN card copy', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 1),
('Aadhaar Copy', 'student', 'Student''s Aadhaar card copy (both sides)', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 2),
('Photo', 'student', 'Recent passport-size photograph', true, ARRAY['jpg', 'jpeg', 'png'], 5242880, 5242880, 3),
('Passport', 'student', 'Valid passport copy', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 4),
('English Proficiency Test Result', 'student', 'IELTS/TOEFL/PTE/Duolingo test results', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 5),
('Offer Letter / Condition Letter', 'student', 'University offer or conditional offer letter', true, ARRAY['pdf'], 20971520, 5242880, 6),
('Education Copies', 'student', 'Academic transcripts and certificates', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 7);

-- Financial Co-applicant Documents Category
INSERT INTO document_types (name, category, description, required, accepted_formats, max_file_size_pdf, max_file_size_image, display_order) VALUES
('Last 6 Months NRI Account Bank Statement', 'financial_co_applicant', 'NRI account bank statement for last 6 months', false, ARRAY['pdf'], 20971520, 5242880, 8),
('Last 6 Months Indian Bank Account Statement', 'financial_co_applicant', 'Indian bank account statement for last 6 months', true, ARRAY['pdf'], 20971520, 5242880, 9),
('Last 6 Months Salary Slips', 'financial_co_applicant', 'Salary slips for the last 6 months', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 10),
('Co-applicant Photo', 'financial_co_applicant', 'Recent passport-size photograph of co-applicant', true, ARRAY['jpg', 'jpeg', 'png'], 5242880, 5242880, 11),
('Co-applicant PAN', 'financial_co_applicant', 'Co-applicant''s PAN card copy', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 12),
('Co-applicant Aadhaar', 'financial_co_applicant', 'Co-applicant''s Aadhaar card copy (both sides)', true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 13);

-- NRI Financial Co-applicant Documents Category (conditional)
INSERT INTO document_types (name, category, description, required, accepted_formats, max_file_size_pdf, max_file_size_image, display_order) VALUES
('Abroad CIBIL Report', 'nri_financial', 'Credit report from abroad', false, ARRAY['pdf'], 20971520, 5242880, 14),
('NRI Indian Bank Statement', 'nri_financial', 'Last 6 months Indian bank statement for NRI', false, ARRAY['pdf'], 20971520, 5242880, 15),
('Visa Copy', 'nri_financial', 'Valid visa copy of NRI co-applicant', false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 16);

-- Non-financial Co-applicant Documents Category
INSERT INTO document_types (name, category, description, required, accepted_formats, max_file_size_pdf, max_file_size_image, display_order) VALUES
('Non-financial Co-applicant PAN', 'non_financial_co_applicant', 'Non-financial co-applicant''s PAN card', false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 17),
('Non-financial Co-applicant Aadhaar', 'non_financial_co_applicant', 'Non-financial co-applicant''s Aadhaar card', false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 18),
('Non-financial Co-applicant Photo', 'non_financial_co_applicant', 'Non-financial co-applicant photograph', false, ARRAY['jpg', 'jpeg', 'png'], 5242880, 5242880, 19);

-- Collateral Documents Category (for secured loans)
INSERT INTO document_types (name, category, description, required, accepted_formats, max_file_size_pdf, max_file_size_image, display_order) VALUES
('Will Document', 'collateral', 'Property will document', false, ARRAY['pdf'], 20971520, 5242880, 20),
('Property Sale Deed', 'collateral', 'Original property sale deed', false, ARRAY['pdf'], 20971520, 5242880, 21),
('Encumbrance Certificate', 'collateral', 'Encumbrance certificate for the property', false, ARRAY['pdf'], 20971520, 5242880, 22),
('Possession Certificate', 'collateral', 'Possession certificate of the property', false, ARRAY['pdf'], 20971520, 5242880, 23),
('Property Tax Receipt', 'collateral', 'Latest property tax payment receipt', false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 24),
('Property Deed', 'collateral', 'Complete property deed documents', false, ARRAY['pdf'], 20971520, 5242880, 25),
('Route Map', 'collateral', 'Location and route map of the property', false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20971520, 5242880, 26);

-- Update co_applicants table to ensure email and phone columns exist
-- (They already exist based on schema, but let's make sure they're properly configured)
ALTER TABLE co_applicants 
  ALTER COLUMN email SET DATA TYPE text,
  ALTER COLUMN phone SET DATA TYPE text;

-- Add helpful comments
COMMENT ON COLUMN document_types.category IS 'Document category: student, financial_co_applicant, nri_financial, non_financial_co_applicant, collateral';
COMMENT ON COLUMN document_types.required IS 'Whether this document is mandatory for all applications';
COMMENT ON COLUMN document_types.display_order IS 'Order in which documents should be displayed in UI';