-- Phase 1: Allow anonymous users to SELECT from universities
-- This is required for the public landing page to show university dropdown

CREATE POLICY "Universities viewable by anon"
ON public.universities
FOR SELECT
TO anon
USING (true);