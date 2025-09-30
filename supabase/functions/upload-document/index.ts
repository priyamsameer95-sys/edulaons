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
        JSON.stringify({ error: 'Missing required fields. Please make sure all information is provided.' }),
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
        JSON.stringify({ error: 'Invalid document type selected. Please refresh the page and try again.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file size based on document type requirements
    const maxSizeFromType = file.type === 'application/pdf' 
      ? documentType.max_file_size_pdf 
      : documentType.max_file_size_image;
    
    if (file.size > maxSizeFromType) {
      return new Response(
        JSON.stringify({ 
          error: `File is too large. Maximum size for ${file.type === 'application/pdf' ? 'PDF' : 'image'} files is ${(maxSizeFromType / (1024 * 1024)).toFixed(1)}MB. Try compressing your file first.` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !documentType.accepted_formats.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ 
          error: `File format not supported. Please upload: ${documentType.accepted_formats.join(', ').toUpperCase()} files only.` 
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
          error: `A file named "${file.name}" already exists. Please rename your file or choose a different one.` 
        }),
        { 
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate filename with new folder structure: /checklists/{leadId}/{documentTypeId}/{filename}
    const storedFilename = file.name;
    const filePath = `checklists/${leadId}/${documentTypeId}/${storedFilename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lead-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage. Please check your internet connection and try again.' }),
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

      // Parse PostgreSQL error codes for user-friendly messages
      let errorMessage = 'Failed to save document record. Please try again.';
      let statusCode = 500;

      if (dbError.code === '23503') {
        // Foreign key violation
        errorMessage = 'This lead no longer exists. Please refresh the page and try again.';
        statusCode = 404;
      } else if (dbError.code === '23505') {
        // Unique constraint violation
        errorMessage = 'A document with this name already exists for this lead. Please rename your file.';
        statusCode = 409;
      } else if (dbError.message?.includes('permission') || dbError.code === '42501') {
        errorMessage = 'You don\'t have permission to upload documents for this lead. Please contact support.';
        statusCode = 403;
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: dbError.code,
          details: dbError.message 
        }),
        { 
          status: statusCode,
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
    
    let errorMessage = 'Something went wrong while uploading your document. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Connection lost. Please check your internet and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload is taking too long. Please try with a smaller file or check your connection.';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
