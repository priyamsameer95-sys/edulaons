-- Phase 1: Lender BRE & AI Recommendation System Schema

-- 1.1 Extend lenders table with BRE fields
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS bre_text TEXT;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS bre_json JSONB;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS processing_time_range_min INTEGER;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS processing_time_range_max INTEGER;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS collateral_preference TEXT[];
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS country_restrictions TEXT[];
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS university_restrictions JSONB;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS income_expectations_min NUMERIC;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS income_expectations_max NUMERIC;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS credit_expectations TEXT;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS experience_score NUMERIC;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS admin_remarks TEXT;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS bre_updated_at TIMESTAMPTZ;
ALTER TABLE lenders ADD COLUMN IF NOT EXISTS bre_updated_by UUID;

-- 1.2 Create lender_bre_history table for versioning
CREATE TABLE IF NOT EXISTS lender_bre_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  bre_text TEXT,
  bre_json JSONB,
  processing_time_range_min INTEGER,
  processing_time_range_max INTEGER,
  collateral_preference TEXT[],
  country_restrictions TEXT[],
  university_restrictions JSONB,
  income_expectations_min NUMERIC,
  income_expectations_max NUMERIC,
  credit_expectations TEXT,
  experience_score NUMERIC,
  admin_remarks TEXT,
  version_number INTEGER NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  change_reason TEXT NOT NULL
);

-- Create index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_bre_history_lender ON lender_bre_history(lender_id, version_number DESC);

-- Enable RLS on lender_bre_history
ALTER TABLE lender_bre_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for lender_bre_history
CREATE POLICY "Admins can manage BRE history"
ON lender_bre_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'super_admin')
    AND app_users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'super_admin')
    AND app_users.is_active = true
  )
);

-- 1.3 Extend ai_lender_recommendations table
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS all_lenders_output JSONB;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS lender_snapshots JSONB;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS reviewed_by_role TEXT;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS override_reason TEXT;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS student_facing_reason TEXT;
ALTER TABLE ai_lender_recommendations ADD COLUMN IF NOT EXISTS ai_unavailable BOOLEAN DEFAULT false;

-- Add constraint for decision values
ALTER TABLE ai_lender_recommendations 
DROP CONSTRAINT IF EXISTS ai_lender_recommendations_decision_check;

ALTER TABLE ai_lender_recommendations 
ADD CONSTRAINT ai_lender_recommendations_decision_check 
CHECK (decision IS NULL OR decision IN ('accepted', 'overridden', 'deferred'));