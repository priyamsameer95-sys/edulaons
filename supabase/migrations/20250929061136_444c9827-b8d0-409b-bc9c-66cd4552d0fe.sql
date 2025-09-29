-- Complete the database migration for remaining leads
SELECT public.migrate_existing_leads_safe();

-- Update document types to support more file formats
UPDATE public.document_types 
SET accepted_formats = ARRAY['pdf', 'jpg', 'jpeg', 'png', 'jfif', 'webp', 'bmp', 'tiff']
WHERE accepted_formats = ARRAY['pdf', 'jpg', 'jpeg', 'png'];

-- Also update max file sizes to be more reasonable (10MB for all formats)
UPDATE public.document_types 
SET 
  max_file_size_pdf = 10485760,  -- 10MB
  max_file_size_image = 10485760 -- 10MB
WHERE max_file_size_pdf = 20971520 OR max_file_size_image = 5242880;