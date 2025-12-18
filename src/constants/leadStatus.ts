// Lead Status Constants - Aligned with 18-step process flow
// Re-exports from centralized processFlow for backward compatibility

import { STATUS_CONFIG, PHASE_CONFIG, LeadStatusExtended, ProcessPhase } from './processFlow';

// Generate STATUS_COLORS from centralized config
export const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, config]) => [
    key,
    `${config.bgColor.replace('bg-', 'bg-').replace('-100', '-500/15')} ${config.color} border-${config.bgColor.replace('bg-', '').replace('-100', '-500')}/30`
  ])
);

// Generate STATUS_LABELS from centralized config
export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, config]) => [key, config.label])
);

// Generate STATUS_DESCRIPTIONS from centralized config
export const STATUS_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, config]) => [key, config.description])
);

// Document status constants (unchanged)
export const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  uploaded: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  verified: 'bg-green-500/15 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
  resubmission_required: 'bg-red-500/15 text-red-700 border-red-500/30',
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  uploaded: 'Uploaded',
  verified: 'Verified',
  rejected: 'Rejected',
  resubmission_required: 'Resubmit',
};

export const DOC_STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'Documents not yet uploaded',
  uploaded: 'Documents uploaded, awaiting verification',
  verified: 'All documents verified successfully',
  rejected: 'One or more documents were rejected',
  resubmission_required: 'Documents need to be re-uploaded',
};

// Phase-based groupings for UI
export const PHASE_LABELS: Record<ProcessPhase, string> = {
  pre_login: 'Pre-Login',
  with_lender: 'With Lender',
  sanction: 'Sanction',
  disbursement: 'Disbursement',
  terminal: 'Closed',
};

// Get all statuses in a specific phase
export function getStatusesInPhase(phase: ProcessPhase): string[] {
  return Object.entries(STATUS_CONFIG)
    .filter(([_, config]) => config.phase === phase)
    .sort((a, b) => a[1].step - b[1].step)
    .map(([key]) => key);
}

// Get phase for a status
export function getPhaseForStatus(status: string): ProcessPhase {
  return STATUS_CONFIG[status as LeadStatusExtended]?.phase || 'pre_login';
}
