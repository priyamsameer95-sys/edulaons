-- Function to check if the current user owns the lead (Security Definer to bypass RLS on leads/students)
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
  current_phone := regexp_replace((auth.jwt() -> 'user_metadata' ->> 'phone')::text, '\D', '', 'g');

  -- Check ownership
  SELECT EXISTS (
    SELECT 1 
    FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE l.id = lead_id
    AND (
      (current_email IS NOT NULL AND s.email = current_email)
      OR 
      (current_phone IS NOT NULL AND s.phone = current_phone)
    )
  ) INTO is_owner;

  RETURN is_owner;
END;
$$;

-- Allow students to insert documents for their own leads using the secure function
CREATE POLICY "Students can upload their own documents"
ON public.lead_documents
FOR INSERT
TO authenticated
WITH CHECK (
  check_is_lead_owner(lead_id)
);
