-- Allow authenticated users to insert their own access logs
CREATE POLICY "Users can insert own access logs"
ON public.data_access_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());