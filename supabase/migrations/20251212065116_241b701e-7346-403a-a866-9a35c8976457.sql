-- Add AI validation columns to lead_documents table
ALTER TABLE public.lead_documents
ADD COLUMN IF NOT EXISTS ai_validation_status text DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'validated', 'rejected', 'manual_review', 'skipped')),
ADD COLUMN IF NOT EXISTS ai_detected_type text,
ADD COLUMN IF NOT EXISTS ai_confidence_score numeric,
ADD COLUMN IF NOT EXISTS ai_quality_assessment text,
ADD COLUMN IF NOT EXISTS ai_validation_notes text,
ADD COLUMN IF NOT EXISTS ai_validated_at timestamp with time zone;

-- Create index for faster queries on validation status
CREATE INDEX IF NOT EXISTS idx_lead_documents_ai_validation_status ON public.lead_documents(ai_validation_status);

-- Comment for clarity
COMMENT ON COLUMN public.lead_documents.ai_validation_status IS 'AI validation status: pending, validated, rejected, manual_review, skipped';
COMMENT ON COLUMN public.lead_documents.ai_detected_type IS 'Document type detected by AI';
COMMENT ON COLUMN public.lead_documents.ai_confidence_score IS 'AI confidence score 0-100';
COMMENT ON COLUMN public.lead_documents.ai_quality_assessment IS 'Quality assessment: good, acceptable, poor, unreadable';
COMMENT ON COLUMN public.lead_documents.ai_validation_notes IS 'Detailed AI validation feedback';