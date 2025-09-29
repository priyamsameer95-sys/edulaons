import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('lead_id') as string;
    const documentTypeId = formData.get('document_type_id') as string;

    if (!file || !leadId || !documentTypeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get document type info for validation
    const { data: documentType, error: docTypeError } = await supabase
      .from('document_types')
      .select('*')
      .eq('id', documentTypeId)
      .single();

    if (docTypeError || !documentType) {
      return new Response(
        JSON.stringify({ error: 'Invalid document type' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file size - use 10MB as per new requirements
    const isPdf = file.type === 'application/pdf';
    const maxSize = 10 * 1024 * 1024; // 10MB for all files as per requirements
    
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for duplicate filenames in the same checklist item
    const { data: existingFiles } = await supabase
      .from('lead_documents')
      .select('original_filename')
      .eq('lead_id', leadId)
      .eq('document_type_id', documentTypeId);
      
    const duplicateExists = existingFiles?.some(doc => 
      doc.original_filename === file.name
    );
    
    if (duplicateExists) {
      return new Response(
        JSON.stringify({ 
          error: `A file with the name "${file.name}" already exists for this document type` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate filename with new folder structure: /checklists/{leadId}/{documentTypeId}/{filename}
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const storedFilename = file.name;
    const filePath = `checklists/${leadId}/${documentTypeId}/${storedFilename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lead-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save to database
    const { data: documentRecord, error: dbError } = await supabase
      .from('lead_documents')
      .insert({
        lead_id: leadId,
        document_type_id: documentTypeId,
        original_filename: file.name,
        stored_filename: storedFilename,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('lead-documents')
        .remove([filePath]);

      return new Response(
        JSON.stringify({ error: 'Failed to save document record' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: documentRecord,
        message: 'Document uploaded successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Upload document error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});