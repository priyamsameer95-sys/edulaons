-- Fix lead EDU-1768206158195: mark as completed and fix co-applicant state
UPDATE leads_new 
SET 
  quick_lead_completed_at = NOW(),
  status = 'lead_intake'
WHERE case_id = 'EDU-1768206158195';

-- Fix truncated state for the co-applicant
UPDATE co_applicants 
SET state = 'Gujarat'
WHERE id = (
  SELECT co_applicant_id FROM leads_new WHERE case_id = 'EDU-1768206158195'
) AND (state = 'Gujara' OR state IS NULL);