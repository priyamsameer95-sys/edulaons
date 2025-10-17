-- Create function to batch insert courses while ignoring duplicates
CREATE OR REPLACE FUNCTION batch_insert_courses_ignore_duplicates(course_data jsonb[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  course_item jsonb;
BEGIN
  FOREACH course_item IN ARRAY course_data
  LOOP
    INSERT INTO courses (
      university_id, 
      degree, 
      stream_name, 
      program_name, 
      study_level,
      course_intensity, 
      study_mode, 
      program_duration, 
      tuition_fees, 
      starting_month
    )
    VALUES (
      (course_item->>'university_id')::uuid,
      course_item->>'degree',
      course_item->>'stream_name',
      course_item->>'program_name',
      course_item->>'study_level',
      course_item->>'course_intensity',
      course_item->>'study_mode',
      course_item->>'program_duration',
      course_item->>'tuition_fees',
      course_item->>'starting_month'
    )
    ON CONFLICT (university_id, program_name, study_level, degree) DO NOTHING;
    
    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;