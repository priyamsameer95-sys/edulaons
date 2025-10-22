-- Fix loan amount calculation to use min(requested_amount, lender_max) as base
-- This ensures students see realistic loan offers based on what they actually requested

CREATE OR REPLACE FUNCTION public.calculate_eligibility_score(p_lead_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_lead RECORD;
  v_lender_config RECORD;
  v_student_result RECORD;
  v_university_result RECORD;
  v_co_applicant_result RECORD;
  
  v_overall_score NUMERIC;
  v_approval_status TEXT;
  v_rejection_reason TEXT;
  v_loan_band TEXT;
  v_loan_min NUMERIC;
  v_loan_max NUMERIC;
  v_rate_tier TEXT;
  v_rate_min NUMERIC;
  v_rate_max NUMERIC;
  v_eligibility_id UUID;
  
  -- NEW: Variables for requested amount calculation
  v_requested_amount NUMERIC;
  v_base_amount NUMERIC;
BEGIN
  SELECT * INTO v_lead FROM leads_new WHERE id = p_lead_id;
  
  IF v_lead IS NULL OR v_lead.lender_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Fetch requested loan amount
  v_requested_amount := v_lead.loan_amount;
  
  SELECT * INTO v_lender_config
  FROM lender_config WHERE lender_id = v_lead.lender_id;
  
  IF v_lender_config IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- NEW: Calculate base amount - use LOWER of requested vs lender max
  v_base_amount := LEAST(v_requested_amount, v_lender_config.max_loan_amount);
  
  SELECT * INTO v_student_result
  FROM calculate_student_score(v_lead.student_id, v_lead.lender_id);
  
  SELECT * INTO v_university_result
  FROM calculate_university_score(p_lead_id, v_lead.lender_id);
  
  SELECT * INTO v_co_applicant_result
  FROM calculate_co_applicant_score(v_lead.co_applicant_id, v_lead.lender_id);
  
  v_overall_score := (
    (v_university_result.score * COALESCE((v_lender_config.score_weights->>'university_weight')::numeric, 30) / 100.0) +
    (v_student_result.score * COALESCE((v_lender_config.score_weights->>'student_weight')::numeric, 40) / 100.0) +
    (v_co_applicant_result.score * COALESCE((v_lender_config.score_weights->>'co_applicant_weight')::numeric, 30) / 100.0)
  );
  
  -- Determine approval status (all 3 must be >= 60)
  IF v_university_result.score >= 60 AND v_student_result.score >= 60 AND v_co_applicant_result.score >= 60 THEN
    IF v_overall_score >= 70 THEN
      v_approval_status := 'approved';
      v_rejection_reason := NULL;
    ELSE
      v_approval_status := 'rejected';
      v_rejection_reason := 'Overall score below 70%';
    END IF;
  ELSE
    v_approval_status := 'rejected';
    v_rejection_reason := 'One or more components below 60%';
  END IF;
  
  -- UPDATED LOAN BAND LOGIC: Based on v_base_amount instead of max_loan_amount
  IF v_overall_score >= 90 THEN
    v_loan_band := '90-100';
    v_loan_min := v_base_amount * 0.90;  -- 90% of base (requested or lender max, whichever is lower)
    v_loan_max := v_base_amount * 1.00;  -- 100% of base (full approval)
    v_rate_tier := 'excellent';
    v_rate_min := COALESCE((v_lender_config.rate_config->'excellent'->>'min')::numeric, 11.0);
    v_rate_max := v_rate_min + 1.0;
  ELSIF v_overall_score >= 80 THEN
    v_loan_band := '80-89';
    v_loan_min := v_base_amount * 0.70;  -- 70% of base
    v_loan_max := v_base_amount * 0.90;  -- 90% of base
    v_rate_tier := 'good';
    v_rate_min := COALESCE((v_lender_config.rate_config->'good'->>'min')::numeric, 12.0) + 1.0;
    v_rate_max := v_rate_min + 1.0;
  ELSIF v_overall_score >= 70 THEN
    v_loan_band := '70-79';
    v_loan_min := v_base_amount * 0.50;  -- 50% of base
    v_loan_max := v_base_amount * 0.70;  -- 70% of base
    v_rate_tier := 'average';
    v_rate_min := COALESCE((v_lender_config.rate_config->'average'->>'min')::numeric, 13.5) + 2.0;
    v_rate_max := v_rate_min + 1.0;
  ELSE
    v_loan_band := 'below-70';
    v_loan_min := 0;
    v_loan_max := 0;
    v_rate_tier := 'below_average';
    v_rate_min := NULL;
    v_rate_max := NULL;
  END IF;
  
  -- Enhance university_breakdown with loan calculation metadata
  v_university_result.breakdown := v_university_result.breakdown || jsonb_build_object(
    'loan_calculation', jsonb_build_object(
      'requested_amount', v_requested_amount,
      'lender_max', v_lender_config.max_loan_amount,
      'base_amount_used', v_base_amount,
      'calculation_method', CASE 
        WHEN v_requested_amount <= v_lender_config.max_loan_amount 
        THEN 'based_on_request'
        ELSE 'capped_at_lender_max'
      END
    )
  );
  
  INSERT INTO eligibility_scores (
    lead_id,
    lender_id,
    university_score,
    student_score,
    co_applicant_score,
    overall_score,
    university_breakdown,
    student_breakdown,
    co_applicant_breakdown,
    approval_status,
    rejection_reason,
    loan_band_percentage,
    eligible_loan_min,
    eligible_loan_max,
    rate_tier,
    interest_rate_min,
    interest_rate_max
  ) VALUES (
    p_lead_id,
    v_lead.lender_id,
    v_university_result.score,
    v_student_result.score,
    v_co_applicant_result.score,
    v_overall_score,
    v_university_result.breakdown,
    v_student_result.breakdown,
    v_co_applicant_result.breakdown,
    v_approval_status,
    v_rejection_reason,
    v_loan_band,
    v_loan_min,
    v_loan_max,
    v_rate_tier,
    v_rate_min,
    v_rate_max
  )
  ON CONFLICT (lead_id, lender_id)
  DO UPDATE SET
    university_score = EXCLUDED.university_score,
    student_score = EXCLUDED.student_score,
    co_applicant_score = EXCLUDED.co_applicant_score,
    overall_score = EXCLUDED.overall_score,
    university_breakdown = EXCLUDED.university_breakdown,
    student_breakdown = EXCLUDED.student_breakdown,
    co_applicant_breakdown = EXCLUDED.co_applicant_breakdown,
    approval_status = EXCLUDED.approval_status,
    rejection_reason = EXCLUDED.rejection_reason,
    loan_band_percentage = EXCLUDED.loan_band_percentage,
    eligible_loan_min = EXCLUDED.eligible_loan_min,
    eligible_loan_max = EXCLUDED.eligible_loan_max,
    rate_tier = EXCLUDED.rate_tier,
    interest_rate_min = EXCLUDED.interest_rate_min,
    interest_rate_max = EXCLUDED.interest_rate_max,
    calculated_at = now(),
    updated_at = now()
  RETURNING id INTO v_eligibility_id;
  
  RETURN v_eligibility_id;
END;
$function$;