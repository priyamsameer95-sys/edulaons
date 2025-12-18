-- Create loan classification enum
CREATE TYPE loan_classification_enum AS ENUM (
  'unsecured_nbfc',
  'secured_property',
  'psu_bank',
  'undecided'
);

-- Create case complexity enum
CREATE TYPE case_complexity_enum AS ENUM (
  'straightforward',
  'edge_case',
  'high_risk'
);

-- Add loan configuration columns to leads_new
ALTER TABLE leads_new 
  ADD COLUMN IF NOT EXISTS loan_classification loan_classification_enum DEFAULT 'undecided',
  ADD COLUMN IF NOT EXISTS target_lender_id uuid REFERENCES lenders(id),
  ADD COLUMN IF NOT EXISTS case_complexity case_complexity_enum DEFAULT 'straightforward',
  ADD COLUMN IF NOT EXISTS loan_config_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS loan_config_updated_by uuid;

-- Create document_requirements table for dynamic document mapping
CREATE TABLE IF NOT EXISTS document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_classification loan_classification_enum NOT NULL,
  document_type_id uuid REFERENCES document_types(id) ON DELETE CASCADE,
  is_required boolean DEFAULT false,
  stage text DEFAULT 'initial',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(loan_classification, document_type_id)
);

-- Enable RLS
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read for authenticated users" ON document_requirements
  FOR SELECT TO authenticated USING (true);

-- Allow admin insert/update/delete
CREATE POLICY "Allow admin full access" ON document_requirements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Seed document requirements for each loan classification
-- First, get document type IDs and insert requirements

-- UNDECIDED (Minimum viable - 4 docs)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order)
SELECT 'undecided', id, true, 'initial', 
  CASE name
    WHEN 'PAN Copy' THEN 1
    WHEN 'Aadhaar Copy' THEN 2
    WHEN 'Photo' THEN 3
    WHEN 'Offer Letter' THEN 4
  END
FROM document_types 
WHERE name IN ('PAN Copy', 'Aadhaar Copy', 'Photo', 'Offer Letter')
ON CONFLICT (loan_classification, document_type_id) DO NOTHING;

-- UNSECURED NBFC (6 docs)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order)
SELECT 'unsecured_nbfc', id, true, 'initial',
  CASE name
    WHEN 'PAN Copy' THEN 1
    WHEN 'Aadhaar Copy' THEN 2
    WHEN 'Photo' THEN 3
    WHEN 'Bank Statements (6 months)' THEN 4
    WHEN 'Salary Slips (3 months)' THEN 5
    WHEN 'Offer Letter' THEN 6
  END
FROM document_types 
WHERE name IN ('PAN Copy', 'Aadhaar Copy', 'Photo', 'Bank Statements (6 months)', 'Salary Slips (3 months)', 'Offer Letter')
ON CONFLICT (loan_classification, document_type_id) DO NOTHING;

-- SECURED PROPERTY (All unsecured + property docs)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order)
SELECT 'secured_property', id, true, 'initial',
  CASE name
    WHEN 'PAN Copy' THEN 1
    WHEN 'Aadhaar Copy' THEN 2
    WHEN 'Photo' THEN 3
    WHEN 'Bank Statements (6 months)' THEN 4
    WHEN 'Salary Slips (3 months)' THEN 5
    WHEN 'Offer Letter' THEN 6
    WHEN 'Property Sale Deed' THEN 7
    WHEN 'Encumbrance Certificate' THEN 8
    WHEN 'Property Tax Receipt' THEN 9
  END
FROM document_types 
WHERE name IN ('PAN Copy', 'Aadhaar Copy', 'Photo', 'Bank Statements (6 months)', 'Salary Slips (3 months)', 'Offer Letter', 'Property Sale Deed', 'Encumbrance Certificate', 'Property Tax Receipt')
ON CONFLICT (loan_classification, document_type_id) DO NOTHING;

-- PSU BANK (Similar to unsecured with additional docs)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order)
SELECT 'psu_bank', id, true, 'initial',
  CASE name
    WHEN 'PAN Copy' THEN 1
    WHEN 'Aadhaar Copy' THEN 2
    WHEN 'Photo' THEN 3
    WHEN 'Bank Statements (6 months)' THEN 4
    WHEN 'Salary Slips (3 months)' THEN 5
    WHEN 'Offer Letter' THEN 6
    WHEN 'Form 16' THEN 7
    WHEN 'ITR (2 years)' THEN 8
  END
FROM document_types 
WHERE name IN ('PAN Copy', 'Aadhaar Copy', 'Photo', 'Bank Statements (6 months)', 'Salary Slips (3 months)', 'Offer Letter', 'Form 16', 'ITR (2 years)')
ON CONFLICT (loan_classification, document_type_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_requirements_classification 
  ON document_requirements(loan_classification);

CREATE INDEX IF NOT EXISTS idx_leads_loan_classification 
  ON leads_new(loan_classification);