-- Add is_quick_lead flag to leads_new table
ALTER TABLE public.leads_new 
ADD COLUMN IF NOT EXISTS is_quick_lead BOOLEAN DEFAULT false;

-- Add quick_lead_completed_at timestamp for tracking when quick leads are completed
ALTER TABLE public.leads_new 
ADD COLUMN IF NOT EXISTS quick_lead_completed_at TIMESTAMPTZ;

-- Add index for efficient filtering of quick leads
CREATE INDEX IF NOT EXISTS idx_leads_new_is_quick_lead ON public.leads_new(is_quick_lead) WHERE is_quick_lead = true;

-- Add comment
COMMENT ON COLUMN public.leads_new.is_quick_lead IS 'True if lead was created via quick lead form (minimal fields)';