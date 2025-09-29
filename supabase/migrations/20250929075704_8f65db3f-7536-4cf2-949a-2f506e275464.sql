-- Remove dummy/test partners that were added during development
DELETE FROM public.partners 
WHERE name IN (
  'Study Abroad Consultants', 
  'Global Education Partners', 
  'Overseas Education Experts'
);