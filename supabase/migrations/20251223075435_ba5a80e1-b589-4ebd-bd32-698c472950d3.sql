-- Fix trigger function search path
DROP FUNCTION IF EXISTS public.update_clarification_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_clarification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate triggers
CREATE TRIGGER update_student_clarifications_updated_at
BEFORE UPDATE ON public.student_clarifications
FOR EACH ROW
EXECUTE FUNCTION public.update_clarification_updated_at();

CREATE TRIGGER update_clarification_templates_updated_at
BEFORE UPDATE ON public.clarification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_clarification_updated_at();