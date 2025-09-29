-- Safe insert sample lenders (only if they don't exist)
INSERT INTO public.lenders (name, code, description, website, contact_email, is_active) 
SELECT * FROM (VALUES
  ('HDFC Credila', 'HDFC_CREDILA', 'HDFC Education Loan provider', 'https://www.hdfccredila.com', 'info@hdfccredila.com', true),
  ('ICICI Bank', 'ICICI', 'ICICI Bank Education Loans', 'https://www.icicibank.com', 'education@icicibank.com', true),
  ('SBI', 'SBI', 'State Bank of India Education Loans', 'https://www.sbi.co.in', 'education@sbi.co.in', true),
  ('Axis Bank', 'AXIS', 'Axis Bank Education Loans', 'https://www.axisbank.com', 'education@axisbank.com', true),
  ('Punjab National Bank', 'PNB', 'PNB Education Loans', 'https://www.pnbindia.in', 'education@pnb.co.in', true)
) AS v(name, code, description, website, contact_email, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.lenders WHERE code = v.code);

-- Safe insert sample partners (only if they don't exist)
INSERT INTO public.partners (name, email, phone, address, is_active) 
SELECT * FROM (VALUES
  ('Study Abroad Consultants', 'info@studyabroad.com', '+91-9876543210', 'Mumbai, Maharashtra', true),
  ('Global Education Partners', 'contact@globaledu.com', '+91-9876543211', 'Delhi, India', true),
  ('Overseas Education Experts', 'hello@overseas.edu', '+91-9876543212', 'Bangalore, Karnataka', true)
) AS v(name, email, phone, address, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE email = v.email);

-- Update existing lead_documents to reference leads_new (if constraint doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_lead_documents_lead_new'
  ) THEN
    ALTER TABLE public.lead_documents 
    ADD CONSTRAINT fk_lead_documents_lead_new 
    FOREIGN KEY (lead_id) REFERENCES public.leads_new(id) ON DELETE CASCADE;
  END IF;
END $$;