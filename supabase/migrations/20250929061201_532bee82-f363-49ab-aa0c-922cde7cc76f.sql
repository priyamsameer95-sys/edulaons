-- Fix function search path security issues
ALTER FUNCTION public.migrate_existing_leads() SET search_path = public;
ALTER FUNCTION public.migrate_existing_leads_safe() SET search_path = public;