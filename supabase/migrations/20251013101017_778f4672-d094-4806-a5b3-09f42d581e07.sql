-- Update RLS policies to restrict Student Profile access to super_admin only

-- Drop existing policies on eligibility_scores
DROP POLICY IF EXISTS "Admins can view all eligibility scores" ON public.eligibility_scores;
DROP POLICY IF EXISTS "Partners can view their lead scores" ON public.eligibility_scores;
DROP POLICY IF EXISTS "Students can view their scores" ON public.eligibility_scores;
DROP POLICY IF EXISTS "System can insert eligibility scores" ON public.eligibility_scores;
DROP POLICY IF EXISTS "System can update eligibility scores" ON public.eligibility_scores;

-- Create super_admin only policies for eligibility_scores
CREATE POLICY "Only super_admins can view eligibility scores" 
ON public.eligibility_scores 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super_admins can insert eligibility scores" 
ON public.eligibility_scores 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super_admins can update eligibility scores" 
ON public.eligibility_scores 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super_admins can delete eligibility scores" 
ON public.eligibility_scores 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Update lender_config policies to allow super_admin to manage
DROP POLICY IF EXISTS "Admins can manage lender config" ON public.lender_config;
DROP POLICY IF EXISTS "Authenticated users can view lender config" ON public.lender_config;

CREATE POLICY "Only super_admins can manage lender config" 
ON public.lender_config 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update course_eligibility policies
DROP POLICY IF EXISTS "Admins can insert course eligibility" ON public.course_eligibility;
DROP POLICY IF EXISTS "Admins can update course eligibility" ON public.course_eligibility;
DROP POLICY IF EXISTS "Authenticated users can view course eligibility" ON public.course_eligibility;

CREATE POLICY "Only super_admins can manage course eligibility" 
ON public.course_eligibility 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update pin_code_tiers policies
DROP POLICY IF EXISTS "Authenticated users can view pin codes" ON public.pin_code_tiers;

CREATE POLICY "Only super_admins can manage pin codes" 
ON public.pin_code_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));