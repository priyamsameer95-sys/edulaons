// Lead Status Constants - Centralized for consistency across admin module

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  contacted: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  in_progress: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  document_review: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  approved: 'bg-green-500/15 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
  withdrawn: 'bg-muted text-muted-foreground border-border',
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  document_review: 'Doc Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  new: 'New lead awaiting initial contact',
  contacted: 'Lead has been contacted, awaiting response',
  in_progress: 'Application is being processed',
  document_review: 'Documents submitted and under review',
  approved: 'Loan application has been approved',
  rejected: 'Application was rejected',
  withdrawn: 'Lead has withdrawn their application',
};

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
