-- Expand lead_status_enum to 18 granular statuses matching the loan process flow
-- First, add new enum values to lead_status_enum

ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'lead_intake';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'first_contact';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'lenders_mapped';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'checklist_shared';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'docs_uploading';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'docs_submitted';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'docs_verified';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'logged_with_lender';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'counselling_done';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'pd_scheduled';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'pd_completed';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'additional_docs_pending';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'property_verification';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'credit_assessment';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'sanctioned';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'pf_pending';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'pf_paid';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'sanction_letter_issued';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'docs_dispatched';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'security_creation';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'ops_verification';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'disbursed';

-- Add TAT tracking and sanction-related fields to leads_new table
ALTER TABLE leads_new 
ADD COLUMN IF NOT EXISTS lan_number TEXT,
ADD COLUMN IF NOT EXISTS sanction_amount NUMERIC,
ADD COLUMN IF NOT EXISTS sanction_date DATE,
ADD COLUMN IF NOT EXISTS pd_call_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pd_call_status TEXT CHECK (pd_call_status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')),
ADD COLUMN IF NOT EXISTS pf_amount NUMERIC,
ADD COLUMN IF NOT EXISTS pf_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sanction_letter_date DATE,
ADD COLUMN IF NOT EXISTS current_stage_started_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS property_verification_status TEXT CHECK (property_verification_status IN ('pending', 'scheduled', 'completed', 'failed'));

-- Create index for TAT monitoring queries
CREATE INDEX IF NOT EXISTS idx_leads_current_stage_started ON leads_new(current_stage_started_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_stage ON leads_new(status, current_stage_started_at);

-- Create function to auto-update current_stage_started_at on status change
CREATE OR REPLACE FUNCTION update_stage_started_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.current_stage_started_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-updating stage start time
DROP TRIGGER IF EXISTS trigger_update_stage_started_at ON leads_new;
CREATE TRIGGER trigger_update_stage_started_at
  BEFORE UPDATE ON leads_new
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_started_at();

-- Add comment for documentation
COMMENT ON COLUMN leads_new.current_stage_started_at IS 'Timestamp when lead entered current status - used for TAT tracking';
COMMENT ON COLUMN leads_new.lan_number IS 'Loan Account Number assigned by lender after login';
COMMENT ON COLUMN leads_new.sanction_amount IS 'Final sanctioned loan amount from lender';
COMMENT ON COLUMN leads_new.pd_call_status IS 'Status of Personal Discussion call with lender';