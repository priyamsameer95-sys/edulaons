-- Insert sample university data from the comprehensive dataset
INSERT INTO universities (name, country, city, global_rank, score) VALUES
-- Top global universities
('Massachusetts Institute of Technology (MIT)', 'United States', 'Cambridge', 1, 100.0),
('Imperial College London', 'United Kingdom', 'London', 2, 98.5),
('University of Cambridge', 'United Kingdom', 'Cambridge', 3, 98.0),
('Harvard University', 'United States', 'Cambridge', 4, 97.6),
('University of Oxford', 'United Kingdom', 'Oxford', 5, 96.9),
('UCL', 'United Kingdom', 'London', 6, 95.9),
('ETH Zurich', 'Switzerland', 'Zurich', 7, 93.3),
('University of Edinburgh', 'United Kingdom', 'Edinburgh', 8, 92.9),

-- Canadian universities (top ones from your dataset)
('University of Toronto', 'Canada', 'Toronto', 25, 85.2),
('McGill University', 'Canada', 'Montreal', 30, 83.1),
('University of British Columbia', 'Canada', 'Vancouver', 34, 81.7),
('University of Alberta', 'Canada', 'Edmonton', 111, 69.8),
('Université de Montréal', 'Canada', 'Montreal', 141, 65.3),
('University of Waterloo', 'Canada', 'Waterloo', 112, 69.5),
('Western University', 'Canada', 'London', 114, 69.2),
('University of Calgary', 'Canada', 'Calgary', 182, 58.9),
('Queen''s University at Kingston', 'Canada', 'Kingston', 209, 55.7),
('Simon Fraser University', 'Canada', 'Burnaby', 318, 47.8),
('University of Ottawa', 'Canada', 'Ottawa', 203, 56.4),
('Dalhousie University', 'Canada', 'Halifax', 298, 49.2),

-- Other notable international universities
('National University of Singapore (NUS)', 'Singapore', 'Singapore', 11, 87.9),
('Peking University', 'China', 'Beijing', 12, 87.1),
('University of Pennsylvania', 'United States', 'Philadelphia', 13, 86.8),
('Tsinghua University', 'China', 'Beijing', 20, 84.9),
('University of Melbourne', 'Australia', 'Melbourne', 14, 86.6),
('University of Sydney', 'Australia', 'Sydney', 19, 85.0),
('Technical University of Munich', 'Germany', 'Munich', 28, 83.8),
('University of Tokyo', 'Japan', 'Tokyo', 23, 84.2),
('Australian National University (ANU)', 'Australia', 'Canberra', 30, 82.9),
('University of Hong Kong', 'Hong Kong SAR', 'Hong Kong', 26, 84.1);

-- Insert some sample courses for these universities
WITH uni_courses AS (
  SELECT u.id, u.name
  FROM universities u 
  WHERE u.name IN ('University of Toronto', 'McGill University', 'University of British Columbia', 'MIT')
)
INSERT INTO courses (university_id, degree, stream_name, program_name, study_level, course_intensity, study_mode, program_duration, tuition_fees, starting_month)
SELECT 
  uc.id,
  'Bachelor',
  'Engineering and Technology',
  'Computer Science',
  'Bachelors',
  'Full Time',
  'On Campus',
  '48 Months',
  CASE uc.name
    WHEN 'Massachusetts Institute of Technology (MIT)' THEN '58160 USD'
    WHEN 'University of Toronto' THEN '58160 CAD'
    WHEN 'McGill University' THEN '25000 CAD'
    WHEN 'University of British Columbia' THEN '40000 CAD'
  END,
  'Sep'
FROM uni_courses uc
UNION ALL
SELECT 
  uc.id,
  'Master',
  'Business and Management',
  'Master of Business Administration',
  'Masters',
  'Full Time',
  'On Campus',
  '20 Months',
  CASE uc.name
    WHEN 'Massachusetts Institute of Technology (MIT)' THEN '80000 USD'
    WHEN 'University of Toronto' THEN '65000 CAD'
    WHEN 'McGill University' THEN '55000 CAD'
    WHEN 'University of British Columbia' THEN '60000 CAD'
  END,
  'Sep'
FROM uni_courses uc;