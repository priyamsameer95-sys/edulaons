-- Track activity completions for gamification
CREATE TABLE IF NOT EXISTS public.activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  impact_amount NUMERIC,
  time_to_complete_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries (removed DATE index due to immutability constraint)
CREATE INDEX IF NOT EXISTS idx_activity_completions_user_completed
ON public.activity_completions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_completions_created
ON public.activity_completions(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

-- Admin users can view all completions
CREATE POLICY "Admins can view all activity completions"
ON public.activity_completions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  )
);

-- Users can insert their own completions
CREATE POLICY "Users can insert their own activity completions"
ON public.activity_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to calculate user streaks
CREATE OR REPLACE FUNCTION public.get_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.activity_completions
      WHERE user_id = user_uuid
        AND completed_at::DATE = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;