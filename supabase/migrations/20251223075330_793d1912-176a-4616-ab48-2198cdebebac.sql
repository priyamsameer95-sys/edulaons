-- Create field_audit_log table for tracking data provenance
CREATE TABLE public.field_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  
  -- What changed
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Who changed it
  changed_by_type TEXT NOT NULL CHECK (changed_by_type IN ('student', 'partner', 'admin', 'system')),
  changed_by_id UUID,
  changed_by_name TEXT,
  
  -- How it was changed
  change_source TEXT NOT NULL,
  change_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for field_audit_log
CREATE INDEX idx_field_audit_lead ON public.field_audit_log(lead_id);
CREATE INDEX idx_field_audit_created ON public.field_audit_log(created_at DESC);

-- Enable RLS on field_audit_log
ALTER TABLE public.field_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for field_audit_log
CREATE POLICY "Admins can view all field audit logs"
ON public.field_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert field audit logs"
ON public.field_audit_log FOR INSERT
WITH CHECK (true);

-- Create student_clarifications table
CREATE TABLE public.student_clarifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  
  -- Question details
  question_type TEXT NOT NULL CHECK (question_type IN ('document', 'information', 'lender_specific', 'conditional')),
  question_text TEXT NOT NULL,
  question_context TEXT,
  
  -- Related entities
  document_id UUID REFERENCES public.lead_documents(id) ON DELETE SET NULL,
  field_name TEXT,
  
  -- Requester
  created_by UUID,
  created_by_role TEXT CHECK (created_by_role IN ('admin', 'partner', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Response configuration
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'document', 'both')),
  
  -- Student response
  response_text TEXT,
  response_document_id UUID REFERENCES public.lead_documents(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'resolved', 'dismissed')),
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for student_clarifications
CREATE INDEX idx_clarifications_lead ON public.student_clarifications(lead_id);
CREATE INDEX idx_clarifications_lead_pending ON public.student_clarifications(lead_id, status) WHERE status = 'pending';
CREATE INDEX idx_clarifications_status ON public.student_clarifications(status);

-- Enable RLS on student_clarifications
ALTER TABLE public.student_clarifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_clarifications
CREATE POLICY "Admins can manage all clarifications"
ON public.student_clarifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Partners can view clarifications for their leads"
ON public.student_clarifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = student_clarifications.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

CREATE POLICY "Partners can create clarifications for their leads"
ON public.student_clarifications FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = student_clarifications.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

CREATE POLICY "Students can view their own clarifications"
ON public.student_clarifications FOR SELECT
USING (lead_id IN (
  SELECT l.id FROM leads_new l
  JOIN students s ON l.student_id = s.id
  WHERE s.email = (auth.jwt() ->> 'email'::text)
));

CREATE POLICY "Students can respond to their own clarifications"
ON public.student_clarifications FOR UPDATE
USING (
  lead_id IN (
    SELECT l.id FROM leads_new l
    JOIN students s ON l.student_id = s.id
    WHERE s.email = (auth.jwt() ->> 'email'::text)
  )
  AND status = 'pending'
);

-- Create clarification_templates table
CREATE TABLE public.clarification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category TEXT NOT NULL CHECK (category IN ('document', 'personal', 'academic', 'co_applicant', 'lender')),
  question_text TEXT NOT NULL,
  question_context TEXT,
  
  -- Configuration
  requires_document BOOLEAN NOT NULL DEFAULT false,
  expected_document_type TEXT,
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'document', 'both')),
  
  -- Auto-trigger configuration
  auto_trigger_condition JSONB,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on clarification_templates
ALTER TABLE public.clarification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for clarification_templates
CREATE POLICY "Authenticated users can view active templates"
ON public.clarification_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.clarification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Seed some initial clarification templates
INSERT INTO public.clarification_templates (category, question_text, question_context, requires_document, response_type, display_order) VALUES
('document', 'Your passport scan is unclear. Please re-upload a clearer scan of the photo page.', 'We need a clear, readable scan to verify your identity for the lender.', true, 'document', 1),
('document', 'Please provide your IELTS/TOEFL score certificate.', 'Your test scores are mentioned but we need the official certificate for lender submission.', true, 'document', 2),
('document', 'Your bank statement is incomplete. Please upload 6 months statements.', 'Lenders require complete 6-month transaction history.', true, 'document', 3),
('personal', 'Please confirm your expected intake month and year.', 'This helps us match you with the right lender programs.', false, 'text', 4),
('co_applicant', 'Your co-applicant is self-employed. Please provide 2 years ITR documents.', 'For self-employed co-applicants, lenders require Income Tax Returns.', true, 'document', 5),
('co_applicant', 'Please provide your co-applicant''s salary slip for the last 3 months.', 'This is required to verify the declared income.', true, 'document', 6),
('lender', 'PNB requires property documents for loans above ₹50L. Please upload property papers.', 'For secured loans, property documentation is mandatory.', true, 'document', 7),
('academic', 'Please provide your 12th grade marksheet.', 'This is required for academic verification.', true, 'document', 8);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_clarification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_clarifications_updated_at
BEFORE UPDATE ON public.student_clarifications
FOR EACH ROW
EXECUTE FUNCTION public.update_clarification_updated_at();

CREATE TRIGGER update_clarification_templates_updated_at
BEFORE UPDATE ON public.clarification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_clarification_updated_at();