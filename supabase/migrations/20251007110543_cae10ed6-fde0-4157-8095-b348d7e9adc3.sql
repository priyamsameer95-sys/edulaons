-- Add indexes for faster imports and queries
CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_program_name ON public.courses(program_name);
CREATE INDEX IF NOT EXISTS idx_courses_stream_name ON public.courses(stream_name);
CREATE INDEX IF NOT EXISTS idx_courses_study_level ON public.courses(study_level);

-- Add unique constraint to prevent duplicate courses
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_unique ON public.courses(university_id, program_name, study_level, degree);

-- Add index for course search
CREATE INDEX IF NOT EXISTS idx_courses_search ON public.courses USING gin(to_tsvector('english', program_name || ' ' || stream_name));