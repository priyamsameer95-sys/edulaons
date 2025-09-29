-- Phase 1: Create Enum Types and Constraints
CREATE TYPE public.lead_status_enum AS ENUM (
  'new',
  'contacted', 
  'in_progress',
  'document_review',
  'approved',
  'rejected',
  'withdrawn'
);

CREATE TYPE public.document_status_enum AS ENUM (
  'pending',
  'uploaded',
  'verified',
  'rejected',
  'resubmission_required'
);

CREATE TYPE public.loan_type_enum AS ENUM (
  'secured',
  'unsecured'
);

CREATE TYPE public.relationship_enum AS ENUM (
  'parent',
  'spouse',
  'sibling',
  'guardian',
  'other'
);

CREATE TYPE public.study_destination_enum AS ENUM (
  'Australia',
  'Canada', 
  'Germany',
  'Ireland',
  'New Zealand',
  'UK',
  'USA',
  'Other'
);

CREATE TYPE public.upload_status_enum AS ENUM (
  'uploading',
  'uploaded', 
  'failed',
  'processing'
);

CREATE TYPE public.test_type_enum AS ENUM (
  'IELTS',
  'TOEFL',
  'PTE',
  'GRE',
  'GMAT',
  'SAT',
  'Other'
);

-- Phase 2: Create Partners table for multi-tenancy
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Phase 3: Create Lenders table
CREATE TABLE public.lenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 4: Create Students table (normalized)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~* '^[\+]?[1-9][\d]{3,14}$')
);

-- Phase 5: Create Co-applicants table (normalized)
CREATE TABLE public.co_applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  relationship public.relationship_enum NOT NULL,
  salary DECIMAL(15,2) NOT NULL,
  pin_code TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  occupation TEXT,
  employer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT positive_salary CHECK (salary > 0),
  CONSTRAINT valid_co_applicant_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Phase 6: Create Academic Tests table
CREATE TABLE public.academic_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  test_type public.test_type_enum NOT NULL,
  score TEXT NOT NULL,
  test_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 7: Refactor Leads table with proper relationships and constraints
CREATE TABLE public.leads_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  
  -- Foreign keys to normalized tables
  student_id UUID NOT NULL,
  co_applicant_id UUID NOT NULL,
  partner_id UUID,
  lender_id UUID NOT NULL,
  
  -- Loan details
  loan_amount DECIMAL(15,2) NOT NULL,
  loan_type public.loan_type_enum NOT NULL,
  
  -- Study details
  study_destination public.study_destination_enum NOT NULL,
  intake_month INTEGER,
  intake_year INTEGER,
  
  -- Status tracking
  status public.lead_status_enum NOT NULL DEFAULT 'new',
  documents_status public.document_status_enum NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_loan_amount CHECK (loan_amount > 0),
  CONSTRAINT valid_intake_month CHECK (intake_month BETWEEN 1 AND 12),
  CONSTRAINT valid_intake_year CHECK (intake_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
  CONSTRAINT future_intake CHECK (
    intake_year > EXTRACT(YEAR FROM CURRENT_DATE) OR
    (intake_year = EXTRACT(YEAR FROM CURRENT_DATE) AND intake_month >= EXTRACT(MONTH FROM CURRENT_DATE))
  )
);

-- Add foreign key constraints
ALTER TABLE public.academic_tests 
ADD CONSTRAINT fk_academic_tests_student 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_student 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;

ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_co_applicant 
FOREIGN KEY (co_applicant_id) REFERENCES public.co_applicants(id) ON DELETE RESTRICT;

ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_partner 
FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

ALTER TABLE public.leads_new 
ADD CONSTRAINT fk_leads_lender 
FOREIGN KEY (lender_id) REFERENCES public.lenders(id) ON DELETE RESTRICT;