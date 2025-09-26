import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required: boolean;
  max_file_size_pdf: number;
  max_file_size_image: number;
  accepted_formats: string[];
  description: string;
  display_order: number;
}

export function useDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch document types'
      });
    } finally {
      setLoading(false);
    }
  };

  return { documentTypes, loading, refetch: fetchDocumentTypes };
}