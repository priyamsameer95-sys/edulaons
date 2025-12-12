-- Add optimized indexes for search and filtering at scale
CREATE INDEX IF NOT EXISTS idx_leads_new_status_partner ON leads_new (status, partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_new_case_id ON leads_new (case_id);
CREATE INDEX IF NOT EXISTS idx_students_name_email_gin ON students USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '')));

-- Server-side paginated search function
CREATE OR REPLACE FUNCTION search_leads(
  search_query TEXT DEFAULT '',
  status_filter TEXT DEFAULT NULL,
  partner_filter UUID DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 50
) RETURNS TABLE (
  id UUID,
  case_id TEXT,
  student_id UUID,
  co_applicant_id UUID,
  partner_id UUID,
  lender_id UUID,
  loan_amount NUMERIC,
  loan_type loan_type_enum,
  study_destination study_destination_enum,
  intake_month INT,
  intake_year INT,
  status lead_status_enum,
  documents_status document_status_enum,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM leads_new l
  LEFT JOIN students s ON l.student_id = s.id
  WHERE 
    (search_query = '' OR 
     l.case_id ILIKE '%' || search_query || '%' OR
     s.name ILIKE '%' || search_query || '%' OR
     s.email ILIKE '%' || search_query || '%' OR
     s.phone ILIKE '%' || search_query || '%')
    AND (status_filter IS NULL OR l.status::TEXT = status_filter)
    AND (partner_filter IS NULL OR l.partner_id = partner_filter);

  -- Return paginated results with total
  RETURN QUERY
  SELECT 
    l.id,
    l.case_id,
    l.student_id,
    l.co_applicant_id,
    l.partner_id,
    l.lender_id,
    l.loan_amount,
    l.loan_type,
    l.study_destination,
    l.intake_month,
    l.intake_year,
    l.status,
    l.documents_status,
    l.created_at,
    l.updated_at,
    total AS total_count
  FROM leads_new l
  LEFT JOIN students s ON l.student_id = s.id
  WHERE 
    (search_query = '' OR 
     l.case_id ILIKE '%' || search_query || '%' OR
     s.name ILIKE '%' || search_query || '%' OR
     s.email ILIKE '%' || search_query || '%' OR
     s.phone ILIKE '%' || search_query || '%')
    AND (status_filter IS NULL OR l.status::TEXT = status_filter)
    AND (partner_filter IS NULL OR l.partner_id = partner_filter)
  ORDER BY l.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$;