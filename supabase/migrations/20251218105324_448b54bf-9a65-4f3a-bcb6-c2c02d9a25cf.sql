-- Add comprehensive document requirements for all loan classifications
-- Core KYC + Co-applicant + Education docs for each loan type

-- First, clear existing sparse data to rebuild properly
DELETE FROM document_requirements;

-- UNDECIDED (minimal starter set - 8 docs)
-- Student KYC (4)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order) VALUES
('undecided', 'dcf476e0-9420-455b-beee-f8b213571abe', true, 'initial', 1),  -- PAN Copy
('undecided', 'f84c4122-b4b3-4657-9766-5922645d471e', true, 'initial', 2),  -- Aadhaar Copy
('undecided', '21feb69a-36c5-4a2b-bdf1-ca1d900451d9', true, 'initial', 3),  -- Photo
('undecided', 'fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', true, 'initial', 4),  -- Passport
-- Co-applicant KYC (2)
('undecided', 'a4ad68d8-ad67-468d-8025-2072b0d0e0a8', true, 'initial', 5),  -- Co-applicant PAN
('undecided', 'd7e065e9-bd5f-4aff-aa07-142eadfe89d9', true, 'initial', 6),  -- Co-applicant Aadhaar
-- Education (2)
('undecided', 'db489ba4-51b3-40c6-8afb-ba1c5a49719c', true, 'initial', 7),  -- Offer Letter
('undecided', 'f43f024b-7b3b-4564-830e-202fd1a653b3', true, 'initial', 8);  -- Education Copies

-- UNSECURED_NBFC (10 docs - core + income)
-- Student KYC (4)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order) VALUES
('unsecured_nbfc', 'dcf476e0-9420-455b-beee-f8b213571abe', true, 'initial', 1),  -- PAN Copy
('unsecured_nbfc', 'f84c4122-b4b3-4657-9766-5922645d471e', true, 'initial', 2),  -- Aadhaar Copy
('unsecured_nbfc', '21feb69a-36c5-4a2b-bdf1-ca1d900451d9', true, 'initial', 3),  -- Photo
('unsecured_nbfc', 'fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', true, 'initial', 4),  -- Passport
-- Co-applicant KYC (3)
('unsecured_nbfc', 'a4ad68d8-ad67-468d-8025-2072b0d0e0a8', true, 'initial', 5),  -- Co-applicant PAN
('unsecured_nbfc', 'd7e065e9-bd5f-4aff-aa07-142eadfe89d9', true, 'initial', 6),  -- Co-applicant Aadhaar
('unsecured_nbfc', '45b68050-de98-4060-94c9-2b058fdb7fcd', true, 'initial', 7),  -- Co-applicant Photo
-- Income docs (1)
('unsecured_nbfc', '0f24babd-5b59-43d4-a579-401516fa3ba5', true, 'initial', 8),  -- Bank Statement
-- Education (2)
('unsecured_nbfc', 'db489ba4-51b3-40c6-8afb-ba1c5a49719c', true, 'initial', 9),  -- Offer Letter
('unsecured_nbfc', 'f43f024b-7b3b-4564-830e-202fd1a653b3', true, 'initial', 10); -- Education Copies

-- SECURED_PROPERTY (15 docs - core + income + property)
-- Student KYC (4)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order) VALUES
('secured_property', 'dcf476e0-9420-455b-beee-f8b213571abe', true, 'initial', 1),  -- PAN Copy
('secured_property', 'f84c4122-b4b3-4657-9766-5922645d471e', true, 'initial', 2),  -- Aadhaar Copy
('secured_property', '21feb69a-36c5-4a2b-bdf1-ca1d900451d9', true, 'initial', 3),  -- Photo
('secured_property', 'fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', true, 'initial', 4),  -- Passport
-- Co-applicant KYC (3)
('secured_property', 'a4ad68d8-ad67-468d-8025-2072b0d0e0a8', true, 'initial', 5),  -- Co-applicant PAN
('secured_property', 'd7e065e9-bd5f-4aff-aa07-142eadfe89d9', true, 'initial', 6),  -- Co-applicant Aadhaar
('secured_property', '45b68050-de98-4060-94c9-2b058fdb7fcd', true, 'initial', 7),  -- Co-applicant Photo
-- Income docs (2)
('secured_property', '0f24babd-5b59-43d4-a579-401516fa3ba5', true, 'initial', 8),  -- Bank Statement
('secured_property', 'fa45e8e1-46d3-4e60-b07a-f2d5f386d4a5', true, 'initial', 9),  -- Salary Slips
-- Education (2)
('secured_property', 'db489ba4-51b3-40c6-8afb-ba1c5a49719c', true, 'initial', 10), -- Offer Letter
('secured_property', 'f43f024b-7b3b-4564-830e-202fd1a653b3', true, 'initial', 11), -- Education Copies
-- Property docs (4)
('secured_property', '15e5c006-9e76-4d07-8ef3-c9f780a36e8d', true, 'initial', 12), -- Property Sale Deed
('secured_property', '2a0365ac-a64b-4572-af7d-8af63f7a6cab', true, 'initial', 13), -- Encumbrance Certificate
('secured_property', 'f1bd1314-ce6c-4d77-88ec-e2793f04c7a7', true, 'initial', 14), -- Property Tax Receipt
('secured_property', 'e741a7e0-1ede-4eb4-9780-82c1b51419f1', true, 'initial', 15); -- Route Map

-- PSU_BANK (12 docs - core + income, stricter requirements)
-- Student KYC (4)
INSERT INTO document_requirements (loan_classification, document_type_id, is_required, stage, display_order) VALUES
('psu_bank', 'dcf476e0-9420-455b-beee-f8b213571abe', true, 'initial', 1),  -- PAN Copy
('psu_bank', 'f84c4122-b4b3-4657-9766-5922645d471e', true, 'initial', 2),  -- Aadhaar Copy
('psu_bank', '21feb69a-36c5-4a2b-bdf1-ca1d900451d9', true, 'initial', 3),  -- Photo
('psu_bank', 'fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', true, 'initial', 4),  -- Passport
-- Co-applicant KYC (3)
('psu_bank', 'a4ad68d8-ad67-468d-8025-2072b0d0e0a8', true, 'initial', 5),  -- Co-applicant PAN
('psu_bank', 'd7e065e9-bd5f-4aff-aa07-142eadfe89d9', true, 'initial', 6),  -- Co-applicant Aadhaar
('psu_bank', '45b68050-de98-4060-94c9-2b058fdb7fcd', true, 'initial', 7),  -- Co-applicant Photo
-- Income docs (2)
('psu_bank', '0f24babd-5b59-43d4-a579-401516fa3ba5', true, 'initial', 8),  -- Bank Statement
('psu_bank', 'fa45e8e1-46d3-4e60-b07a-f2d5f386d4a5', true, 'initial', 9),  -- Salary Slips
-- Test Score (1)
('psu_bank', '237c72a6-c87b-46ac-b97b-2e0001b4a451', true, 'initial', 10), -- English Proficiency Test
-- Education (2)
('psu_bank', 'db489ba4-51b3-40c6-8afb-ba1c5a49719c', true, 'initial', 11), -- Offer Letter
('psu_bank', 'f43f024b-7b3b-4564-830e-202fd1a653b3', true, 'initial', 12); -- Education Copies