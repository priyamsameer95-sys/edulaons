import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentStatus {
  documentTypeId: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'verified' | 'rejected';
  progress: number;
  lastUpdated: Date;
  error?: string;
}

export const useDocumentUploadStatus = (leadId: string) => {
  const [statusMap, setStatusMap] = useState<Map<string, DocumentStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize status for all document types
  const initializeStatuses = useCallback(async () => {
    if (!leadId) return;

    setIsLoading(true);
    try {
      // Get all document types and existing documents
      const [{ data: docTypes }, { data: documents }] = await Promise.all([
        supabase.from('document_types').select('*'),
        supabase
          .from('lead_documents')
          .select('*')
          .eq('lead_id', leadId)
      ]);

      const newStatusMap = new Map<string, DocumentStatus>();

      // Initialize all document types
      docTypes?.forEach(docType => {
        const existingDoc = documents?.find(doc => doc.document_type_id === docType.id);
        
        newStatusMap.set(docType.id, {
          documentTypeId: docType.id,
          status: existingDoc ? 'uploaded' : 'pending',
          progress: existingDoc ? 100 : 0,
          lastUpdated: existingDoc ? new Date(existingDoc.uploaded_at) : new Date(),
        });
      });

      setStatusMap(newStatusMap);
    } catch (error) {
      console.error('Failed to initialize document statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  // Update status for a specific document type
  const updateStatus = useCallback((
    documentTypeId: string, 
    updates: Partial<DocumentStatus>
  ) => {
    setStatusMap(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(documentTypeId);
      
      if (current) {
        newMap.set(documentTypeId, {
          ...current,
          ...updates,
          lastUpdated: new Date()
        });
      }
      
      return newMap;
    });
  }, []);

  // Real-time subscription to document changes
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel('document-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_documents',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          const { eventType, new: newDoc, old: oldDoc } = payload;
          
          if (eventType === 'INSERT' && newDoc) {
            updateStatus(newDoc.document_type_id, {
              status: 'uploaded',
              progress: 100
            });
          } else if (eventType === 'UPDATE' && newDoc) {
            let status: DocumentStatus['status'] = 'uploaded';
            
            if (newDoc.verified_at) {
              status = 'verified';
            } else if (newDoc.upload_status === 'rejected') {
              status = 'rejected';
            }
            
            updateStatus(newDoc.document_type_id, {
              status,
              progress: 100
            });
          } else if (eventType === 'DELETE' && oldDoc) {
            updateStatus(oldDoc.document_type_id, {
              status: 'pending',
              progress: 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, updateStatus]);

  // Initialize on mount
  useEffect(() => {
    initializeStatuses();
  }, [initializeStatuses]);

  const getStatus = useCallback((documentTypeId: string): DocumentStatus | null => {
    return statusMap.get(documentTypeId) || null;
  }, [statusMap]);

  const getAllStatuses = useCallback((): DocumentStatus[] => {
    return Array.from(statusMap.values());
  }, [statusMap]);

  const getCompletionPercentage = useCallback((): number => {
    const statuses = getAllStatuses();
    if (statuses.length === 0) return 0;
    
    const completed = statuses.filter(status => 
      status.status === 'uploaded' || status.status === 'verified'
    ).length;
    
    return Math.round((completed / statuses.length) * 100);
  }, [getAllStatuses]);

  return {
    getStatus,
    getAllStatuses,
    updateStatus,
    getCompletionPercentage,
    isLoading,
    refresh: initializeStatuses
  };
};