-- Drop the existing future_intake constraint that blocks status updates on old leads
ALTER TABLE public.leads_new DROP CONSTRAINT IF EXISTS future_intake;