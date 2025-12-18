-- Step 1: Add FD document types
INSERT INTO document_types (id, name, category, description, display_order, required)
VALUES 
  (gen_random_uuid(), 'FD Certificate', 'collateral', 'Fixed deposit certificate as collateral', 100, true),
  (gen_random_uuid(), 'FD Lien Confirmation Letter', 'collateral', 'Bank confirmation of lien on FD', 101, true);

-- Step 2: Insert 11 document requirements for 'unsecured' loan classification
INSERT INTO document_requirements (document_type_id, loan_classification, is_required, stage, display_order)
VALUES
  -- Student documents (1-6)
  ('dcf476e0-9420-455b-beee-f8b213571abe', 'unsecured', true, 'initial', 1),  -- PAN Copy
  ('f84c4122-b4b3-4657-9766-5922645d471e', 'unsecured', true, 'initial', 2),  -- Aadhaar Copy
  ('21feb69a-36c5-4a2b-bdf1-ca1d900451d9', 'unsecured', true, 'initial', 3),  -- Photo
  ('fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', 'unsecured', true, 'initial', 4),  -- Passport
  ('db489ba4-51b3-40c6-8afb-ba1c5a49719c', 'unsecured', true, 'initial', 5),  -- Offer Letter
  ('f43f024b-7b3b-4564-830e-202fd1a653b3', 'unsecured', true, 'initial', 6),  -- Education Copies
  -- Co-applicant documents (7-11)
  ('a4ad68d8-ad67-468d-8025-2072b0d0e0a8', 'unsecured', true, 'initial', 7),  -- Co-applicant PAN
  ('d7e065e9-bd5f-4aff-aa07-142eadfe89d9', 'unsecured', true, 'initial', 8),  -- Co-applicant Aadhaar
  ('45b68050-de98-4060-94c9-2b058fdb7fcd', 'unsecured', true, 'initial', 9),  -- Co-applicant Photo
  ('0f24babd-5b59-43d4-a579-401516fa3ba5', 'unsecured', true, 'initial', 10), -- Bank Statement
  ('fa45e8e1-46d3-4e60-b07a-f2d5f386d4a5', 'unsecured', true, 'initial', 11); -- Salary Slips

-- Step 3: Insert 13 document requirements for 'secured_fd' loan classification
-- Same 11 core documents
INSERT INTO document_requirements (document_type_id, loan_classification, is_required, stage, display_order)
VALUES
  -- Student documents (1-6)
  ('dcf476e0-9420-455b-beee-f8b213571abe', 'secured_fd', true, 'initial', 1),  -- PAN Copy
  ('f84c4122-b4b3-4657-9766-5922645d471e', 'secured_fd', true, 'initial', 2),  -- Aadhaar Copy
  ('21feb69a-36c5-4a2b-bdf1-ca1d900451d9', 'secured_fd', true, 'initial', 3),  -- Photo
  ('fc9164eb-9d04-4ee1-a0f0-2c6af0c24a09', 'secured_fd', true, 'initial', 4),  -- Passport
  ('db489ba4-51b3-40c6-8afb-ba1c5a49719c', 'secured_fd', true, 'initial', 5),  -- Offer Letter
  ('f43f024b-7b3b-4564-830e-202fd1a653b3', 'secured_fd', true, 'initial', 6),  -- Education Copies
  -- Co-applicant documents (7-11)
  ('a4ad68d8-ad67-468d-8025-2072b0d0e0a8', 'secured_fd', true, 'initial', 7),  -- Co-applicant PAN
  ('d7e065e9-bd5f-4aff-aa07-142eadfe89d9', 'secured_fd', true, 'initial', 8),  -- Co-applicant Aadhaar
  ('45b68050-de98-4060-94c9-2b058fdb7fcd', 'secured_fd', true, 'initial', 9),  -- Co-applicant Photo
  ('0f24babd-5b59-43d4-a579-401516fa3ba5', 'secured_fd', true, 'initial', 10), -- Bank Statement
  ('fa45e8e1-46d3-4e60-b07a-f2d5f386d4a5', 'secured_fd', true, 'initial', 11); -- Salary Slips

-- Step 4: Add FD-specific documents to secured_fd
-- Get the IDs of newly created FD document types and add them
INSERT INTO document_requirements (document_type_id, loan_classification, is_required, stage, display_order)
SELECT id, 'secured_fd', true, 'initial', 12
FROM document_types WHERE name = 'FD Certificate';

INSERT INTO document_requirements (document_type_id, loan_classification, is_required, stage, display_order)
SELECT id, 'secured_fd', true, 'initial', 13
FROM document_types WHERE name = 'FD Lien Confirmation Letter';