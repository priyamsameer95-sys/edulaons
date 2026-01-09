-- Allow public/anonymous access to active lenders for landing page
CREATE POLICY "Allow public read access to active lenders"
ON public.lenders
FOR SELECT
TO anon
USING (is_active = true);