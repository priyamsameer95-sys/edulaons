-- Create application activities table for tracking all interactions
CREATE TABLE IF NOT EXISTS public.application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'document_upload', 'document_verification', 'comment', 'lender_assignment', 'note')),
  actor_id UUID REFERENCES auth.users(id),
  actor_role app_role,
  actor_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_application_activities_lead_id ON public.application_activities(lead_id);
CREATE INDEX idx_application_activities_created_at ON public.application_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.application_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_activities
CREATE POLICY "Students can view activities for their applications"
ON public.application_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE l.id = application_activities.lead_id
    AND s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Partners can view activities for their leads"
ON public.application_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = application_activities.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

CREATE POLICY "Admins can view all activities"
ON public.application_activities
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert activities"
ON public.application_activities
FOR INSERT
WITH CHECK (true);

-- Create application comments table
CREATE TABLE IF NOT EXISTS public.application_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_role app_role,
  user_name TEXT,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_application_comments_lead_id ON public.application_comments(lead_id);
CREATE INDEX idx_application_comments_created_at ON public.application_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.application_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_comments
CREATE POLICY "Students can view public comments on their applications"
ON public.application_comments
FOR SELECT
USING (
  is_internal = false AND
  EXISTS (
    SELECT 1 FROM public.leads_new l
    JOIN public.students s ON l.student_id = s.id
    WHERE l.id = application_comments.lead_id
    AND s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Partners can view all comments for their leads"
ON public.application_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new
    WHERE leads_new.id = application_comments.lead_id
    AND leads_new.partner_id = get_user_partner(auth.uid())
  )
);

CREATE POLICY "Admins can view all comments"
ON public.application_comments
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can insert comments"
ON public.application_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.application_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads_new(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add trigger for updating updated_at on comments
CREATE TRIGGER update_application_comments_updated_at
BEFORE UPDATE ON public.application_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;