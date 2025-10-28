-- Phase 1: Create default lender configurations for all 5 active lenders

-- Default lender configuration for Axis Bank
INSERT INTO lender_config (
  lender_id,
  max_loan_amount,
  score_weights,
  scoring_rules,
  loan_bands,
  rate_config,
  university_grade_mapping
)
SELECT 
  id,
  5000000, -- 50 lakhs max
  '{"university_weight": 30, "student_weight": 40, "co_applicant_weight": 30}'::jsonb,
  '{
    "university_grades": {"A": 80, "B": 65, "C": 50, "D": 35},
    "course_eligibility": {"eligible": 20, "partially_eligible": 10, "not_eligible": 0},
    "highest_qualification": {"phd": 20, "masters": 16, "bachelors": 12, "diploma": 8, "12th": 4},
    "student_academic": {
      "max_tenth_points": 10,
      "tenth_points_per_10_percent": 1.0,
      "max_twelfth_points": 15,
      "twelfth_points_per_10_percent": 1.5,
      "max_bachelors_points": 15,
      "bachelors_points_per_10_percent": 1.5
    },
    "student_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4},
    "test_scores": {
      "ielts": {"7_0_plus": 10, "6_5_to_6_9": 7, "6_0_to_6_4": 5, "below_6_0": 0},
      "toefl": {"100_plus": 10, "80_to_99": 7, "60_to_79": 5, "below_60": 0},
      "gre": {"320_plus": 10, "300_to_319": 7, "280_to_299": 5, "below_280": 0},
      "gmat": {"700_plus": 10, "650_to_699": 7, "600_to_649": 5, "below_600": 0}
    },
    "co_applicant_relationship": {"father": 25, "mother": 25, "brother": 20, "sister": 20, "spouse": 15, "other": 10},
    "co_applicant_employment": {"salaried": 25, "business_owner": 22, "self_employed": 20},
    "co_applicant_salary_bands": {"above_1_lakh": 40, "75k_to_1_lakh": 30, "50k_to_75k": 20, "below_50k": 10},
    "co_applicant_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4}
  }'::jsonb,
  '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "80-89": {"min_percent": 70, "max_percent": 90},
    "70-79": {"min_percent": 50, "max_percent": 70},
    "below-70": {"min_percent": 0, "max_percent": 50}
  }'::jsonb,
  '{
    "excellent": {"min": 11.0, "max": 12.0, "score_threshold": 90},
    "good": {"min": 12.0, "max": 13.5, "score_threshold": 80},
    "average": {"min": 13.5, "max": 15.0, "score_threshold": 70},
    "below_average": {"min": 15.0, "max": 16.0, "score_threshold": 0}
  }'::jsonb,
  '{}'::jsonb
FROM lenders WHERE code = 'AXIS'
ON CONFLICT (lender_id) DO NOTHING;

-- Default lender configuration for Credila
INSERT INTO lender_config (
  lender_id,
  max_loan_amount,
  score_weights,
  scoring_rules,
  loan_bands,
  rate_config,
  university_grade_mapping
)
SELECT 
  id,
  6000000, -- 60 lakhs max
  '{"university_weight": 30, "student_weight": 40, "co_applicant_weight": 30}'::jsonb,
  '{
    "university_grades": {"A": 80, "B": 65, "C": 50, "D": 35},
    "course_eligibility": {"eligible": 20, "partially_eligible": 10, "not_eligible": 0},
    "highest_qualification": {"phd": 20, "masters": 16, "bachelors": 12, "diploma": 8, "12th": 4},
    "student_academic": {
      "max_tenth_points": 10,
      "tenth_points_per_10_percent": 1.0,
      "max_twelfth_points": 15,
      "twelfth_points_per_10_percent": 1.5,
      "max_bachelors_points": 15,
      "bachelors_points_per_10_percent": 1.5
    },
    "student_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4},
    "test_scores": {
      "ielts": {"7_0_plus": 10, "6_5_to_6_9": 7, "6_0_to_6_4": 5, "below_6_0": 0},
      "toefl": {"100_plus": 10, "80_to_99": 7, "60_to_79": 5, "below_60": 0},
      "gre": {"320_plus": 10, "300_to_319": 7, "280_to_299": 5, "below_280": 0},
      "gmat": {"700_plus": 10, "650_to_699": 7, "600_to_649": 5, "below_600": 0}
    },
    "co_applicant_relationship": {"father": 25, "mother": 25, "brother": 20, "sister": 20, "spouse": 15, "other": 10},
    "co_applicant_employment": {"salaried": 25, "business_owner": 22, "self_employed": 20},
    "co_applicant_salary_bands": {"above_1_lakh": 40, "75k_to_1_lakh": 30, "50k_to_75k": 20, "below_50k": 10},
    "co_applicant_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4}
  }'::jsonb,
  '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "80-89": {"min_percent": 70, "max_percent": 90},
    "70-79": {"min_percent": 50, "max_percent": 70},
    "below-70": {"min_percent": 0, "max_percent": 50}
  }'::jsonb,
  '{
    "excellent": {"min": 10.5, "max": 11.5, "score_threshold": 90},
    "good": {"min": 11.5, "max": 13.0, "score_threshold": 80},
    "average": {"min": 13.0, "max": 14.5, "score_threshold": 70},
    "below_average": {"min": 14.5, "max": 15.5, "score_threshold": 0}
  }'::jsonb,
  '{}'::jsonb
FROM lenders WHERE code = 'CREDILA'
ON CONFLICT (lender_id) DO NOTHING;

-- Default lender configuration for ICICI Bank
INSERT INTO lender_config (
  lender_id,
  max_loan_amount,
  score_weights,
  scoring_rules,
  loan_bands,
  rate_config,
  university_grade_mapping
)
SELECT 
  id,
  5000000, -- 50 lakhs max
  '{"university_weight": 30, "student_weight": 40, "co_applicant_weight": 30}'::jsonb,
  '{
    "university_grades": {"A": 80, "B": 65, "C": 50, "D": 35},
    "course_eligibility": {"eligible": 20, "partially_eligible": 10, "not_eligible": 0},
    "highest_qualification": {"phd": 20, "masters": 16, "bachelors": 12, "diploma": 8, "12th": 4},
    "student_academic": {
      "max_tenth_points": 10,
      "tenth_points_per_10_percent": 1.0,
      "max_twelfth_points": 15,
      "twelfth_points_per_10_percent": 1.5,
      "max_bachelors_points": 15,
      "bachelors_points_per_10_percent": 1.5
    },
    "student_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4},
    "test_scores": {
      "ielts": {"7_0_plus": 10, "6_5_to_6_9": 7, "6_0_to_6_4": 5, "below_6_0": 0},
      "toefl": {"100_plus": 10, "80_to_99": 7, "60_to_79": 5, "below_60": 0},
      "gre": {"320_plus": 10, "300_to_319": 7, "280_to_299": 5, "below_280": 0},
      "gmat": {"700_plus": 10, "650_to_699": 7, "600_to_649": 5, "below_600": 0}
    },
    "co_applicant_relationship": {"father": 25, "mother": 25, "brother": 20, "sister": 20, "spouse": 15, "other": 10},
    "co_applicant_employment": {"salaried": 25, "business_owner": 22, "self_employed": 20},
    "co_applicant_salary_bands": {"above_1_lakh": 40, "75k_to_1_lakh": 30, "50k_to_75k": 20, "below_50k": 10},
    "co_applicant_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4}
  }'::jsonb,
  '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "80-89": {"min_percent": 70, "max_percent": 90},
    "70-79": {"min_percent": 50, "max_percent": 70},
    "below-70": {"min_percent": 0, "max_percent": 50}
  }'::jsonb,
  '{
    "excellent": {"min": 11.5, "max": 12.5, "score_threshold": 90},
    "good": {"min": 12.5, "max": 14.0, "score_threshold": 80},
    "average": {"min": 14.0, "max": 15.5, "score_threshold": 70},
    "below_average": {"min": 15.5, "max": 16.5, "score_threshold": 0}
  }'::jsonb,
  '{}'::jsonb
FROM lenders WHERE code = 'ICICI'
ON CONFLICT (lender_id) DO NOTHING;

-- Default lender configuration for Punjab National Bank
INSERT INTO lender_config (
  lender_id,
  max_loan_amount,
  score_weights,
  scoring_rules,
  loan_bands,
  rate_config,
  university_grade_mapping
)
SELECT 
  id,
  4000000, -- 40 lakhs max
  '{"university_weight": 30, "student_weight": 40, "co_applicant_weight": 30}'::jsonb,
  '{
    "university_grades": {"A": 80, "B": 65, "C": 50, "D": 35},
    "course_eligibility": {"eligible": 20, "partially_eligible": 10, "not_eligible": 0},
    "highest_qualification": {"phd": 20, "masters": 16, "bachelors": 12, "diploma": 8, "12th": 4},
    "student_academic": {
      "max_tenth_points": 10,
      "tenth_points_per_10_percent": 1.0,
      "max_twelfth_points": 15,
      "twelfth_points_per_10_percent": 1.5,
      "max_bachelors_points": 15,
      "bachelors_points_per_10_percent": 1.5
    },
    "student_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4},
    "test_scores": {
      "ielts": {"7_0_plus": 10, "6_5_to_6_9": 7, "6_0_to_6_4": 5, "below_6_0": 0},
      "toefl": {"100_plus": 10, "80_to_99": 7, "60_to_79": 5, "below_60": 0},
      "gre": {"320_plus": 10, "300_to_319": 7, "280_to_299": 5, "below_280": 0},
      "gmat": {"700_plus": 10, "650_to_699": 7, "600_to_649": 5, "below_600": 0}
    },
    "co_applicant_relationship": {"father": 25, "mother": 25, "brother": 20, "sister": 20, "spouse": 15, "other": 10},
    "co_applicant_employment": {"salaried": 25, "business_owner": 22, "self_employed": 20},
    "co_applicant_salary_bands": {"above_1_lakh": 40, "75k_to_1_lakh": 30, "50k_to_75k": 20, "below_50k": 10},
    "co_applicant_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4}
  }'::jsonb,
  '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "80-89": {"min_percent": 70, "max_percent": 90},
    "70-79": {"min_percent": 50, "max_percent": 70},
    "below-70": {"min_percent": 0, "max_percent": 50}
  }'::jsonb,
  '{
    "excellent": {"min": 10.0, "max": 11.0, "score_threshold": 90},
    "good": {"min": 11.0, "max": 12.5, "score_threshold": 80},
    "average": {"min": 12.5, "max": 14.0, "score_threshold": 70},
    "below_average": {"min": 14.0, "max": 15.0, "score_threshold": 0}
  }'::jsonb,
  '{}'::jsonb
FROM lenders WHERE code = 'PNB'
ON CONFLICT (lender_id) DO NOTHING;

-- Default lender configuration for SBI
INSERT INTO lender_config (
  lender_id,
  max_loan_amount,
  score_weights,
  scoring_rules,
  loan_bands,
  rate_config,
  university_grade_mapping
)
SELECT 
  id,
  7500000, -- 75 lakhs max (SBI typically offers higher amounts)
  '{"university_weight": 30, "student_weight": 40, "co_applicant_weight": 30}'::jsonb,
  '{
    "university_grades": {"A": 80, "B": 65, "C": 50, "D": 35},
    "course_eligibility": {"eligible": 20, "partially_eligible": 10, "not_eligible": 0},
    "highest_qualification": {"phd": 20, "masters": 16, "bachelors": 12, "diploma": 8, "12th": 4},
    "student_academic": {
      "max_tenth_points": 10,
      "tenth_points_per_10_percent": 1.0,
      "max_twelfth_points": 15,
      "twelfth_points_per_10_percent": 1.5,
      "max_bachelors_points": 15,
      "bachelors_points_per_10_percent": 1.5
    },
    "student_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4},
    "test_scores": {
      "ielts": {"7_0_plus": 10, "6_5_to_6_9": 7, "6_0_to_6_4": 5, "below_6_0": 0},
      "toefl": {"100_plus": 10, "80_to_99": 7, "60_to_79": 5, "below_60": 0},
      "gre": {"320_plus": 10, "300_to_319": 7, "280_to_299": 5, "below_280": 0},
      "gmat": {"700_plus": 10, "650_to_699": 7, "600_to_649": 5, "below_600": 0}
    },
    "co_applicant_relationship": {"father": 25, "mother": 25, "brother": 20, "sister": 20, "spouse": 15, "other": 10},
    "co_applicant_employment": {"salaried": 25, "business_owner": 22, "self_employed": 20},
    "co_applicant_salary_bands": {"above_1_lakh": 40, "75k_to_1_lakh": 30, "50k_to_75k": 20, "below_50k": 10},
    "co_applicant_pin_code_tier": {"tier1": 10, "tier2": 7, "tier3": 4}
  }'::jsonb,
  '{
    "90-100": {"min_percent": 90, "max_percent": 100},
    "80-89": {"min_percent": 70, "max_percent": 90},
    "70-79": {"min_percent": 50, "max_percent": 70},
    "below-70": {"min_percent": 0, "max_percent": 50}
  }'::jsonb,
  '{
    "excellent": {"min": 9.5, "max": 10.5, "score_threshold": 90},
    "good": {"min": 10.5, "max": 12.0, "score_threshold": 80},
    "average": {"min": 12.0, "max": 13.5, "score_threshold": 70},
    "below_average": {"min": 13.5, "max": 14.5, "score_threshold": 0}
  }'::jsonb,
  '{}'::jsonb
FROM lenders WHERE code = 'SBI'
ON CONFLICT (lender_id) DO NOTHING;

-- Verify configurations were created
SELECT 
  l.name as lender_name,
  lc.max_loan_amount,
  lc.created_at
FROM lender_config lc
JOIN lenders l ON l.id = lc.lender_id
ORDER BY l.name;