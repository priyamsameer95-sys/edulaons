-- Add reason_code column to lead_status_history for structured tracking
ALTER TABLE public.lead_status_history 
ADD COLUMN IF NOT EXISTS reason_code TEXT;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lead_status_history_reason_code 
ON public.lead_status_history(reason_code) 
WHERE reason_code IS NOT NULL;