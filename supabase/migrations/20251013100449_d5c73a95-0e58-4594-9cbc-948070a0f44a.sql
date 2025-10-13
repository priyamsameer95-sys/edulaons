-- Phase 1: Database Schema Enhancements for Student Profiling & Eligibility Scoring

-- 1.1 Add Academic Performance Fields to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS tenth_percentage numeric CHECK (tenth_percentage >= 0 AND tenth_percentage <= 100),
ADD COLUMN IF NOT EXISTS twelfth_percentage numeric CHECK (twelfth_percentage >= 0 AND twelfth_percentage <= 100),
ADD COLUMN IF NOT EXISTS bachelors_percentage numeric CHECK (bachelors_percentage >= 0 AND bachelors_percentage <= 100),
ADD COLUMN IF NOT EXISTS bachelors_cgpa numeric CHECK (bachelors_cgpa >= 0 AND bachelors_cgpa <= 10),
ADD COLUMN IF NOT EXISTS highest_qualification text CHECK (highest_qualification IN ('phd', 'masters', 'bachelors', 'diploma', '12th')),
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- 1.2 Add Employment Details to co_applicants table
ALTER TABLE co_applicants
ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('salaried', 'self_employed', 'business_owner')),
ADD COLUMN IF NOT EXISTS monthly_salary numeric,
ADD COLUMN IF NOT EXISTS occupation_details text,
ADD COLUMN IF NOT EXISTS employer_details text,
ADD COLUMN IF NOT EXISTS employment_duration_years integer,
ADD COLUMN IF NOT EXISTS documents_required boolean DEFAULT false;

-- Update monthly_salary from annual salary where null
UPDATE co_applicants 
SET monthly_salary = salary / 12 
WHERE monthly_salary IS NULL AND salary IS NOT NULL;

-- 1.3 Create pin_code_tiers lookup table
CREATE TABLE IF NOT EXISTS pin_code_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code text NOT NULL,
  city text NOT NULL,
  state text,
  tier text NOT NULL CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_pin_code UNIQUE(pin_code)
);

CREATE INDEX IF NOT EXISTS idx_pin_code_tiers_pin_code ON pin_code_tiers(pin_code);
CREATE INDEX IF NOT EXISTS idx_pin_code_tiers_tier ON pin_code_tiers(tier);

-- Enable RLS
ALTER TABLE pin_code_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view pin codes
CREATE POLICY "Authenticated users can view pin codes" ON pin_code_tiers
  FOR SELECT TO authenticated
  USING (true);

-- 1.4 Create course_eligibility table
CREATE TABLE IF NOT EXISTS course_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  study_level text NOT NULL CHECK (study_level IN ('undergraduate', 'postgraduate', 'phd', 'diploma')),
  required_qualification text NOT NULL CHECK (required_qualification IN ('12th', 'diploma', 'bachelors', 'masters', 'phd')),
  eligible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_eligibility ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view course eligibility
CREATE POLICY "Authenticated users can view course eligibility" ON course_eligibility
  FOR SELECT TO authenticated
  USING (true);

-- Admins can manage course eligibility
CREATE POLICY "Admins can insert course eligibility" ON course_eligibility
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update course eligibility" ON course_eligibility
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 1.5 Create eligibility_scores table
CREATE TABLE IF NOT EXISTS eligibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads_new(id) ON DELETE CASCADE,
  
  -- Individual scores
  university_score numeric NOT NULL DEFAULT 0 CHECK (university_score >= 0 AND university_score <= 100),
  student_score numeric NOT NULL DEFAULT 0 CHECK (student_score >= 0 AND student_score <= 100),
  co_applicant_score numeric NOT NULL DEFAULT 0 CHECK (co_applicant_score >= 0 AND co_applicant_score <= 100),
  overall_score numeric NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Score breakdowns (JSONB for detailed tracking)
  university_breakdown jsonb DEFAULT '{}',
  student_breakdown jsonb DEFAULT '{}',
  co_applicant_breakdown jsonb DEFAULT '{}',
  
  -- Eligibility results
  approval_status text NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'conditional', 'pending')),
  rejection_reason text,
  
  -- Loan eligibility
  eligible_loan_min numeric,
  eligible_loan_max numeric,
  loan_band_percentage text,
  
  -- Interest rate band
  interest_rate_min numeric CHECK (interest_rate_min >= 0 AND interest_rate_min <= 100),
  interest_rate_max numeric CHECK (interest_rate_max >= 0 AND interest_rate_max <= 100),
  rate_tier text CHECK (rate_tier IN ('excellent', 'good', 'average', 'below_average')),
  
  -- Metadata
  calculated_at timestamptz DEFAULT now(),
  lender_id uuid REFERENCES lenders(id),
  calculation_version text DEFAULT 'v1.0',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_lead_lender UNIQUE(lead_id, lender_id)
);

CREATE INDEX IF NOT EXISTS idx_eligibility_scores_lead_id ON eligibility_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_scores_overall_score ON eligibility_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_eligibility_scores_approval_status ON eligibility_scores(approval_status);

-- Enable RLS
ALTER TABLE eligibility_scores ENABLE ROW LEVEL SECURITY;

-- Policies for eligibility_scores
CREATE POLICY "Admins can view all eligibility scores" ON eligibility_scores
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Partners can view their lead scores" ON eligibility_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads_new
      WHERE leads_new.id = eligibility_scores.lead_id
      AND leads_new.partner_id = get_user_partner(auth.uid())
    )
  );

CREATE POLICY "Students can view their scores" ON eligibility_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads_new l
      JOIN students s ON l.student_id = s.id
      WHERE l.id = eligibility_scores.lead_id
      AND s.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "System can insert eligibility scores" ON eligibility_scores
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update eligibility scores" ON eligibility_scores
  FOR UPDATE TO authenticated
  USING (true);

-- 1.6 Create lender_config table
CREATE TABLE IF NOT EXISTS lender_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  
  -- Max loan limits
  max_loan_amount numeric NOT NULL,
  
  -- Interest rate ranges by score band
  rate_config jsonb NOT NULL DEFAULT '{
    "excellent": {"min": 11, "max": 12, "score_threshold": 90},
    "good": {"min": 12, "max": 13.5, "score_threshold": 75},
    "average": {"min": 13.5, "max": 15, "score_threshold": 60},
    "below_average": {"min": 15, "max": 16, "score_threshold": 0}
  }'::jsonb,
  
  -- Loan amount bands by overall score
  loan_bands jsonb NOT NULL DEFAULT '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "75-89": {"min_percent": 75, "max_percent": 89},
    "60-74": {"min_percent": 60, "max_percent": 74},
    "0-59": {"min_percent": 0, "max_percent": 59}
  }'::jsonb,
  
  -- University grade preferences
  university_grade_mapping jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_lender_config UNIQUE(lender_id)
);

-- Enable RLS
ALTER TABLE lender_config ENABLE ROW LEVEL SECURITY;

-- Policies for lender_config
CREATE POLICY "Authenticated users can view lender config" ON lender_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lender config" ON lender_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_eligibility_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_eligibility_scores_updated_at
  BEFORE UPDATE ON eligibility_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_eligibility_scores_updated_at();

CREATE TRIGGER trigger_lender_config_updated_at
  BEFORE UPDATE ON lender_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pin_code_tiers_updated_at
  BEFORE UPDATE ON pin_code_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_course_eligibility_updated_at
  BEFORE UPDATE ON course_eligibility
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();