/**
 * Document Status Utilities
 * 
 * KB Compliance:
 * - Partner is READ-ONLY for status. Partner can ONLY upload/re-upload documents.
 * - Partner cannot set or change status in any way.
 * - Only Admin/Super Admin can change status.
 * 
 * Status Flow:
 * - PENDING (not_uploaded): No document uploaded yet
 * - UPLOADED: Partner uploaded, awaiting admin review
 * - NEED_ATTENTION (rejected): Admin rejected, requires re-upload with reason
 * - VERIFIED: Admin approved
 */
import type { LeadDocument } from '@/hooks/useLeadDocuments';

// Canonical document statuses for display
export type DocumentStatus = 'verified' | 'uploaded' | 'pending' | 'rejected' | 'not_uploaded';

export function getDocumentStatus(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): DocumentStatus {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return 'not_uploaded';
  
  // Map database status to display status
  if (doc.verification_status === 'verified') return 'verified';
  if (doc.verification_status === 'rejected' || 
      doc.verification_status === 'resubmission_required' ||
      doc.ai_validation_status === 'rejected') return 'rejected';
  if (doc.verification_status === 'uploaded') return 'uploaded';
  if (doc.verification_status === 'pending') return 'pending';
  
  return 'pending';
}

// Partner-facing labels (read-only status display, no underscores, Title Case)
export const partnerDocumentStatusLabels: Record<DocumentStatus, string> = {
  verified: 'Verified',
  uploaded: 'Uploaded',
  pending: 'Uploaded',
  rejected: 'Need Attention',
  not_uploaded: 'Pending',
};

// Admin-facing labels (Title Case, no underscores)
export const adminDocumentStatusLabels: Record<DocumentStatus, string> = {
  verified: 'Verified',
  uploaded: 'Uploaded',
  pending: 'Pending Review',
  rejected: 'Need Attention',
  not_uploaded: 'Not Uploaded',
};

// Legacy export for backward compatibility
export const documentStatusLabels = adminDocumentStatusLabels;

// Partner tooltips (read-only, informational only)
export const partnerDocumentStatusTooltips: Record<DocumentStatus, string> = {
  verified: 'Document verified by admin',
  uploaded: 'Document uploaded, awaiting admin review',
  pending: 'Document uploaded, awaiting admin review',
  rejected: 'Admin requested re-upload. See feedback below.',
  not_uploaded: 'Click to upload this document',
};

// Admin tooltips
export const adminDocumentStatusTooltips: Record<DocumentStatus, string> = {
  verified: 'Document verified',
  uploaded: 'Awaiting your review',
  pending: 'Pending verification',
  rejected: 'Rejected - awaiting partner re-upload',
  not_uploaded: 'Not yet uploaded',
};

// Legacy export
export const documentStatusTooltips = adminDocumentStatusTooltips;

// Get rejection reason from document
export function getDocumentRejectionReason(
  documentTypeId: string,
  uploadedDocuments: LeadDocument[]
): string | null {
  const doc = uploadedDocuments.find(d => d.document_type_id === documentTypeId);
  if (!doc) return null;
  
  // Return verification_notes if rejected
  if (doc.verification_status === 'rejected' || 
      doc.verification_status === 'resubmission_required' ||
      doc.ai_validation_status === 'rejected') {
    return doc.verification_notes || doc.ai_validation_notes || null;
  }
  return null;
}

// Check if partner can upload/re-upload for this document
export function canPartnerUpload(status: DocumentStatus): boolean {
  // Partner can upload if: not_uploaded (Pending) or rejected (Need Attention)
  // Partner CANNOT upload if: verified or uploaded (in review)
  return status === 'not_uploaded' || status === 'rejected';
}

// Check if partner can re-upload (only for rejected docs)
export function canPartnerReupload(status: DocumentStatus): boolean {
  return status === 'rejected';
}
