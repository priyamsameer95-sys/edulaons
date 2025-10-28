-- Phase 2: Fix ambiguous column reference in calculate_student_score function

CREATE OR REPLACE FUNCTION public.calculate_student_score(p_student_id uuid, p_lender_id uuid)
 RETURNS TABLE(score numeric, breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Calculate test score points (highest test only) - FIX: Use explicit column names
  SELECT 
    at.id,
    at.student_id,
    at.test_type,
    at.score,
    at.test_date,
    at.certificate_number,
    at.expiry_date
  INTO v_test 
  FROM academic_tests at 
  WHERE at.student_id = p_student_id
  ORDER BY 
    CASE at.test_type
      WHEN 'IELTS' THEN COALESCE(at.score::numeric, 0) * 10
      WHEN 'TOEFL' THEN COALESCE(at.score::numeric, 0)
      WHEN 'GRE' THEN COALESCE(at.score::numeric, 0) / 3.4
      WHEN 'GMAT' THEN COALESCE(at.score::numeric, 0) / 7
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
$function$;