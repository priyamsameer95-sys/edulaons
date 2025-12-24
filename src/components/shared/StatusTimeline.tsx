/**
 * Status Timeline Component
 * 
 * Per Knowledge Base:
 * - Real-time visibility & tracking via lead timeline and clear stage labels
 * - Defined pipeline stages must exist and be consistent across roles
 * - Student must see a clean, friendly timeline with student-safe labels
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Clock, Circle, AlertCircle } from 'lucide-react';
import { STUDENT_STATUS_LABELS } from '@/constants/studentPermissions';

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
}

interface StatusTimelineProps {
  leadId: string;
  currentStatus: string;
  isStudentView?: boolean;
  className?: string;
}

// Define the standard pipeline stages
const PIPELINE_STAGES = [
  { key: 'new', label: 'Application Received', studentLabel: 'Application Received' },
  { key: 'doc_review', label: 'Document Review', studentLabel: 'Documents Under Review' },
  { key: 'bank_login', label: 'Bank Login', studentLabel: 'Sent to Lender' },
  { key: 'bank_processing', label: 'Bank Processing', studentLabel: 'Lender Processing' },
  { key: 'pd_scheduled', label: 'PD Scheduled', studentLabel: 'Verification Scheduled' },
  { key: 'pd_complete', label: 'PD Complete', studentLabel: 'Verification Complete' },
  { key: 'approved', label: 'Approved', studentLabel: 'Loan Approved! 🎉' },
  { key: 'disbursed', label: 'Disbursed', studentLabel: 'Loan Disbursed' },
];

const TERMINAL_STATUSES = ['rejected', 'withdrawn', 'on_hold'];

export function StatusTimeline({ 
  leadId, 
  currentStatus, 
  isStudentView = false,
  className 
}: StatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('lead_status_history')
          .select('id, old_status, new_status, created_at, changed_by, change_reason, notes')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error fetching status history:', err);
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      fetchHistory();
    }
  }, [leadId]);

  // Get the current stage index
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);

  // Get completed stages from history
  const completedStages = new Set(history.map(h => h.new_status));

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="h-4 bg-muted rounded w-28 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {PIPELINE_STAGES.map((stage, index) => {
        const isCompleted = completedStages.has(stage.key) || index < currentStageIndex;
        const isCurrent = stage.key === currentStatus;
        const isPending = index > currentStageIndex && !isTerminal;

        // Find the history entry for this stage
        const historyEntry = history.find(h => h.new_status === stage.key);
        const timestamp = historyEntry?.created_at;
        const isLast = index === PIPELINE_STAGES.length - 1;

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              {/* Status Icon */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 z-10",
                isCompleted ? "border-emerald-500 bg-emerald-500 text-white" :
                isCurrent ? "border-primary bg-primary text-primary-foreground" :
                "border-muted bg-background text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                )}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  "w-0.5 h-8 -mt-px",
                  isCompleted ? "bg-emerald-500" : "bg-muted"
                )} />
              )}
            </div>

            {/* Stage Info */}
            <div className={cn("pb-4", isLast && "pb-0")}>
              <p className={cn(
                "text-sm font-medium leading-6",
                isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {isStudentView ? stage.studentLabel : stage.label}
              </p>
              {timestamp && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(timestamp), 'MMM d, yyyy • h:mm a')}
                </p>
              )}
              {isCurrent && !isStudentView && historyEntry?.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {historyEntry.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Show terminal status if applicable */}
      {isTerminal && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 bg-destructive border-destructive text-white shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-destructive leading-6">
              {isStudentView 
                ? STUDENT_STATUS_LABELS[currentStatus] || currentStatus 
                : currentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            </p>
            {history.find(h => h.new_status === currentStatus)?.change_reason && !isStudentView && (
              <p className="text-xs text-muted-foreground mt-1">
                {history.find(h => h.new_status === currentStatus)?.change_reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusTimeline;
