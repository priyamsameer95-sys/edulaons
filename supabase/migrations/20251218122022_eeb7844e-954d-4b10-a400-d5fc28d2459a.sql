-- Step 1: Add new enum values only
-- Add new loan classification enum values
ALTER TYPE loan_classification_enum ADD VALUE IF NOT EXISTS 'secured_fd';
ALTER TYPE loan_classification_enum ADD VALUE IF NOT EXISTS 'unsecured';

-- Add new case complexity enum values
ALTER TYPE case_complexity_enum ADD VALUE IF NOT EXISTS 'nri_case';
ALTER TYPE case_complexity_enum ADD VALUE IF NOT EXISTS 'low_credit_case';
ALTER TYPE case_complexity_enum ADD VALUE IF NOT EXISTS 'late_intake_case';
ALTER TYPE case_complexity_enum ADD VALUE IF NOT EXISTS 'rejected_case';