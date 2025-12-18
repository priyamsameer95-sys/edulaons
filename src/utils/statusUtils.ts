import { Database } from '@/integrations/supabase/types';
import { STATUS_CONFIG, LeadStatusExtended, ProcessPhase, PHASE_CONFIG } from '@/constants/processFlow';

export type LeadStatus = Database['public']['Enums']['lead_status_enum'];
export type DocumentStatus = Database['public']['Enums']['document_status_enum'];

// Build status options from centralized config
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; phase: ProcessPhase }[] = 
  Object.entries(STATUS_CONFIG)
    .filter(([key, _]) => !['new', 'contacted', 'in_progress', 'document_review', 'approved'].includes(key)) // Exclude legacy
    .map(([_, config]) => ({
      value: config.value as LeadStatus,
      label: config.label,
      color: `${config.bgColor} ${config.color}`,
      phase: config.phase,
    }))
    .sort((a, b) => {
      const aConfig = STATUS_CONFIG[a.value as LeadStatusExtended];
      const bConfig = STATUS_CONFIG[b.value as LeadStatusExtended];
      return (aConfig?.step || 0) - (bConfig?.step || 0);
    });

// Legacy status options for backward compatibility
export const LEGACY_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
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
  const config = STATUS_CONFIG[status as LeadStatusExtended];
  if (config) {
    return `${config.bgColor} ${config.color}`;
  }
  return 'bg-gray-100 text-gray-800';
};

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_OPTIONS.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: LeadStatus): string => {
  const config = STATUS_CONFIG[status as LeadStatusExtended];
  return config?.label || status;
};

export const getStatusShortLabel = (status: LeadStatus): string => {
  const config = STATUS_CONFIG[status as LeadStatusExtended];
  return config?.shortLabel || status;
};

export const getStatusDescription = (status: LeadStatus): string => {
  const config = STATUS_CONFIG[status as LeadStatusExtended];
  return config?.description || '';
};

export const getStatusPhase = (status: LeadStatus): ProcessPhase => {
  const config = STATUS_CONFIG[status as LeadStatusExtended];
  return config?.phase || 'pre_login';
};

export const getPhaseLabel = (phase: ProcessPhase): string => {
  return PHASE_CONFIG[phase]?.label || phase;
};

export const getDocumentStatusLabel = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_OPTIONS.find(option => option.value === status)?.label || status;
};

// Group statuses by phase for admin dropdown
export const getGroupedStatusOptions = (): Record<ProcessPhase, { value: LeadStatus; label: string; color: string }[]> => {
  const grouped: Record<ProcessPhase, { value: LeadStatus; label: string; color: string }[]> = {
    pre_login: [],
    with_lender: [],
    sanction: [],
    disbursement: [],
    terminal: [],
  };
  
  LEAD_STATUS_OPTIONS.forEach(option => {
    grouped[option.phase].push({
      value: option.value,
      label: option.label,
      color: option.color,
    });
  });
  
  return grouped;
};

// Define valid status transitions for the new workflow
export const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  // New flow statuses
  lead_intake: ['first_contact', 'rejected', 'withdrawn'],
  first_contact: ['lenders_mapped', 'rejected', 'withdrawn'],
  lenders_mapped: ['checklist_shared', 'rejected', 'withdrawn'],
  checklist_shared: ['docs_uploading', 'rejected', 'withdrawn'],
  docs_uploading: ['docs_submitted', 'rejected', 'withdrawn'],
  docs_submitted: ['docs_verified', 'docs_uploading', 'rejected', 'withdrawn'],
  docs_verified: ['logged_with_lender', 'rejected', 'withdrawn'],
  logged_with_lender: ['counselling_done', 'rejected', 'withdrawn'],
  counselling_done: ['pd_scheduled', 'rejected', 'withdrawn'],
  pd_scheduled: ['pd_completed', 'rejected', 'withdrawn'],
  pd_completed: ['additional_docs_pending', 'property_verification', 'credit_assessment', 'rejected', 'withdrawn'],
  additional_docs_pending: ['pd_completed', 'credit_assessment', 'rejected', 'withdrawn'],
  property_verification: ['credit_assessment', 'rejected', 'withdrawn'],
  credit_assessment: ['sanctioned', 'rejected', 'withdrawn'],
  sanctioned: ['pf_pending', 'rejected', 'withdrawn'],
  pf_pending: ['pf_paid', 'rejected', 'withdrawn'],
  pf_paid: ['sanction_letter_issued', 'rejected', 'withdrawn'],
  sanction_letter_issued: ['docs_dispatched', 'rejected', 'withdrawn'],
  docs_dispatched: ['security_creation', 'ops_verification', 'rejected', 'withdrawn'],
  security_creation: ['ops_verification', 'rejected', 'withdrawn'],
  ops_verification: ['disbursed', 'rejected', 'withdrawn'],
  disbursed: [], // Terminal
  rejected: ['lead_intake', 'first_contact'], // Can restart
  withdrawn: ['lead_intake', 'first_contact'], // Can restart
  
  // Legacy statuses (map to new flow)
  new: ['first_contact', 'contacted', 'rejected', 'withdrawn'],
  contacted: ['lenders_mapped', 'in_progress', 'rejected', 'withdrawn'],
  in_progress: ['logged_with_lender', 'document_review', 'rejected', 'withdrawn'],
  document_review: ['docs_verified', 'approved', 'rejected', 'withdrawn'],
  approved: ['sanctioned', 'rejected', 'withdrawn'],
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

// Helper to check if status is a legacy status
export const isLegacyStatus = (status: LeadStatus): boolean => {
  return ['new', 'contacted', 'in_progress', 'document_review', 'approved'].includes(status);
};

// Map legacy status to new status for migration
export const mapLegacyToNewStatus = (status: LeadStatus): LeadStatus => {
  const mapping: Record<string, LeadStatus> = {
    new: 'lead_intake',
    contacted: 'first_contact',
    in_progress: 'logged_with_lender',
    document_review: 'docs_submitted',
    approved: 'sanctioned',
  };
  return mapping[status] || status;
};
