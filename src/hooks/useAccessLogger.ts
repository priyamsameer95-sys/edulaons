import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AccessAction = 
  | 'view_lead' 
  | 'view_document' 
  | 'download_document' 
  | 'preview_document'
  | 'update_status'
  | 'verify_document';

interface LogParams {
  action: AccessAction;
  tableName: string;
  leadId?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Silent background access logger hook.
 * Fire-and-forget - doesn't block UI or wait for response.
 * Used for tracking document access, lead views, etc.
 */
export function useAccessLogger() {
  const { appUser } = useAuth();

  const log = useCallback(async (params: LogParams) => {
    // Fire and forget - don't await or block
    if (!appUser?.email || !appUser?.role) return;

    try {
      // Non-blocking insert - use void to fire and forget
      void (async () => {
        try {
          await supabase
            .from('data_access_logs')
            .insert({
              user_id: appUser.id,
              user_email: appUser.email,
              user_role: appUser.role,
              action: params.action,
              table_name: params.tableName,
              partner_id: appUser.partner_id || null,
              record_count: 1,
            });
        } catch (err) {
          // Silently log errors - don't disrupt user experience
          console.debug('Access log failed:', err);
        }
      })();
    } catch (err) {
      // Silently handle any errors
      console.debug('Access log error:', err);
    }
  }, [appUser]);

  // Convenience methods for specific actions
  const logLeadView = useCallback((leadId: string) => {
    log({ action: 'view_lead', tableName: 'leads_new', leadId });
  }, [log]);

  const logDocumentView = useCallback((leadId: string, documentId: string) => {
    log({ action: 'view_document', tableName: 'lead_documents', leadId, documentId });
  }, [log]);

  const logDocumentDownload = useCallback((leadId: string, documentId: string) => {
    log({ action: 'download_document', tableName: 'lead_documents', leadId, documentId });
  }, [log]);

  const logDocumentPreview = useCallback((leadId: string, documentId: string) => {
    log({ action: 'preview_document', tableName: 'lead_documents', leadId, documentId });
  }, [log]);

  return {
    log,
    logLeadView,
    logDocumentView,
    logDocumentDownload,
    logDocumentPreview,
  };
}
