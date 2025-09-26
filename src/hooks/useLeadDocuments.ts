import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LeadDocument {
  id: string;
  lead_id: string;
  document_type_id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_status: string;
  uploaded_by: string;
  verification_notes?: string;
  version: number;
  uploaded_at: string;
  verified_at?: string;
  document_types?: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
}

export function useLeadDocuments(leadId?: string) {
  const [documents, setDocuments] = useState<LeadDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId) {
      fetchDocuments();
    }
  }, [leadId]);

  const fetchDocuments = async () => {
    if (!leadId) return;

    try {
      const { data, error } = await supabase
        .from('lead_documents')
        .select(`
          *,
          document_types (
            id,
            name,
            category,
            description
          )
        `)
        .eq('lead_id', leadId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setDocuments((data || []) as LeadDocument[]);
    } catch (error) {
      console.error('Error fetching lead documents:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch documents'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      // First get the document to get the file path
      const { data: document, error: fetchError } = await supabase
        .from('lead_documents')
        .select('file_path')
        .eq('id', documentId)
        .maybeSingle();

      if (fetchError || !document) throw fetchError || new Error('Document not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('lead-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('lead_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: 'Document deleted',
        description: 'Document has been successfully deleted.'
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete document'
      });
    }
  };

  const getDownloadUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate download link'
      });
      return null;
    }
  };

  return { 
    documents, 
    loading, 
    refetch: fetchDocuments, 
    deleteDocument,
    getDownloadUrl
  };
}