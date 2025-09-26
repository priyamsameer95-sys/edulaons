-- Create universities table
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  global_rank INTEGER,
  score DECIMAL(5,2),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  stream_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  study_level TEXT NOT NULL,
  course_intensity TEXT,
  study_mode TEXT,
  program_duration TEXT,
  tuition_fees TEXT,
  starting_month TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table with mandatory co-applicant
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  
  -- Student Information
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_dob DATE,
  
  -- Test Scores
  test_type TEXT,
  test_score TEXT,
  
  -- Case Information
  lender TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  loan_amount DECIMAL(15,2) NOT NULL,
  study_destination TEXT NOT NULL,
  intake_month INTEGER,
  intake_year INTEGER,
  
  -- Mandatory Co-applicant Information
  co_applicant_name TEXT NOT NULL,
  co_applicant_salary DECIMAL(12,2) NOT NULL,
  co_applicant_relationship TEXT NOT NULL,
  co_applicant_pin TEXT NOT NULL,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'new',
  documents_status TEXT NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_universities junction table
CREATE TABLE public.lead_universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(lead_id, university_id)
);

-- Enable Row Level Security
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_universities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to universities and courses
CREATE POLICY "Universities are viewable by everyone" 
ON public.universities 
FOR SELECT 
USING (true);

CREATE POLICY "Courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
USING (true);

-- Create policies for leads (will need authentication later)
CREATE POLICY "Leads are viewable by everyone for now" 
ON public.leads 
FOR ALL 
USING (true);

CREATE POLICY "Lead universities are viewable by everyone for now" 
ON public.lead_universities 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_universities_country ON public.universities(country);
CREATE INDEX idx_universities_name ON public.universities(name);
CREATE INDEX idx_universities_rank ON public.universities(global_rank);

CREATE INDEX idx_courses_university_id ON public.courses(university_id);
CREATE INDEX idx_courses_degree ON public.courses(degree);
CREATE INDEX idx_courses_stream ON public.courses(stream_name);

CREATE INDEX idx_leads_case_id ON public.leads(case_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();