-- Add comprehensive lender information columns
ALTER TABLE public.lenders
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS interest_rate_min numeric(5,2),
ADD COLUMN IF NOT EXISTS interest_rate_max numeric(5,2),
ADD COLUMN IF NOT EXISTS loan_amount_min numeric(12,2),
ADD COLUMN IF NOT EXISTS loan_amount_max numeric(12,2),
ADD COLUMN IF NOT EXISTS processing_fee numeric(10,2),
ADD COLUMN IF NOT EXISTS foreclosure_charges numeric(5,2),
ADD COLUMN IF NOT EXISTS moratorium_period text,
ADD COLUMN IF NOT EXISTS processing_time_days integer,
ADD COLUMN IF NOT EXISTS disbursement_time_days integer,
ADD COLUMN IF NOT EXISTS approval_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS key_features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS eligible_expenses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS required_documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.lenders.logo_url IS 'URL or path to lender logo image';
COMMENT ON COLUMN public.lenders.interest_rate_min IS 'Minimum interest rate percentage per annum';
COMMENT ON COLUMN public.lenders.interest_rate_max IS 'Maximum interest rate percentage per annum';
COMMENT ON COLUMN public.lenders.processing_time_days IS 'Average processing time in business days';
COMMENT ON COLUMN public.lenders.disbursement_time_days IS 'Average disbursement time in days after approval';
COMMENT ON COLUMN public.lenders.approval_rate IS 'Historical approval rate percentage';
COMMENT ON COLUMN public.lenders.key_features IS 'Array of key features/benefits as JSON strings';
COMMENT ON COLUMN public.lenders.eligible_expenses IS 'Array of eligible expense categories with descriptions';
COMMENT ON COLUMN public.lenders.required_documents IS 'Array of required document types';
COMMENT ON COLUMN public.lenders.display_order IS 'Order for displaying lenders (lower = higher priority)';

-- Update existing lenders with sample data
UPDATE public.lenders 
SET 
  interest_rate_min = 8.5,
  interest_rate_max = 12.5,
  loan_amount_min = 200000,
  loan_amount_max = 5000000,
  processing_fee = 10000,
  foreclosure_charges = 2.0,
  moratorium_period = 'Course + 1 year',
  processing_time_days = 15,
  disbursement_time_days = 7,
  approval_rate = 92.0,
  key_features = jsonb_build_array(
    'No collateral needed for loans up to ₹7.5L',
    '100% education expenses covered',
    'Flexible repayment options',
    'Quick online application process',
    'Competitive interest rates'
  ),
  eligible_expenses = jsonb_build_array(
    jsonb_build_object('category', 'Tuition & Fees', 'description', 'College/School/Hostel fees including admission charges', 'icon', 'GraduationCap'),
    jsonb_build_object('category', 'Academic Materials', 'description', 'Books, library fees, and study equipment', 'icon', 'BookOpen'),
    jsonb_build_object('category', 'Travel Expenses', 'description', 'Passage money including airfare for study abroad', 'icon', 'Plane'),
    jsonb_build_object('category', 'Living Costs', 'description', 'Accommodation and food expenses during studies', 'icon', 'Home'),
    jsonb_build_object('category', 'Insurance', 'description', 'Life and credit insurance premiums', 'icon', 'Shield')
  ),
  required_documents = jsonb_build_array(
    'Student ID Proof (Aadhaar/PAN)',
    'Admission Letter from University',
    'Academic Records (10th, 12th, UG)',
    'Income Proof of Co-applicant',
    'Bank Statements (6 months)',
    'Co-applicant ID Proof'
  ),
  display_order = 1
WHERE code = 'HDFC_CREDILA';

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_lenders_display_order ON public.lenders(display_order, is_active);