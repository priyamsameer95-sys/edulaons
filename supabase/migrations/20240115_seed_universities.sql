-- Seed Top Universities if they don't exist
-- This ensures the user has a baseline of data immediately.

INSERT INTO universities (name, city, country, global_rank)
VALUES 
  -- USA
  ('Massachusetts Institute of Technology (MIT)', 'Cambridge', 'United States', '1'),
  ('Stanford University', 'Stanford', 'United States', '5'),
  ('Harvard University', 'Cambridge', 'United States', '4'),
  ('California Institute of Technology (Caltech)', 'Pasadena', 'United States', '10'),
  ('University of Chicago', 'Chicago', 'United States', '11'),
  ('University of Pennsylvania', 'Philadelphia', 'United States', '12'),
  ('Princeton University', 'Princeton', 'United States', '17'),
  ('Yale University', 'New Haven', 'United States', '16'),
  ('Cornell University', 'Ithaca', 'United States', '13'),
  ('Columbia University', 'New York City', 'United States', '23'),
  ('Johns Hopkins University', 'Baltimore', 'United States', '28'),
  ('University of Michigan-Ann Arbor', 'Ann Arbor', 'United States', '33'),
  ('University of California, Berkeley (UCB)', 'Berkeley', 'United States', '10'),
  ('University of California, Los Angeles (UCLA)', 'Los Angeles', 'United States', '29'),
  ('New York University (NYU)', 'New York City', 'United States', '38'),
  ('Duke University', 'Durham', 'United States', '57'),
  ('Carnegie Mellon University', 'Pittsburgh', 'United States', '52'),
  ('University of California, San Diego (UCSD)', 'San Diego', 'United States', '62'),
  ('Brown University', 'Providence', 'United States', '73'),
  ('University of Texas at Austin', 'Austin', 'United States', '58'),

  -- UK
  ('University of Cambridge', 'Cambridge', 'United Kingdom', '2'),
  ('University of Oxford', 'Oxford', 'United Kingdom', '3'),
  ('Imperial College London', 'London', 'United Kingdom', '6'),
  ('UCL (University College London)', 'London', 'United Kingdom', '9'),
  ('University of Edinburgh', 'Edinburgh', 'United Kingdom', '22'),
  ('The University of Manchester', 'Manchester', 'United Kingdom', '32'),
  ('King''s College London', 'London', 'United Kingdom', '40'),
  ('London School of Economics and Political Science (LSE)', 'London', 'United Kingdom', '45'),
  ('University of Bristol', 'Bristol', 'United Kingdom', '55'),
  ('The University of Warwick', 'Coventry', 'United Kingdom', '67'),

  -- Australia
  ('The University of Melbourne', 'Melbourne', 'Australia', '14'),
  ('The University of New South Wales (UNSW Sydney)', 'Sydney', 'Australia', '19'),
  ('The University of Sydney', 'Sydney', 'Australia', '19'),
  ('The Australian National University', 'Canberra', 'Australia', '34'),
  ('Monash University', 'Melbourne', 'Australia', '42'),
  ('The University of Queensland', 'Brisbane', 'Australia', '43'),
  ('The University of Western Australia', 'Perth', 'Australia', '72'),
  ('The University of Adelaide', 'Adelaide', 'Australia', '89'),
  ('University of Technology Sydney', 'Sydney', 'Australia', '90'),

  -- Canada
  ('University of Toronto', 'Toronto', 'Canada', '21'),
  ('McGill University', 'Montreal', 'Canada', '30'),
  ('University of British Columbia', 'Vancouver', 'Canada', '34'),
  ('University of Alberta', 'Edmonton', 'Canada', '111'),
  ('University of Waterloo', 'Waterloo', 'Canada', '112'),
  ('Western University', 'London', 'Canada', '114'),
  ('Université de Montréal', 'Montreal', 'Canada', '141'),
  ('University of Calgary', 'Calgary', 'Canada', '182'),

  -- Germany
  ('Technical University of Munich', 'Munich', 'Germany', '37'),
  ('Ludwig-Maximilians-Universität München', 'Munich', 'Germany', '54'),
  ('Universität Heidelberg', 'Heidelberg', 'Germany', '87'),
  ('Freie Universität Berlin', 'Berlin', 'Germany', '98'),
  ('RWTH Aachen University', 'Aachen', 'Germany', '106')

ON CONFLICT (name) DO UPDATE 
SET 
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  global_rank = EXCLUDED.global_rank;
