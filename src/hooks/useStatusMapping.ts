import { useMemo } from 'react';
import { 
  STATUS_CONFIG, 
  LeadStatusExtended, 
  getStudentStage, 
  getPartnerPhase,
  STUDENT_STAGE_CONFIG,
  PHASE_CONFIG,
  calculateTATStatus,
  formatTATRemaining,
  TATStatus,
  ProcessPhase,
  StudentStage
} from '@/constants/processFlow';
import type { LeadStatus } from '@/utils/statusUtils';

type UserRole = 'admin' | 'partner' | 'student';

interface StatusDisplay {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  phase: ProcessPhase;
  step: number;
  action?: string;
}

interface StudentStatusDisplay {
  stage: StudentStage;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  nextAction?: string;
}

interface PartnerStatusDisplay {
  phase: ProcessPhase;
  phaseLabel: string;
  status: string;
  shortStatus: string;
  description: string;
  color: string;
  bgColor: string;
  action?: string;
}

interface TATInfo {
  status: TATStatus;
  remaining: string;
  expectedHours: number;
  color: string;
}

// Hook for role-specific status display
export function useStatusDisplay(status: LeadStatus, role: UserRole): StatusDisplay {
  return useMemo(() => {
    const config = STATUS_CONFIG[status as LeadStatusExtended];
    if (!config) {
      return {
        label: status,
        shortLabel: status,
        description: '',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        phase: 'pre_login' as ProcessPhase,
        step: 0,
      };
    }

    let action: string | undefined;
    switch (role) {
      case 'admin':
        action = config.adminAction;
        break;
      case 'partner':
        action = config.partnerAction;
        break;
      case 'student':
        action = config.studentAction;
        break;
    }

    return {
      label: config.label,
      shortLabel: config.shortLabel,
      description: config.description,
      color: config.color,
      bgColor: config.bgColor,
      phase: config.phase,
      step: config.step,
      action,
    };
  }, [status, role]);
}

// Hook for student-friendly status display
export function useStudentStatus(status: LeadStatus): StudentStatusDisplay {
  return useMemo(() => {
    const stage = getStudentStage(status as LeadStatusExtended);
    const stageConfig = STUDENT_STAGE_CONFIG[stage];
    const statusConfig = STATUS_CONFIG[status as LeadStatusExtended];

    return {
      stage,
      label: stageConfig.label,
      description: stageConfig.description,
      color: stageConfig.color,
      bgColor: stageConfig.bgColor,
      nextAction: statusConfig?.studentAction,
    };
  }, [status]);
}

// Hook for partner status display
export function usePartnerStatus(status: LeadStatus): PartnerStatusDisplay {
  return useMemo(() => {
    const phase = getPartnerPhase(status as LeadStatusExtended);
    const phaseConfig = PHASE_CONFIG[phase];
    const statusConfig = STATUS_CONFIG[status as LeadStatusExtended];

    return {
      phase,
      phaseLabel: phaseConfig.label,
      status: statusConfig?.label || status,
      shortStatus: statusConfig?.shortLabel || status,
      description: statusConfig?.description || '',
      color: phaseConfig.color,
      bgColor: phaseConfig.bgColor,
      action: statusConfig?.partnerAction,
    };
  }, [status]);
}

// Hook for TAT information
export function useLeadTAT(status: LeadStatus, stageStartedAt: Date | string | null): TATInfo {
  return useMemo(() => {
    const tatStatus = calculateTATStatus(status as LeadStatusExtended, stageStartedAt);
    const remaining = formatTATRemaining(status as LeadStatusExtended, stageStartedAt);
    const config = STATUS_CONFIG[status as LeadStatusExtended];

    const colorMap: Record<TATStatus, string> = {
      on_track: 'text-green-600',
      warning: 'text-amber-600',
      breached: 'text-red-600',
    };

    return {
      status: tatStatus,
      remaining,
      expectedHours: config?.expectedTATHours || 0,
      color: colorMap[tatStatus],
    };
  }, [status, stageStartedAt]);
}

// Get progress percentage through the flow
export function useStatusProgress(status: LeadStatus): number {
  return useMemo(() => {
    const config = STATUS_CONFIG[status as LeadStatusExtended];
    if (!config || config.step < 0) return 0;
    
    const totalSteps = 22; // Total non-terminal steps
    return Math.round((config.step / totalSteps) * 100);
  }, [status]);
}

// Get statuses grouped by phase for dropdowns
export function useGroupedStatuses() {
  return useMemo(() => {
    const grouped: Record<ProcessPhase, { value: LeadStatus; label: string; shortLabel: string }[]> = {
      pre_login: [],
      with_lender: [],
      sanction: [],
      disbursement: [],
      terminal: [],
    };

    Object.entries(STATUS_CONFIG).forEach(([status, config]) => {
      // Skip legacy statuses
      if (['new', 'contacted', 'in_progress', 'document_review', 'approved'].includes(status)) {
        return;
      }
      
      grouped[config.phase].push({
        value: status as LeadStatus,
        label: config.label,
        shortLabel: config.shortLabel,
      });
    });

    // Sort each group by step
    Object.keys(grouped).forEach(phase => {
      grouped[phase as ProcessPhase].sort((a, b) => {
        const aStep = STATUS_CONFIG[a.value as LeadStatusExtended]?.step || 0;
        const bStep = STATUS_CONFIG[b.value as LeadStatusExtended]?.step || 0;
        return aStep - bStep;
      });
    });

    return grouped;
  }, []);
}
