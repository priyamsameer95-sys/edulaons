-- Create lead_status_history table for tracking status changes
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads_new(id) ON DELETE CASCADE,
  old_status lead_status_enum,
  new_status lead_status_enum NOT NULL,
  old_documents_status document_status_enum,
  new_documents_status document_status_enum,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add status timestamp columns to leads_new
ALTER TABLE public.leads_new 
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN documents_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on lead_status_history
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_status_history
CREATE POLICY "Partner users can view their lead status history" 
ON public.lead_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leads_new 
    WHERE id = lead_status_history.lead_id 
    AND (
      partner_id = get_user_partner(auth.uid()) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

CREATE POLICY "Users can insert lead status history" 
ON public.lead_status_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads_new 
    WHERE id = lead_status_history.lead_id 
    AND (
      partner_id = get_user_partner(auth.uid()) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- Create function to automatically update status timestamps
CREATE OR REPLACE FUNCTION public.update_lead_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  
  IF OLD.documents_status IS DISTINCT FROM NEW.documents_status THEN
    NEW.documents_status_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_new_status_timestamps
  BEFORE UPDATE ON public.leads_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_status_timestamps();

-- Create function to log status changes
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.documents_status IS DISTINCT FROM NEW.documents_status THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      old_status,
      new_status,
      old_documents_status,
      new_documents_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      OLD.documents_status,
      NEW.documents_status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging status changes
CREATE TRIGGER log_leads_new_status_changes
  AFTER UPDATE ON public.leads_new
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_status_change();

-- Update existing leads to have status_updated_at and documents_status_updated_at
UPDATE public.leads_new 
SET 
  status_updated_at = created_at,
  documents_status_updated_at = created_at
WHERE status_updated_at IS NULL OR documents_status_updated_at IS NULL;