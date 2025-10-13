-- Phase 1: Add scoring configuration columns to lender_config
ALTER TABLE lender_config
ADD COLUMN IF NOT EXISTS score_weights JSONB DEFAULT '{
  "university_weight": 30,
  "student_weight": 40,
  "co_applicant_weight": 30
}'::jsonb,
ADD COLUMN IF NOT EXISTS scoring_rules JSONB DEFAULT '{
  "student_academic": {
    "tenth_points_per_10_percent": 1.0,
    "twelfth_points_per_10_percent": 1.5,
    "bachelors_points_per_10_percent": 1.5,
    "max_tenth_points": 10,
    "max_twelfth_points": 15,
    "max_bachelors_points": 15
  },
  "highest_qualification": {
    "phd": 20,
    "masters": 16,
    "bachelors": 12,
    "diploma": 8,
    "12th": 4
  },
  "student_pin_code_tier": {
    "tier1": 10,
    "tier2": 7,
    "tier3": 4
  },
  "test_scores": {
    "ielts": {
      "7_0_plus": 10,
      "6_5_to_6_9": 7,
      "6_0_to_6_4": 5,
      "below_6_0": 0
    },
    "toefl": {
      "100_plus": 10,
      "80_to_99": 7,
      "60_to_79": 5,
      "below_60": 0
    },
    "gre": {
      "320_plus": 10,
      "300_to_319": 7,
      "280_to_299": 5,
      "below_280": 0
    },
    "gmat": {
      "700_plus": 10,
      "650_to_699": 7,
      "600_to_649": 5,
      "below_600": 0
    }
  },
  "university_grades": {
    "A": 80,
    "B": 65,
    "C": 50,
    "D": 35
  },
  "course_eligibility": {
    "eligible": 20,
    "partially_eligible": 10,
    "not_eligible": 0
  },
  "co_applicant_relationship": {
    "father": 25,
    "mother": 25,
    "brother": 20,
    "sister": 20,
    "spouse": 15,
    "other": 10
  },
  "co_applicant_employment": {
    "salaried": 25,
    "self_employed": 20,
    "business_owner": 22
  },
  "co_applicant_salary_bands": {
    "above_1_lakh": 40,
    "75k_to_1_lakh": 30,
    "50k_to_75k": 20,
    "below_50k": 10
  },
  "co_applicant_pin_code_tier": {
    "tier1": 10,
    "tier2": 7,
    "tier3": 4
  }
}'::jsonb;

-- Add pin_code_tier to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS pin_code_tier TEXT CHECK (pin_code_tier IN ('tier1', 'tier2', 'tier3'));

-- Phase 2: Create scoring calculation functions

-- Function 1: Calculate Student Score
CREATE OR REPLACE FUNCTION calculate_student_score(
  p_student_id UUID,
  p_lender_id UUID
) RETURNS TABLE(
  score NUMERIC,
  breakdown JSONB
) AS $$
DECLARE
  v_student RECORD;
  v_test RECORD;
  v_scoring_rules JSONB;
  v_score NUMERIC := 0;
  v_breakdown JSONB := '{}'::jsonb;
  
  v_tenth_points NUMERIC := 0;
  v_twelfth_points NUMERIC := 0;
  v_bachelors_points NUMERIC := 0;
  v_qualification_points NUMERIC := 0;
  v_pin_tier_points NUMERIC := 0;
  v_test_points NUMERIC := 0;
BEGIN
  -- Get student data
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF v_student IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Get scoring rules from lender_config
  SELECT scoring_rules INTO v_scoring_rules
  FROM lender_config WHERE lender_id = p_lender_id;
  
  IF v_scoring_rules IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Calculate 10th marks points
  IF v_student.tenth_percentage IS NOT NULL THEN
    v_tenth_points := LEAST(
      (v_student.tenth_percentage / 10.0) * COALESCE((v_scoring_rules->'student_academic'->>'tenth_points_per_10_percent')::numeric, 1.0),
      COALESCE((v_scoring_rules->'student_academic'->>'max_tenth_points')::numeric, 10)
    );
  END IF;
  
  -- Calculate 12th marks points
  IF v_student.twelfth_percentage IS NOT NULL THEN
    v_twelfth_points := LEAST(
      (v_student.twelfth_percentage / 10.0) * COALESCE((v_scoring_rules->'student_academic'->>'twelfth_points_per_10_percent')::numeric, 1.5),
      COALESCE((v_scoring_rules->'student_academic'->>'max_twelfth_points')::numeric, 15)
    );
  END IF;
  
  -- Calculate bachelor's points (only if highest qualification is bachelors or below)
  IF v_student.highest_qualification IN ('bachelors', 'diploma', '12th') AND v_student.bachelors_percentage IS NOT NULL THEN
    v_bachelors_points := LEAST(
      (v_student.bachelors_percentage / 10.0) * COALESCE((v_scoring_rules->'student_academic'->>'bachelors_points_per_10_percent')::numeric, 1.5),
      COALESCE((v_scoring_rules->'student_academic'->>'max_bachelors_points')::numeric, 15)
    );
  END IF;
  
  -- Calculate highest qualification points
  IF v_student.highest_qualification IS NOT NULL THEN
    v_qualification_points := COALESCE(
      (v_scoring_rules->'highest_qualification'->>v_student.highest_qualification)::numeric,
      0
    );
  END IF;
  
  -- Calculate student PIN code tier points
  IF v_student.pin_code_tier IS NOT NULL THEN
    v_pin_tier_points := COALESCE(
      (v_scoring_rules->'student_pin_code_tier'->>v_student.pin_code_tier)::numeric,
      0
    );
  END IF;
  
  -- Calculate test score points (highest test only)
  SELECT * INTO v_test FROM academic_tests WHERE student_id = p_student_id
  ORDER BY 
    CASE test_type
      WHEN 'IELTS' THEN COALESCE(score::numeric, 0) * 10
      WHEN 'TOEFL' THEN COALESCE(score::numeric, 0)
      WHEN 'GRE' THEN COALESCE(score::numeric, 0) / 3.4
      WHEN 'GMAT' THEN COALESCE(score::numeric, 0) / 7
      ELSE 0
    END DESC
  LIMIT 1;
  
  IF v_test IS NOT NULL AND v_test.score IS NOT NULL THEN
    CASE v_test.test_type
      WHEN 'IELTS' THEN
        IF v_test.score::numeric >= 7.0 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'ielts'->>'7_0_plus')::numeric, 0);
        ELSIF v_test.score::numeric >= 6.5 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'ielts'->>'6_5_to_6_9')::numeric, 0);
        ELSIF v_test.score::numeric >= 6.0 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'ielts'->>'6_0_to_6_4')::numeric, 0);
        END IF;
      WHEN 'TOEFL' THEN
        IF v_test.score::numeric >= 100 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'toefl'->>'100_plus')::numeric, 0);
        ELSIF v_test.score::numeric >= 80 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'toefl'->>'80_to_99')::numeric, 0);
        ELSIF v_test.score::numeric >= 60 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'toefl'->>'60_to_79')::numeric, 0);
        END IF;
      WHEN 'GRE' THEN
        IF v_test.score::numeric >= 320 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gre'->>'320_plus')::numeric, 0);
        ELSIF v_test.score::numeric >= 300 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gre'->>'300_to_319')::numeric, 0);
        ELSIF v_test.score::numeric >= 280 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gre'->>'280_to_299')::numeric, 0);
        END IF;
      WHEN 'GMAT' THEN
        IF v_test.score::numeric >= 700 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gmat'->>'700_plus')::numeric, 0);
        ELSIF v_test.score::numeric >= 650 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gmat'->>'650_to_699')::numeric, 0);
        ELSIF v_test.score::numeric >= 600 THEN
          v_test_points := COALESCE((v_scoring_rules->'test_scores'->'gmat'->>'600_to_649')::numeric, 0);
        END IF;
    END CASE;
  END IF;
  
  -- Sum all components
  v_score := v_tenth_points + v_twelfth_points + v_bachelors_points + 
             v_qualification_points + v_pin_tier_points + v_test_points;
  
  -- Build breakdown
  v_breakdown := jsonb_build_object(
    'tenth_marks', v_student.tenth_percentage,
    'tenth_points', v_tenth_points,
    'twelfth_marks', v_student.twelfth_percentage,
    'twelfth_points', v_twelfth_points,
    'bachelors_marks', v_student.bachelors_percentage,
    'bachelors_points', v_bachelors_points,
    'highest_qualification', v_student.highest_qualification,
    'qualification_points', v_qualification_points,
    'pin_code_tier', v_student.pin_code_tier,
    'pin_tier_points', v_pin_tier_points,
    'test_type', COALESCE(v_test.test_type::text, 'none'),
    'test_score', COALESCE(v_test.score, 'N/A'),
    'test_points', v_test_points
  );
  
  RETURN QUERY SELECT v_score, v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Calculate University Score
CREATE OR REPLACE FUNCTION calculate_university_score(
  p_lead_id UUID,
  p_lender_id UUID
) RETURNS TABLE(
  score NUMERIC,
  breakdown JSONB
) AS $$
DECLARE
  v_university RECORD;
  v_scoring_rules JSONB;
  v_custom_mapping JSONB;
  v_grade TEXT;
  v_grade_points NUMERIC := 0;
  v_course_eligibility_points NUMERIC := 0;
  v_score NUMERIC := 0;
  v_breakdown JSONB := '{}'::jsonb;
BEGIN
  -- Get first university from lead_universities
  SELECT u.* INTO v_university
  FROM lead_universities lu
  JOIN universities u ON lu.university_id = u.id
  WHERE lu.lead_id = p_lead_id
  LIMIT 1;
  
  IF v_university IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Get scoring rules and custom mapping
  SELECT scoring_rules, university_grade_mapping 
  INTO v_scoring_rules, v_custom_mapping
  FROM lender_config
  WHERE lender_id = p_lender_id;
  
  IF v_scoring_rules IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Determine grade
  IF v_custom_mapping IS NOT NULL AND v_custom_mapping ? v_university.id::text THEN
    -- Use custom grade mapping
    v_grade := v_custom_mapping->>v_university.id::text;
  ELSE
    -- Use QS rank-based grading
    IF v_university.global_rank IS NOT NULL THEN
      IF v_university.global_rank BETWEEN 1 AND 100 THEN
        v_grade := 'A';
      ELSIF v_university.global_rank BETWEEN 101 AND 300 THEN
        v_grade := 'B';
      ELSIF v_university.global_rank BETWEEN 301 AND 500 THEN
        v_grade := 'C';
      ELSE
        v_grade := 'D';
      END IF;
    ELSE
      v_grade := 'D';
    END IF;
  END IF;
  
  -- Get grade points
  v_grade_points := COALESCE(
    (v_scoring_rules->'university_grades'->>v_grade)::numeric,
    0
  );
  
  -- Course eligibility (default to eligible for now)
  v_course_eligibility_points := COALESCE(
    (v_scoring_rules->'course_eligibility'->>'eligible')::numeric,
    20
  );
  
  v_score := v_grade_points + v_course_eligibility_points;
  
  v_breakdown := jsonb_build_object(
    'university_name', v_university.name,
    'qs_rank', v_university.global_rank,
    'grade', v_grade,
    'grade_points', v_grade_points,
    'course_eligibility', 'eligible',
    'eligibility_points', v_course_eligibility_points
  );
  
  RETURN QUERY SELECT v_score, v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Calculate Co-Applicant Score
CREATE OR REPLACE FUNCTION calculate_co_applicant_score(
  p_co_applicant_id UUID,
  p_lender_id UUID
) RETURNS TABLE(
  score NUMERIC,
  breakdown JSONB
) AS $$
DECLARE
  v_co_applicant RECORD;
  v_scoring_rules JSONB;
  v_relationship_points NUMERIC := 0;
  v_employment_points NUMERIC := 0;
  v_salary_points NUMERIC := 0;
  v_pin_tier_points NUMERIC := 0;
  v_score NUMERIC := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_pin_tier TEXT;
BEGIN
  -- Get co-applicant data
  SELECT * INTO v_co_applicant FROM co_applicants WHERE id = p_co_applicant_id;
  
  IF v_co_applicant IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Get scoring rules
  SELECT scoring_rules INTO v_scoring_rules
  FROM lender_config WHERE lender_id = p_lender_id;
  
  IF v_scoring_rules IS NULL THEN
    RETURN QUERY SELECT 0::numeric, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Calculate relationship points
  v_relationship_points := COALESCE(
    (v_scoring_rules->'co_applicant_relationship'->>LOWER(v_co_applicant.relationship::text))::numeric,
    0
  );
  
  -- Calculate employment type points
  IF v_co_applicant.employment_type IS NOT NULL THEN
    v_employment_points := COALESCE(
      (v_scoring_rules->'co_applicant_employment'->>v_co_applicant.employment_type)::numeric,
      0
    );
  END IF;
  
  -- Calculate salary band points
  IF v_co_applicant.monthly_salary IS NOT NULL THEN
    IF v_co_applicant.monthly_salary >= 100000 THEN
      v_salary_points := COALESCE((v_scoring_rules->'co_applicant_salary_bands'->>'above_1_lakh')::numeric, 0);
    ELSIF v_co_applicant.monthly_salary >= 75000 THEN
      v_salary_points := COALESCE((v_scoring_rules->'co_applicant_salary_bands'->>'75k_to_1_lakh')::numeric, 0);
    ELSIF v_co_applicant.monthly_salary >= 50000 THEN
      v_salary_points := COALESCE((v_scoring_rules->'co_applicant_salary_bands'->>'50k_to_75k')::numeric, 0);
    ELSE
      v_salary_points := COALESCE((v_scoring_rules->'co_applicant_salary_bands'->>'below_50k')::numeric, 0);
    END IF;
  END IF;
  
  -- Get PIN code tier points (lookup from pin_code_tiers table)
  IF v_co_applicant.pin_code IS NOT NULL THEN
    SELECT tier INTO v_pin_tier
    FROM pin_code_tiers
    WHERE pin_code = v_co_applicant.pin_code;
    
    IF v_pin_tier IS NOT NULL THEN
      v_pin_tier_points := COALESCE(
        (v_scoring_rules->'co_applicant_pin_code_tier'->>v_pin_tier)::numeric,
        0
      );
    END IF;
  END IF;
  
  v_score := v_relationship_points + v_employment_points + v_salary_points + v_pin_tier_points;
  
  v_breakdown := jsonb_build_object(
    'relationship', v_co_applicant.relationship,
    'relationship_points', v_relationship_points,
    'employment_type', v_co_applicant.employment_type,
    'employment_points', v_employment_points,
    'monthly_salary', v_co_applicant.monthly_salary,
    'salary_points', v_salary_points,
    'pin_code', v_co_applicant.pin_code,
    'pin_tier', v_pin_tier,
    'pin_tier_points', v_pin_tier_points
  );
  
  RETURN QUERY SELECT v_score, v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Master Eligibility Calculation
CREATE OR REPLACE FUNCTION calculate_eligibility_score(
  p_lead_id UUID
) RETURNS UUID AS $$
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
BEGIN
  -- Get lead details
  SELECT * INTO v_lead FROM leads_new WHERE id = p_lead_id;
  
  IF v_lead IS NULL OR v_lead.lender_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get lender config including weights
  SELECT * INTO v_lender_config
  FROM lender_config WHERE lender_id = v_lead.lender_id;
  
  IF v_lender_config IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate individual scores
  SELECT * INTO v_student_result
  FROM calculate_student_score(v_lead.student_id, v_lead.lender_id);
  
  SELECT * INTO v_university_result
  FROM calculate_university_score(p_lead_id, v_lead.lender_id);
  
  SELECT * INTO v_co_applicant_result
  FROM calculate_co_applicant_score(v_lead.co_applicant_id, v_lead.lender_id);
  
  -- Apply weights to get overall score
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
  
  -- Determine loan band and interest rate tier
  IF v_overall_score >= 90 THEN
    v_loan_band := '90-100';
    v_loan_min := v_lender_config.max_loan_amount * 0.90;
    v_loan_max := v_lender_config.max_loan_amount * 1.00;
    v_rate_tier := 'excellent';
    v_rate_min := COALESCE((v_lender_config.rate_config->'excellent'->>'min')::numeric, 11.0);
    v_rate_max := v_rate_min + 1.0;
  ELSIF v_overall_score >= 80 THEN
    v_loan_band := '70-90';
    v_loan_min := v_lender_config.max_loan_amount * 0.70;
    v_loan_max := v_lender_config.max_loan_amount * 0.90;
    v_rate_tier := 'good';
    v_rate_min := COALESCE((v_lender_config.rate_config->'good'->>'min')::numeric, 12.0) + 1.0;
    v_rate_max := v_rate_min + 1.0;
  ELSIF v_overall_score >= 70 THEN
    v_loan_band := '50-70';
    v_loan_min := v_lender_config.max_loan_amount * 0.50;
    v_loan_max := v_lender_config.max_loan_amount * 0.70;
    v_rate_tier := 'average';
    v_rate_min := COALESCE((v_lender_config.rate_config->'average'->>'min')::numeric, 13.5) + 2.0;
    v_rate_max := v_rate_min + 1.0;
  ELSE
    v_loan_band := 'rejected';
    v_loan_min := 0;
    v_loan_max := 0;
    v_rate_tier := 'below_average';
    v_rate_min := NULL;
    v_rate_max := NULL;
  END IF;
  
  -- Insert or update eligibility_scores
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Trigger function
CREATE OR REPLACE FUNCTION trigger_calculate_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if we have all required data
  IF NEW.student_id IS NOT NULL AND NEW.co_applicant_id IS NOT NULL AND NEW.lender_id IS NOT NULL THEN
    PERFORM calculate_eligibility_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_calculate_eligibility ON leads_new;

-- Create trigger on leads_new
CREATE TRIGGER auto_calculate_eligibility
AFTER INSERT OR UPDATE OF student_id, co_applicant_id, lender_id
ON leads_new
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_eligibility();