-- Add eligibility check columns to leads_new table
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS eligibility_score INTEGER NULL;
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS eligibility_result TEXT NULL CHECK (eligibility_result IN ('eligible', 'conditional', 'unlikely'));
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS eligibility_checked_at TIMESTAMPTZ NULL;
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN public.leads_new.eligibility_score IS 'Calculated eligibility score from 0-100';
COMMENT ON COLUMN public.leads_new.eligibility_result IS 'Result category: eligible (>=70), conditional (50-69), unlikely (<50)';
COMMENT ON COLUMN public.leads_new.eligibility_checked_at IS 'Timestamp when eligibility was checked';
COMMENT ON COLUMN public.leads_new.source IS 'Lead source: manual, eligibility_check, student_self';