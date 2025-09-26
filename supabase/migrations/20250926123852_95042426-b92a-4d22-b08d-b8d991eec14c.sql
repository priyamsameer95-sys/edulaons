-- Create document types configuration table
CREATE TABLE public.document_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'identity', 'academic', 'financial', 'supporting'
  required BOOLEAN DEFAULT false,
  max_file_size_pdf INTEGER DEFAULT 20971520, -- 20MB for PDFs
  max_file_size_image INTEGER DEFAULT 5242880, -- 5MB for images  
  accepted_formats TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lead documents table
CREATE TABLE public.lead_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'verified', 'rejected', 'expired')),
  uploaded_by TEXT DEFAULT 'student' CHECK (uploaded_by IN ('student', 'partner', 'admin')),
  verification_notes TEXT,
  version INTEGER DEFAULT 1,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on document tables
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for document_types (public read)
CREATE POLICY "Document types are viewable by everyone" 
ON public.document_types FOR SELECT USING (true);

-- Create policies for lead_documents
CREATE POLICY "Users can view all lead documents" 
ON public.lead_documents FOR SELECT USING (true);

CREATE POLICY "Users can insert lead documents" 
ON public.lead_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update lead documents" 
ON public.lead_documents FOR UPDATE USING (true);

-- Create storage bucket for lead documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead-documents', 'lead-documents', false);

-- RLS policies for secure document access
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'lead-documents');

CREATE POLICY "Users can view documents" ON storage.objects  
FOR SELECT USING (bucket_id = 'lead-documents');

CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'lead-documents');

-- Create trigger for updating updated_at timestamps
CREATE TRIGGER update_document_types_updated_at
BEFORE UPDATE ON public.document_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_documents_updated_at
BEFORE UPDATE ON public.lead_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed document types with proper file size limits
INSERT INTO public.document_types (name, category, required, max_file_size_pdf, max_file_size_image, description, display_order) VALUES
('Passport Copy', 'identity', true, 8388608, 3145728, 'Clear copy of passport pages', 1),
('Academic Transcripts', 'academic', true, 15728640, 5242880, 'Official academic transcripts', 2),
('Income Proof', 'financial', true, 15728640, 5242880, 'Salary slips or income certificate', 3), 
('Bank Statements', 'financial', true, 15728640, 5242880, '6 months bank statements', 4),
('Test Score Report', 'academic', false, 10485760, 4194304, 'IELTS/TOEFL/GRE/GMAT scores', 5),
('Collateral Documents', 'financial', false, 20971520, 6291456, 'Property or asset documents', 6),
('Student Photo', 'identity', true, 0, 2097152, 'Recent passport-size photograph', 7),
('Statement of Purpose', 'academic', false, 10485760, 4194304, 'Personal statement or SOP', 8);