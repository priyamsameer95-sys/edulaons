-- Check what values exist in app_role enum
-- Add student and kam roles if they don't exist
DO $$ 
BEGIN
    -- Add student role if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'student' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'student';
    END IF;
    
    -- Add kam role if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'kam' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'kam';
    END IF;
END $$;