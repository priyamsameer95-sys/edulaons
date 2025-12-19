-- Create lead_courses junction table to associate leads with courses
CREATE TABLE public.lead_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads_new(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_custom_course BOOLEAN DEFAULT false,
  custom_course_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, course_id)
);

-- Enable RLS
ALTER TABLE public.lead_courses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage lead_courses"
ON public.lead_courses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Partners can view their lead courses
CREATE POLICY "Partners can view their lead_courses"
ON public.lead_courses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = lead_courses.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

-- Partners can insert their lead courses
CREATE POLICY "Partners can insert their lead_courses"
ON public.lead_courses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = lead_courses.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

-- Partners can update their lead courses
CREATE POLICY "Partners can update their lead_courses"
ON public.lead_courses FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = lead_courses.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

-- Partners can delete their lead courses
CREATE POLICY "Partners can delete their lead_courses"
ON public.lead_courses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM leads_new
  WHERE leads_new.id = lead_courses.lead_id
  AND leads_new.partner_id = get_user_partner(auth.uid())
));

-- Students can view their lead courses
CREATE POLICY "Students can view their lead_courses"
ON public.lead_courses FOR SELECT
USING (lead_id IN (
  SELECT l.id FROM leads_new l
  JOIN students s ON l.student_id = s.id
  WHERE s.email = (auth.jwt() ->> 'email'::text)
));

-- Create index for performance
CREATE INDEX idx_lead_courses_lead_id ON public.lead_courses(lead_id);
CREATE INDEX idx_lead_courses_course_id ON public.lead_courses(course_id);