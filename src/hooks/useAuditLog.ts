/**
 * Audit Log Hook
 * 
 * Per Knowledge Base:
 * - All edits must be attributable: changed_by_user_id, changed_by_role, timestamp
 * - Logs required for: lead status changes, document status changes,
 *   mapping changes, lender assignment changes (AI/manual)
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditLogEntry {
  leadId: string;
  tableName: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeReason?: string;
  changeSource?: 'user_edit' | 'ai_suggestion' | 'system' | 'api';
}

export interface DocumentAuditEntry {
  documentId: string;
  leadId: string;
  action: 'upload' | 'verify' | 'reject' | 'resubmit' | 'bucket_change';
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  aiSuggested?: boolean;
}

export interface LenderAuditEntry {
  leadId: string;
  oldLenderId: string | null;
  newLenderId: string;
  assignmentMode: 'ai' | 'manual' | 'ai_override';
  aiConfidence?: number;
  reason?: string;
}

// Map role to allowed audit log types (super_admin -> admin)
const mapRoleToAuditType = (role: string | undefined): string => {
  if (!role) return 'system';
  if (role === 'super_admin') return 'admin';
  if (['student', 'partner', 'admin', 'system'].includes(role)) return role;
  return 'system';
};

export function useAuditLog() {
  const { user, appUser } = useAuth();
  const changedByType = mapRoleToAuditType(appUser?.role);

  /**
   * Log a field change to field_audit_log
   */
  const logFieldChange = useCallback(async (entry: AuditLogEntry): Promise<void> => {
    try {
      const { error } = await supabase
        .from('field_audit_log')
        .insert({
          lead_id: entry.leadId,
          table_name: entry.tableName,
          field_name: entry.fieldName,
          old_value: entry.oldValue,
          new_value: entry.newValue,
          changed_by_id: user?.id || null,
          changed_by_name: user?.email || 'System',
          changed_by_type: changedByType,
          change_source: entry.changeSource || 'user_edit',
          change_reason: entry.changeReason || null,
        });

      if (error) {
        console.error('Failed to log field change:', error);
      }
    } catch (err) {
      console.error('Error in logFieldChange:', err);
    }
  }, [user, appUser, changedByType]);

  /**
   * Log multiple field changes at once (batch)
   */
  const logFieldChanges = useCallback(async (entries: AuditLogEntry[]): Promise<void> => {
    if (entries.length === 0) return;

    try {
      const records = entries.map(entry => ({
        lead_id: entry.leadId,
        table_name: entry.tableName,
        field_name: entry.fieldName,
        old_value: entry.oldValue,
        new_value: entry.newValue,
        changed_by_id: user?.id || null,
        changed_by_name: user?.email || 'System',
        changed_by_type: changedByType,
        change_source: entry.changeSource || 'user_edit',
        change_reason: entry.changeReason || null,
      }));

      const { error } = await supabase
        .from('field_audit_log')
        .insert(records);

      if (error) {
        console.error('Failed to log field changes:', error);
      }
    } catch (err) {
      console.error('Error in logFieldChanges:', err);
    }
  }, [user, appUser, changedByType]);

  /**
   * Log document status change
   */
  const logDocumentChange = useCallback(async (entry: DocumentAuditEntry): Promise<void> => {
    try {
      await logFieldChange({
        leadId: entry.leadId,
        tableName: 'lead_documents',
        fieldName: `document_${entry.action}`,
        oldValue: entry.oldStatus || null,
        newValue: entry.newStatus || entry.action,
        changeReason: entry.reason,
        changeSource: entry.aiSuggested ? 'ai_suggestion' : 'user_edit',
      });
    } catch (err) {
      console.error('Error in logDocumentChange:', err);
    }
  }, [logFieldChange]);

  /**
   * Log lender assignment change
   */
  const logLenderAssignment = useCallback(async (entry: LenderAuditEntry): Promise<void> => {
    try {
      // Log to field_audit_log
      await logFieldChange({
        leadId: entry.leadId,
        tableName: 'leads_new',
        fieldName: 'lender_id',
        oldValue: entry.oldLenderId,
        newValue: entry.newLenderId,
        changeReason: `${entry.assignmentMode}: ${entry.reason || 'No reason provided'}`,
        changeSource: entry.assignmentMode === 'manual' ? 'user_edit' : 'ai_suggestion',
      });

      // Also update AI recommendation record if applicable
      if (entry.assignmentMode !== 'manual') {
        const { error } = await supabase
          .from('ai_lender_recommendations')
          .update({
            accepted_lender_id: entry.newLenderId,
            assignment_mode: entry.assignmentMode,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('lead_id', entry.leadId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Failed to update AI recommendation:', error);
        }
      }
    } catch (err) {
      console.error('Error in logLenderAssignment:', err);
    }
  }, [logFieldChange, user]);

  /**
   * Log lead status change
   */
  const logStatusChange = useCallback(async (
    leadId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string
  ): Promise<void> => {
    await logFieldChange({
      leadId,
      tableName: 'leads_new',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      changeReason: reason,
      changeSource: 'user_edit',
    });
  }, [logFieldChange]);

  /**
   * Log student-partner mapping change
   */
  const logMappingChange = useCallback(async (
    studentId: string,
    partnerId: string | null,
    newPartnerId: string,
    leadId: string,
    reason?: string
  ): Promise<void> => {
    await logFieldChange({
      leadId,
      tableName: 'student_partner_mappings',
      fieldName: 'partner_id',
      oldValue: partnerId,
      newValue: newPartnerId,
      changeReason: reason,
      changeSource: 'user_edit',
    });
  }, [logFieldChange]);

  return {
    logFieldChange,
    logFieldChanges,
    logDocumentChange,
    logLenderAssignment,
    logStatusChange,
    logMappingChange,
  };
}
