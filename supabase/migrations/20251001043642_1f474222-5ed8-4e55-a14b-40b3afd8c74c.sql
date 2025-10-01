-- Create lender assignment history table for audit trail
CREATE TABLE IF NOT EXISTS public.lender_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  old_lender_id UUID REFERENCES public.lenders(id),
  new_lender_id UUID NOT NULL REFERENCES public.lenders(id),
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  assignment_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create university lender preferences/compatibility table
CREATE TABLE IF NOT EXISTS public.university_lender_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
  study_destination study_destination_enum NOT NULL,
  compatibility_score INTEGER CHECK (compatibility_score BETWEEN 1 AND 100) DEFAULT 50,
  min_loan_amount NUMERIC,
  max_loan_amount NUMERIC,
  preferred_for_loan_type loan_type_enum,
  is_preferred BOOLEAN DEFAULT false,
  special_requirements JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(university_id, lender_id, study_destination)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lender_assignment_history_lead_id ON public.lender_assignment_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lender_assignment_history_created_at ON public.lender_assignment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_university_lender_preferences_university ON public.university_lender_preferences(university_id);
CREATE INDEX IF NOT EXISTS idx_university_lender_preferences_lender ON public.university_lender_preferences(lender_id);
CREATE INDEX IF NOT EXISTS idx_university_lender_preferences_destination ON public.university_lender_preferences(study_destination);

-- Enable RLS on new tables
ALTER TABLE public.lender_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_lender_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for lender_assignment_history
CREATE POLICY "Admins can view lender assignment history"
  ON public.lender_assignment_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert lender assignment history"
  ON public.lender_assignment_history
  FOR INSERT
  WITH CHECK (true);

-- RLS policies for university_lender_preferences
CREATE POLICY "Admins can manage university lender preferences"
  ON public.university_lender_preferences
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Everyone can view university lender preferences"
  ON public.university_lender_preferences
  FOR SELECT
  USING (true);

-- Add trigger for updated_at on university_lender_preferences
CREATE TRIGGER update_university_lender_preferences_updated_at
  BEFORE UPDATE ON public.university_lender_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();