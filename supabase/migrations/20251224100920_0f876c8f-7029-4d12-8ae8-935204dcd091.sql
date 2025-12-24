-- Fix existing contradictory leads where loan_type='secured' but loan_classification='unsecured'
UPDATE leads_new 
SET loan_classification = 'secured_property',
    updated_at = now()
WHERE loan_type = 'secured' 
  AND loan_classification = 'unsecured';