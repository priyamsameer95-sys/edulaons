-- Fix security issue: Set search_path for validate_person_name function
CREATE OR REPLACE FUNCTION public.validate_person_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent names that look like URLs or paths
  IF NEW.name ~ '^/' OR NEW.name ~ 'login' OR LENGTH(TRIM(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Invalid name: % - Names cannot contain URLs, paths, or be too short', NEW.name;
  END IF;
  
  -- Trim whitespace
  NEW.name = TRIM(NEW.name);
  
  RETURN NEW;
END;
$$;