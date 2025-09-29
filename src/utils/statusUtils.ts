import { Database } from '@/integrations/supabase/types';

export type LeadStatus = Database['public']['Enums']['lead_status_enum'];
export type DocumentStatus = Database['public']['Enums']['document_status_enum'];

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'document_review', label: 'Document Review', color: 'bg-orange-100 text-orange-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
];

export const DOCUMENT_STATUS_OPTIONS: { value: DocumentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'uploaded', label: 'Uploaded', color: 'bg-blue-100 text-blue-800' },
  { value: 'verified', label: 'Verified', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'resubmission_required', label: 'Resubmission Required', color: 'bg-orange-100 text-orange-800' },
];

export const getStatusColor = (status: LeadStatus): string => {
  return LEAD_STATUS_OPTIONS.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800';
};

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_OPTIONS.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: LeadStatus): string => {
  return LEAD_STATUS_OPTIONS.find(option => option.value === status)?.label || status;
};

export const getDocumentStatusLabel = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_OPTIONS.find(option => option.value === status)?.label || status;
};

// Define valid status transitions (more flexible for better workflow)
export const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'in_progress', 'document_review', 'rejected', 'withdrawn'],
  contacted: ['new', 'in_progress', 'document_review', 'rejected', 'withdrawn'],
  in_progress: ['new', 'contacted', 'document_review', 'approved', 'rejected', 'withdrawn'],
  document_review: ['new', 'contacted', 'in_progress', 'approved', 'rejected', 'withdrawn'],
  approved: ['document_review', 'withdrawn'],
  rejected: ['new', 'contacted', 'in_progress', 'document_review'],
  withdrawn: ['new', 'contacted', 'in_progress', 'document_review']
};

export const VALID_DOCUMENT_STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  pending: ['uploaded', 'verified', 'rejected', 'resubmission_required'],
  uploaded: ['pending', 'verified', 'rejected', 'resubmission_required'],
  verified: ['pending', 'uploaded', 'rejected', 'resubmission_required'],
  rejected: ['pending', 'uploaded', 'verified', 'resubmission_required'],
  resubmission_required: ['pending', 'uploaded', 'verified', 'rejected'],
};

export const canTransitionToStatus = (currentStatus: LeadStatus, newStatus: LeadStatus): boolean => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

export const canTransitionToDocumentStatus = (currentStatus: DocumentStatus, newStatus: DocumentStatus): boolean => {
  return VALID_DOCUMENT_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};