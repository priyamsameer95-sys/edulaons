-- Create storage bucket for lender logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lender-logos',
  'lender-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Storage policies for lender logos bucket
CREATE POLICY "Lender logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lender-logos');

CREATE POLICY "Super admins can upload lender logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lender-logos' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can update lender logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'lender-logos' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete lender logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'lender-logos' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);