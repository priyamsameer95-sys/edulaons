-- Enable RLS on all new tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_new ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partners table
CREATE POLICY "Partners are viewable by everyone for now"
ON public.partners
FOR SELECT
USING (true);

CREATE POLICY "Partners can be inserted by everyone for now"
ON public.partners
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Partners can be updated by everyone for now"
ON public.partners
FOR UPDATE
USING (true);

-- Create RLS policies for lenders table
CREATE POLICY "Lenders are viewable by everyone"
ON public.lenders
FOR SELECT
USING (true);

CREATE POLICY "Lenders can be inserted by everyone for now"
ON public.lenders
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for students table
CREATE POLICY "Students are viewable by everyone for now"
ON public.students
FOR SELECT
USING (true);

CREATE POLICY "Students can be inserted by everyone for now"
ON public.students
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Students can be updated by everyone for now"
ON public.students
FOR UPDATE
USING (true);

-- Create RLS policies for co_applicants table
CREATE POLICY "Co-applicants are viewable by everyone for now"
ON public.co_applicants
FOR SELECT
USING (true);

CREATE POLICY "Co-applicants can be inserted by everyone for now"
ON public.co_applicants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Co-applicants can be updated by everyone for now"
ON public.co_applicants
FOR UPDATE
USING (true);

-- Create RLS policies for academic_tests table
CREATE POLICY "Academic tests are viewable by everyone for now"
ON public.academic_tests
FOR SELECT
USING (true);

CREATE POLICY "Academic tests can be inserted by everyone for now"  
ON public.academic_tests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Academic tests can be updated by everyone for now"
ON public.academic_tests
FOR UPDATE
USING (true);

-- Create RLS policies for leads_new table
CREATE POLICY "Leads are viewable by everyone for now"
ON public.leads_new
FOR SELECT
USING (true);

CREATE POLICY "Leads can be inserted by everyone for now"
ON public.leads_new
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Leads can be updated by everyone for now"
ON public.leads_new
FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_leads_new_status ON public.leads_new(status);
CREATE INDEX idx_leads_new_partner ON public.leads_new(partner_id);
CREATE INDEX idx_leads_new_lender ON public.leads_new(lender_id);
CREATE INDEX idx_leads_new_created_at ON public.leads_new(created_at);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_students_phone ON public.students(phone);
CREATE INDEX idx_academic_tests_student ON public.academic_tests(student_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lenders_updated_at
BEFORE UPDATE ON public.lenders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_co_applicants_updated_at
BEFORE UPDATE ON public.co_applicants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_tests_updated_at
BEFORE UPDATE ON public.academic_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_new_updated_at
BEFORE UPDATE ON public.leads_new
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();