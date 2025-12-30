import type { LeadDocument } from '@/hooks/useLeadDocuments';

export type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not_uploaded';

export function getDocumentStatus(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): DocumentStatus {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return 'not_uploaded';
  
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') return 'rejected';
  return 'pending';
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  rejected: 'Re-upload',
  not_uploaded: 'Not Uploaded',
};

export const documentStatusTooltips: Record<DocumentStatus, string> = {
  verified: '✓ Verified',
  pending: '⏳ Pending verification',
  rejected: '⚠️ Re-upload required',
  not_uploaded: 'Click to upload',
};
