-- Phase 1: Student Activation & Lead Ownership
-- Add activation columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS otp_enabled boolean DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_activated boolean DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Add origin tracking to leads_new
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.leads_new ADD COLUMN IF NOT EXISTS created_by_role text;

-- Phase 5: Student ↔ Partner Mapping Table
CREATE TABLE IF NOT EXISTS public.student_partner_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads_new(id) ON DELETE SET NULL,
  mapped_by uuid REFERENCES auth.users(id),
  mapped_at timestamptz DEFAULT now(),
  mapping_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, partner_id)
);

-- Enable RLS on student_partner_mappings
ALTER TABLE public.student_partner_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for student_partner_mappings
CREATE POLICY "Admins can manage all mappings" ON public.student_partner_mappings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

CREATE POLICY "Partners can view their own mappings" ON public.student_partner_mappings
  FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM public.app_users 
      WHERE id = auth.uid() 
      AND role = 'partner'
      AND is_active = true
    )
  );

-- Phase 6: AI Lender Recommendations Table
CREATE TABLE IF NOT EXISTS public.ai_lender_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  recommended_lender_ids uuid[] NOT NULL,
  recommended_lenders_data jsonb,
  rationale text,
  confidence_score numeric(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  model_version text DEFAULT '1.0',
  inputs_snapshot jsonb,
  accepted_lender_id uuid REFERENCES public.lenders(id),
  assignment_mode text CHECK (assignment_mode IN ('ai', 'manual', 'ai_override')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_lender_recommendations
ALTER TABLE public.ai_lender_recommendations ENABLE ROW LEVEL SECURITY;

-- Only admins can access AI recommendations
CREATE POLICY "Admins can manage AI recommendations" ON public.ai_lender_recommendations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_lender_recommendations_lead_id ON public.ai_lender_recommendations(lead_id);
CREATE INDEX IF NOT EXISTS idx_student_partner_mappings_student_id ON public.student_partner_mappings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_partner_mappings_partner_id ON public.student_partner_mappings(partner_id);

-- Add trigger for updated_at on student_partner_mappings
CREATE OR REPLACE FUNCTION public.update_student_partner_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_student_partner_mappings_updated_at ON public.student_partner_mappings;
CREATE TRIGGER update_student_partner_mappings_updated_at
  BEFORE UPDATE ON public.student_partner_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_partner_mappings_updated_at();