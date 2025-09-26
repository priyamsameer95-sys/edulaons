-- Insert some sample course data
WITH uni_ids AS (
  SELECT id, name FROM universities WHERE name IN (
    'Massachusetts Institute of Technology (MIT)',
    'University of Toronto',
    'McGill University',
    'University of Waterloo'
  )
)
INSERT INTO courses (university_id, degree, stream_name, program_name, study_level, course_intensity, study_mode, program_duration, tuition_fees, starting_month)
SELECT 
  u.id,
  'Bachelor',
  'Engineering and Technology',
  'Computer Science',
  'Bachelors',
  'Full Time',
  'On Campus',
  '48 Months',
  CASE u.name
    WHEN 'Massachusetts Institute of Technology (MIT)' THEN '58160 USD'
    WHEN 'University of Toronto' THEN '58160 CAD'
    WHEN 'McGill University' THEN '25000 CAD'
    WHEN 'University of Waterloo' THEN '35000 CAD'
  END,
  'Sep'
FROM uni_ids u
UNION ALL
SELECT 
  u.id,
  'Master',
  'Business and Management',
  'Master of Business Administration',
  'Masters',
  'Full Time',
  'On Campus',
  '20 Months',
  CASE u.name
    WHEN 'Massachusetts Institute of Technology (MIT)' THEN '80000 USD'
    WHEN 'University of Toronto' THEN '65000 CAD'
    WHEN 'McGill University' THEN '55000 CAD'
    WHEN 'University of Waterloo' THEN '50000 CAD'
  END,
  'Sep'
FROM uni_ids u;