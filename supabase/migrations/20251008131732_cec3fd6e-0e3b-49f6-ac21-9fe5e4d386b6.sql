-- Add performance indexes for universities and courses tables

-- Universities table indexes
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_global_rank ON public.universities(global_rank) WHERE global_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_universities_name_lower ON public.universities(LOWER(name));

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_program_name_lower ON public.courses(LOWER(program_name));
CREATE INDEX IF NOT EXISTS idx_courses_study_level ON public.courses(study_level);
CREATE INDEX IF NOT EXISTS idx_courses_stream_name ON public.courses(stream_name);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_courses_university_stream ON public.courses(university_id, stream_name);