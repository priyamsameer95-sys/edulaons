-- Create a student record for testing with valid phone format
INSERT INTO students (
  name,
  email,
  phone,
  nationality,
  city,
  state,
  country
) VALUES (
  'Priyam Sameer',
  'priyam.sameer.khet@gmail.com',
  '+919876543210',
  'Indian',
  'Mumbai',
  'Maharashtra',
  'India'
)
ON CONFLICT (email) DO UPDATE 
SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  updated_at = now()
RETURNING id, name, email;