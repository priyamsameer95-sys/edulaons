-- Add course_type to leads_new table
ALTER TABLE public.leads_new
ADD COLUMN IF NOT EXISTS course_type text;

-- Add masters academic fields to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS masters_percentage numeric,
ADD COLUMN IF NOT EXISTS masters_cgpa numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.leads_new.course_type IS 'Type of course: bachelors, masters, phd, diploma';
COMMENT ON COLUMN public.students.masters_percentage IS 'Masters degree percentage if applicable';
COMMENT ON COLUMN public.students.masters_cgpa IS 'Masters degree CGPA if applicable';