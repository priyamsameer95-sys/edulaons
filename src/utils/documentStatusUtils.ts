import type { LeadDocument } from '@/hooks/useLeadDocuments';

export type DocumentStatus = 'verified' | 'uploaded' | 'pending' | 'rejected' | 'not_uploaded';

export function getDocumentStatus(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): DocumentStatus {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return 'not_uploaded';
  
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') return 'rejected';
  if (doc.verification_status === 'uploaded') return 'uploaded';
  return 'pending';
}

// Partner-facing labels (read-only status display)
export const partnerDocumentStatusLabels: Record<DocumentStatus, string> = {
  verified: 'Verified',
  uploaded: 'In Review',
  pending: 'In Review',
  rejected: 'Re-upload Required',
  not_uploaded: 'Not Uploaded',
};

// Admin-facing labels
export const adminDocumentStatusLabels: Record<DocumentStatus, string> = {
  verified: 'Verified',
  uploaded: 'Needs Review',
  pending: 'Pending Review',
  rejected: 'Rejected',
  not_uploaded: 'Not Uploaded',
};

// Legacy export for backward compatibility
export const documentStatusLabels = adminDocumentStatusLabels;

export const documentStatusTooltips: Record<DocumentStatus, string> = {
  verified: '✓ Verified by admin',
  uploaded: '⏳ Uploaded - awaiting admin review',
  pending: '⏳ Pending verification',
  rejected: '⚠️ Re-upload required - see admin feedback',
  not_uploaded: 'Click to upload',
};

// Get rejection reason from document
export function getDocumentRejectionReason(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): string | null {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return null;
  
  // Return verification_notes if rejected
  if (doc.verification_status === 'rejected' || doc.ai_validation_status === 'rejected') {
    return doc.verification_notes || doc.ai_validation_notes || null;
  }
  return null;
}
