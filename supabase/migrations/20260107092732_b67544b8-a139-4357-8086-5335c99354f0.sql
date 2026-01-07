-- =============================================
-- SMART LENDER ENGINE: Database Changes
-- =============================================

-- 1. Create ai_override_feedback table for AI learning loop
CREATE TABLE public.ai_override_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.ai_lender_recommendations(id) ON DELETE SET NULL,
  original_lender_id UUID REFERENCES public.lenders(id),
  overridden_to_lender_id UUID NOT NULL REFERENCES public.lenders(id),
  override_reason TEXT NOT NULL,
  override_category TEXT, -- e.g., 'rate_preference', 'processing_speed', 'relationship', 'other'
  context_snapshot JSONB, -- Snapshot of lead data at override time
  overridden_by UUID,
  overridden_by_role TEXT,
  feedback_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_override_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_override_feedback
CREATE POLICY "Admins can view all override feedback"
ON public.ai_override_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
    AND app_users.is_active = true
  )
);

CREATE POLICY "Admins can insert override feedback"
ON public.ai_override_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
    AND app_users.is_active = true
  )
);

CREATE POLICY "Admins can update override feedback"
ON public.ai_override_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
    AND app_users.is_active = true
  )
);

-- 2. Add new columns to ai_lender_recommendations
ALTER TABLE public.ai_lender_recommendations
ADD COLUMN IF NOT EXISTS recommendation_context JSONB,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS urgency_zone TEXT,
ADD COLUMN IF NOT EXISTS student_tier TEXT,
ADD COLUMN IF NOT EXISTS strategy TEXT,
ADD COLUMN IF NOT EXISTS pillar_scores JSONB,
ADD COLUMN IF NOT EXISTS all_lender_scores JSONB;

-- 3. Create index for faster history queries
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_lead_version 
ON public.ai_lender_recommendations(lead_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_ai_override_feedback_lead 
ON public.ai_override_feedback(lead_id);

CREATE INDEX IF NOT EXISTS idx_ai_override_feedback_unprocessed 
ON public.ai_override_feedback(feedback_processed) WHERE feedback_processed = false;

-- 4. Add comments for documentation
COMMENT ON TABLE public.ai_override_feedback IS 'Stores Admin override decisions for AI learning. Used to adjust scoring weights over time.';
COMMENT ON COLUMN public.ai_lender_recommendations.recommendation_context IS 'Stores normalization context: tier, zone, strategy, days until deadline';
COMMENT ON COLUMN public.ai_lender_recommendations.version IS 'Version number for tracking recommendation history per lead';
COMMENT ON COLUMN public.ai_lender_recommendations.urgency_zone IS 'GREEN/YELLOW/RED based on days until intake';
COMMENT ON COLUMN public.ai_lender_recommendations.student_tier IS 'S/A/B/C based on university global rank';
COMMENT ON COLUMN public.ai_lender_recommendations.strategy IS 'COST_OPTIMIZATION/BALANCED/SPEED_PRIORITY based on urgency';
COMMENT ON COLUMN public.ai_lender_recommendations.pillar_scores IS 'Detailed 3-pillar breakdown: future, financial, past';
COMMENT ON COLUMN public.ai_lender_recommendations.all_lender_scores IS 'Complete scoring data for all lenders including locked ones';