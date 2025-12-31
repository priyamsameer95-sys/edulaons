import { 
  UserPlus, Phone, Building2, FileText, Upload, FileCheck, 
  CheckCircle, Building, HeadphonesIcon, Calendar, PhoneCall,
  FileQuestion, Home, CreditCard, Award, Receipt, FileSignature,
  Send, Lock, Settings, Banknote, XCircle, UserX
} from 'lucide-react';

// ============================================================
// UNIFIED STATUS SYSTEM - 18 Step Loan Process Flow
// ============================================================

export type ProcessPhase = 'pre_login' | 'with_lender' | 'sanction' | 'disbursement' | 'terminal';

export type LeadStatusExtended = 
  // Legacy statuses (mapped to new ones)
  | 'new' | 'contacted' | 'in_progress' | 'document_review' | 'approved' | 'rejected' | 'withdrawn'
  // New granular statuses
  | 'lead_intake' | 'first_contact' | 'lenders_mapped' | 'checklist_shared'
  | 'docs_uploading' | 'docs_submitted' | 'docs_verified' | 'logged_with_lender'
  | 'counselling_done' | 'pd_scheduled' | 'pd_completed' | 'additional_docs_pending'
  | 'property_verification' | 'credit_assessment' | 'sanctioned'
  | 'pf_pending' | 'pf_paid' | 'sanction_letter_issued'
  | 'docs_dispatched' | 'security_creation' | 'ops_verification' | 'disbursed';

export interface StatusConfig {
  value: LeadStatusExtended;
  label: string;
  shortLabel: string;
  description: string;
  phase: ProcessPhase;
  step: number;
  icon: typeof UserPlus;
  color: string;
  bgColor: string;
  expectedTATHours: number;
  ownerRole: 'rm' | 'student' | 'lender' | 'ops';
  studentAction?: string;
  partnerAction?: string;
  adminAction?: string;
}

// ============================================================
// COMPLETE STATUS DEFINITIONS - 18 Steps + Terminal States
// ============================================================

export const STATUS_CONFIG: Record<LeadStatusExtended, StatusConfig> = {
  // === PRE-LOGIN PHASE (Steps 1-7) ===
  lead_intake: {
    value: 'lead_intake',
    label: 'Lead Intake',
    shortLabel: 'Intake',
    description: 'Lead received from partner, initial data captured',
    phase: 'pre_login',
    step: 1,
    icon: UserPlus,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    expectedTATHours: 0.5,
    ownerRole: 'rm',
    partnerAction: 'Ensure complete student details are provided',
    adminAction: 'Assign to RM for first contact',
  },
  first_contact: {
    value: 'first_contact',
    label: 'First Contact',
    shortLabel: 'Contacted',
    description: 'Student contacted, requirements discussed',
    phase: 'pre_login',
    step: 2,
    icon: Phone,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    expectedTATHours: 0.5,
    ownerRole: 'rm',
    studentAction: 'Respond to RM call/email with your details',
    adminAction: 'Complete requirement assessment',
  },
  lenders_mapped: {
    value: 'lenders_mapped',
    label: 'Lenders Mapped',
    shortLabel: 'Mapped',
    description: '2+ suitable lenders identified and shared with student',
    phase: 'pre_login',
    step: 3,
    icon: Building2,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    expectedTATHours: 0.75,
    ownerRole: 'rm',
    studentAction: 'Review lender options and select preferred lender',
    adminAction: 'Confirm lender mapping is accurate',
  },
  checklist_shared: {
    value: 'checklist_shared',
    label: 'Checklist Shared',
    shortLabel: 'Checklist',
    description: 'Document checklist sent to student',
    phase: 'pre_login',
    step: 4,
    icon: FileText,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    expectedTATHours: 0.75,
    ownerRole: 'rm',
    studentAction: 'Review checklist and start gathering documents',
    partnerAction: 'Follow up with student on document collection',
  },
  docs_uploading: {
    value: 'docs_uploading',
    label: 'Uploading Documents',
    shortLabel: 'Uploading',
    description: 'Student is uploading required documents',
    phase: 'pre_login',
    step: 5,
    icon: Upload,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    expectedTATHours: 48,
    ownerRole: 'student',
    studentAction: 'Upload all required documents',
    partnerAction: 'Assist student with document collection',
    adminAction: 'Follow up every 12 hours',
  },
  docs_submitted: {
    value: 'docs_submitted',
    label: 'Documents Submitted',
    shortLabel: 'Submitted',
    description: 'All documents uploaded, awaiting verification',
    phase: 'pre_login',
    step: 6,
    icon: FileCheck,
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    expectedTATHours: 3,
    ownerRole: 'rm',
    adminAction: 'Verify documents within 3 hours',
  },
  docs_verified: {
    value: 'docs_verified',
    label: 'Documents Verified',
    shortLabel: 'Verified',
    description: 'Documents verified, ready for lender login',
    phase: 'pre_login',
    step: 7,
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 4,
    ownerRole: 'rm',
    adminAction: 'Log case with lender same day',
  },

  // === WITH LENDER PHASE (Steps 8-14) ===
  logged_with_lender: {
    value: 'logged_with_lender',
    label: 'Logged with Lender',
    shortLabel: 'Logged',
    description: 'Case logged with lender, LAN generated',
    phase: 'with_lender',
    step: 8,
    icon: Building,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    expectedTATHours: 0.5,
    ownerRole: 'rm',
    studentAction: 'Await counselling call from RM',
    adminAction: 'Schedule student counselling',
  },
  counselling_done: {
    value: 'counselling_done',
    label: 'Counselling Completed',
    shortLabel: 'Counselled',
    description: 'Student and co-applicant prepared for lender call',
    phase: 'with_lender',
    step: 9,
    icon: HeadphonesIcon,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    expectedTATHours: 0.5,
    ownerRole: 'rm',
    studentAction: 'Be ready for lender PD call',
  },
  pd_scheduled: {
    value: 'pd_scheduled',
    label: 'PD Scheduled',
    shortLabel: 'PD Scheduled',
    description: 'Personal Discussion call scheduled with lender',
    phase: 'with_lender',
    step: 10,
    icon: Calendar,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    expectedTATHours: 48,
    ownerRole: 'lender',
    studentAction: 'Attend PD call at scheduled time',
  },
  pd_completed: {
    value: 'pd_completed',
    label: 'PD Completed',
    shortLabel: 'PD Done',
    description: 'Personal Discussion call completed successfully',
    phase: 'with_lender',
    step: 11,
    icon: PhoneCall,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 48,
    ownerRole: 'lender',
    adminAction: 'Monitor for additional document requests',
  },
  additional_docs_pending: {
    value: 'additional_docs_pending',
    label: 'Additional Docs Pending',
    shortLabel: 'Add. Docs',
    description: 'Lender requested additional documents',
    phase: 'with_lender',
    step: 12,
    icon: FileQuestion,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    expectedTATHours: 48,
    ownerRole: 'student',
    studentAction: 'Upload additional documents requested',
    adminAction: 'Coordinate document collection',
  },
  property_verification: {
    value: 'property_verification',
    label: 'Property Verification',
    shortLabel: 'Prop. Verify',
    description: 'Property verification in progress (secured loans)',
    phase: 'with_lender',
    step: 13,
    icon: Home,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    expectedTATHours: 336, // 14 days
    ownerRole: 'lender',
    studentAction: 'Ensure property access for evaluator visit',
  },
  credit_assessment: {
    value: 'credit_assessment',
    label: 'Credit Assessment',
    shortLabel: 'Credit Check',
    description: 'Lender credit team evaluating application',
    phase: 'with_lender',
    step: 14,
    icon: CreditCard,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    expectedTATHours: 96, // 4 days
    ownerRole: 'lender',
    studentAction: 'Await credit decision',
  },

  // === SANCTION PHASE (Steps 15-18) ===
  sanctioned: {
    value: 'sanctioned',
    label: 'Sanctioned',
    shortLabel: 'Sanctioned',
    description: 'Loan approved! Sanction amount confirmed',
    phase: 'sanction',
    step: 15,
    icon: Award,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 48,
    ownerRole: 'lender',
    studentAction: 'Pay processing fee to proceed',
    adminAction: 'Communicate sanction details to student',
  },
  pf_pending: {
    value: 'pf_pending',
    label: 'PF Pending',
    shortLabel: 'PF Pending',
    description: 'Awaiting processing fee payment',
    phase: 'sanction',
    step: 16,
    icon: Receipt,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    expectedTATHours: 168, // 7 days
    ownerRole: 'student',
    studentAction: 'Pay processing fee online or at branch',
  },
  pf_paid: {
    value: 'pf_paid',
    label: 'PF Paid',
    shortLabel: 'PF Paid',
    description: 'Processing fee received',
    phase: 'sanction',
    step: 17,
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 24,
    ownerRole: 'lender',
    adminAction: 'Request sanction letter release',
  },
  sanction_letter_issued: {
    value: 'sanction_letter_issued',
    label: 'Sanction Letter Issued',
    shortLabel: 'Letter Issued',
    description: 'Sanction letter released to student',
    phase: 'sanction',
    step: 18,
    icon: FileSignature,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    expectedTATHours: 24,
    ownerRole: 'lender',
    studentAction: 'Use sanction letter for visa process',
  },

  // === DISBURSEMENT PHASE (Steps 19-22) ===
  docs_dispatched: {
    value: 'docs_dispatched',
    label: 'Docs Dispatched',
    shortLabel: 'Dispatched',
    description: 'Signed documents dispatched to lender',
    phase: 'disbursement',
    step: 19,
    icon: Send,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    expectedTATHours: 72,
    ownerRole: 'student',
    studentAction: 'Sign and courier all documents',
  },
  security_creation: {
    value: 'security_creation',
    label: 'Security Creation',
    shortLabel: 'Security',
    description: 'Security/lien creation in progress',
    phase: 'disbursement',
    step: 20,
    icon: Lock,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    expectedTATHours: 168, // 7 days
    ownerRole: 'lender',
    studentAction: 'Submit original property documents if applicable',
  },
  ops_verification: {
    value: 'ops_verification',
    label: 'Ops Verification',
    shortLabel: 'Ops Check',
    description: 'Final operations verification',
    phase: 'disbursement',
    step: 21,
    icon: Settings,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    expectedTATHours: 48,
    ownerRole: 'ops',
    adminAction: 'Monitor ops verification status',
  },
  disbursed: {
    value: 'disbursed',
    label: 'Disbursed',
    shortLabel: 'Disbursed',
    description: 'Loan amount disbursed successfully!',
    phase: 'disbursement',
    step: 22,
    icon: Banknote,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 0,
    ownerRole: 'lender',
  },

  // === TERMINAL STATES ===
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    shortLabel: 'Rejected',
    description: 'Application was rejected',
    phase: 'terminal',
    step: -1,
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    expectedTATHours: 0,
    ownerRole: 'lender',
  },
  withdrawn: {
    value: 'withdrawn',
    label: 'Withdrawn',
    shortLabel: 'Withdrawn',
    description: 'Application withdrawn by student',
    phase: 'terminal',
    step: -2,
    icon: UserX,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    expectedTATHours: 0,
    ownerRole: 'student',
  },

  // === LEGACY STATUS MAPPINGS (for backward compatibility) ===
  new: {
    value: 'new',
    label: 'New',
    shortLabel: 'New',
    description: 'New lead (legacy)',
    phase: 'pre_login',
    step: 1,
    icon: UserPlus,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    expectedTATHours: 0.5,
    ownerRole: 'rm',
  },
  contacted: {
    value: 'contacted',
    label: 'Contacted',
    shortLabel: 'Contacted',
    description: 'Student contacted (legacy)',
    phase: 'pre_login',
    step: 2,
    icon: Phone,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    expectedTATHours: 24,
    ownerRole: 'rm',
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    shortLabel: 'In Progress',
    description: 'Application in progress (legacy)',
    phase: 'with_lender',
    step: 8,
    icon: Settings,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    expectedTATHours: 168,
    ownerRole: 'rm',
  },
  document_review: {
    value: 'document_review',
    label: 'Document Review',
    shortLabel: 'Doc Review',
    description: 'Documents under review (legacy)',
    phase: 'pre_login',
    step: 6,
    icon: FileCheck,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    expectedTATHours: 24,
    ownerRole: 'rm',
  },
  approved: {
    value: 'approved',
    label: 'Approved',
    shortLabel: 'Approved',
    description: 'Application approved (legacy)',
    phase: 'sanction',
    step: 15,
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    expectedTATHours: 0,
    ownerRole: 'lender',
  },
};

// ============================================================
// PHASE DEFINITIONS
// ============================================================

export const PHASE_CONFIG: Record<ProcessPhase, { label: string; color: string; bgColor: string; order: number }> = {
  pre_login: { label: 'Pre-Login', color: 'text-blue-700', bgColor: 'bg-blue-50', order: 1 },
  with_lender: { label: 'With Lender', color: 'text-purple-700', bgColor: 'bg-purple-50', order: 2 },
  sanction: { label: 'Sanction', color: 'text-green-700', bgColor: 'bg-green-50', order: 3 },
  disbursement: { label: 'Disbursement', color: 'text-emerald-700', bgColor: 'bg-emerald-50', order: 4 },
  terminal: { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-50', order: 5 },
};

// ============================================================
// ROLE-SPECIFIC STATUS MAPPINGS
// ============================================================

// Student sees simplified 7 stages
export type StudentStage = 'application_received' | 'document_collection' | 'under_review' | 'with_lender' | 'approved' | 'disbursement' | 'completed' | 'closed';

export const STUDENT_STAGE_CONFIG: Record<StudentStage, { label: string; description: string; color: string; bgColor: string }> = {
  application_received: { 
    label: 'Application Received', 
    description: 'We\'ve received your application and will contact you soon',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  document_collection: { 
    label: 'Document Collection', 
    description: 'Please upload your required documents',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100'
  },
  under_review: { 
    label: 'Under Review', 
    description: 'Our team is reviewing your documents',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  with_lender: { 
    label: 'With Lender', 
    description: 'Your application is being processed by the lender',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100'
  },
  approved: { 
    label: 'Approved!', 
    description: 'Congratulations! Your loan has been sanctioned',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  disbursement: { 
    label: 'Disbursement', 
    description: 'Final steps before loan disbursement',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100'
  },
  completed: { 
    label: 'Completed', 
    description: 'Your loan has been successfully disbursed',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  closed: { 
    label: 'Closed', 
    description: 'This application has been closed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
};

// Map internal status to student-friendly stage
export function getStudentStage(status: LeadStatusExtended): StudentStage {
  const config = STATUS_CONFIG[status];
  if (!config) return 'application_received';
  
  if (status === 'rejected' || status === 'withdrawn') return 'closed';
  if (status === 'disbursed') return 'completed';
  
  switch (config.phase) {
    case 'pre_login':
      if (['lead_intake', 'first_contact', 'lenders_mapped', 'checklist_shared', 'new', 'contacted'].includes(status)) {
        return 'application_received';
      }
      if (['docs_uploading', 'docs_submitted'].includes(status)) {
        return 'document_collection';
      }
      return 'under_review';
    case 'with_lender':
      return 'with_lender';
    case 'sanction':
      return 'approved';
    case 'disbursement':
      return 'disbursement';
    default:
      return 'application_received';
  }
}

// Partner sees 4 phases
export function getPartnerPhase(status: LeadStatusExtended): ProcessPhase {
  return STATUS_CONFIG[status]?.phase || 'pre_login';
}

// Get statuses by phase for grouping
export function getStatusesByPhase(phase: ProcessPhase): LeadStatusExtended[] {
  return Object.entries(STATUS_CONFIG)
    .filter(([_, config]) => config.phase === phase && !['new', 'contacted', 'in_progress', 'document_review', 'approved'].includes(config.value))
    .sort((a, b) => a[1].step - b[1].step)
    .map(([status]) => status as LeadStatusExtended);
}

// Get all active (non-terminal) statuses in order
export function getOrderedStatuses(): LeadStatusExtended[] {
  return Object.entries(STATUS_CONFIG)
    .filter(([_, config]) => config.step > 0 && !['new', 'contacted', 'in_progress', 'document_review', 'approved'].includes(config.value))
    .sort((a, b) => a[1].step - b[1].step)
    .map(([status]) => status as LeadStatusExtended);
}

// Check if status is terminal
export function isTerminalStatus(status: LeadStatusExtended): boolean {
  return STATUS_CONFIG[status]?.phase === 'terminal';
}

// Get next possible statuses for workflow
export function getNextStatuses(currentStatus: LeadStatusExtended): LeadStatusExtended[] {
  const config = STATUS_CONFIG[currentStatus];
  if (!config || isTerminalStatus(currentStatus)) return [];
  
  const orderedStatuses = getOrderedStatuses();
  const currentIndex = orderedStatuses.indexOf(currentStatus);
  
  // Can move to next status, or to terminal states
  const nextStatuses: LeadStatusExtended[] = [];
  
  if (currentIndex >= 0 && currentIndex < orderedStatuses.length - 1) {
    nextStatuses.push(orderedStatuses[currentIndex + 1]);
  }
  
  // Can always reject or withdraw (unless already terminal)
  nextStatuses.push('rejected', 'withdrawn');
  
  return nextStatuses;
}

// Calculate TAT status
export type TATStatus = 'on_track' | 'warning' | 'breached';

export function calculateTATStatus(status: LeadStatusExtended, stageStartedAt: Date | string | null): TATStatus {
  if (!stageStartedAt) return 'on_track';
  
  const config = STATUS_CONFIG[status];
  if (!config || config.expectedTATHours === 0) return 'on_track';
  
  const startDate = typeof stageStartedAt === 'string' ? new Date(stageStartedAt) : stageStartedAt;
  const hoursElapsed = (Date.now() - startDate.getTime()) / (1000 * 60 * 60);
  
  const warningThreshold = config.expectedTATHours * 0.75;
  
  if (hoursElapsed >= config.expectedTATHours) return 'breached';
  if (hoursElapsed >= warningThreshold) return 'warning';
  return 'on_track';
}

export function formatTATRemaining(status: LeadStatusExtended, stageStartedAt: Date | string | null): string {
  if (!stageStartedAt) return '';
  
  const config = STATUS_CONFIG[status];
  if (!config || config.expectedTATHours === 0) return '';
  
  const startDate = typeof stageStartedAt === 'string' ? new Date(stageStartedAt) : stageStartedAt;
  const hoursElapsed = (Date.now() - startDate.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = config.expectedTATHours - hoursElapsed;
  
  if (hoursRemaining <= 0) {
    const overBy = Math.abs(hoursRemaining);
    if (overBy >= 24) return `${Math.floor(overBy / 24)}d overdue`;
    return `${Math.floor(overBy)}h overdue`;
  }
  
  if (hoursRemaining >= 24) return `${Math.floor(hoursRemaining / 24)}d left`;
  return `${Math.floor(hoursRemaining)}h left`;
}
