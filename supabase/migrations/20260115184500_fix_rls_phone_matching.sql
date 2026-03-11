-- Redefine the function to use robust 10-digit phone matching
CREATE OR REPLACE FUNCTION public.check_is_lead_owner(lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email TEXT;
  current_phone TEXT;
  is_owner BOOLEAN;
BEGIN
  -- Get user details from JWT
  current_email := auth.jwt() ->> 'email';
  -- clean the JWT phone number
  current_phone := regexp_replace((auth.jwt() -> 'user_metadata' ->> 'phone')::text, '\D', '', 'g');

  -- Check ownership
  SELECT EXISTS (
    SELECT 1 
    FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE l.id = lead_id
    AND (
      -- Email match (case insensitive just in case)
      (current_email IS NOT NULL AND LOWER(s.email) = LOWER(current_email))
      OR 
      -- Phone match: Compare last 10 digits
      (
        current_phone IS NOT NULL AND 
        RIGHT(regexp_replace(s.phone, '\D', '', 'g'), 10) = RIGHT(current_phone, 10)
      )
    )
  ) INTO is_owner;

  RETURN is_owner;
END;
$$;

-- Ensure the policy exists (drop and create to be safe)
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.lead_documents;

CREATE POLICY "Students can upload their own documents"
ON public.lead_documents
FOR INSERT
TO authenticated
WITH CHECK (
  check_is_lead_owner(lead_id)
);
