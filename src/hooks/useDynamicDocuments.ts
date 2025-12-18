import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LoanClassification = 'unsecured' | 'secured_fd' | 'secured_property';

interface DocumentRequirement {
  id: string;
  document_type_id: string;
  is_required: boolean;
  stage: string;
  display_order: number;
  document_type: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
}

interface UseDynamicDocumentsReturn {
  requiredDocs: DocumentRequirement[];
  totalRequired: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDynamicDocuments(
  loanClassification: LoanClassification | null,
  stage: string = 'initial'
): UseDynamicDocumentsReturn {
  const [requiredDocs, setRequiredDocs] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    // Default to 'unsecured' if no classification set
    const classification = loanClassification || 'unsecured';
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('document_requirements')
        .select(`
          id,
          document_type_id,
          is_required,
          stage,
          display_order,
          document_types (
            id,
            name,
            category,
            description
          )
        `)
        .eq('loan_classification', classification)
        .eq('stage', stage)
        .eq('is_required', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Map the response to our interface
      const mappedDocs = (data || []).map((item: any) => ({
        id: item.id,
        document_type_id: item.document_type_id,
        is_required: item.is_required,
        stage: item.stage,
        display_order: item.display_order,
        document_type: item.document_types
      }));

      setRequiredDocs(mappedDocs);
    } catch (err) {
      console.error('Error fetching dynamic documents:', err);
      setError('Failed to fetch document requirements');
    } finally {
      setLoading(false);
    }
  }, [loanClassification, stage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    requiredDocs,
    totalRequired: requiredDocs.length,
    loading,
    error,
    refetch: fetchDocuments
  };
}
