import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { History, User, Bot, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useFieldAuditLog, FieldAuditEntry } from '@/hooks/useFieldAuditLog';
import { formatDisplayEmail } from '@/utils/formatters';

interface FieldAuditTimelineProps {
  leadId: string;
}

const formatFieldName = (tableName: string, fieldName: string): string => {
  const tableMap: Record<string, string> = {
    'students': 'Student',
    'co_applicants': 'Co-Applicant',
    'leads_new': 'Lead',
    'lead_documents': 'Document',
  };
  const fieldMap: Record<string, string> = {
    'loan_amount': 'Loan Amount',
    'status': 'Status',
    'lender_id': 'Lender',
    'verification_status': 'Verification',
    'name': 'Name',
    'phone': 'Phone',
    'email': 'Email',
    'salary': 'Salary',
    'credit_score': 'Credit Score',
  };
  const table = tableMap[tableName] || tableName;
  const field = fieldMap[fieldName] || fieldName.replace(/_/g, ' ');
  return `${table} → ${field}`;
};

const getSourceBadge = (source: string) => {
  const map: Record<string, { label: string; className: string }> = {
    'user_edit': { label: 'Manual', className: 'bg-blue-100 text-blue-800' },
    'ai_suggestion': { label: 'AI', className: 'bg-purple-100 text-purple-800' },
    'system': { label: 'System', className: 'bg-gray-100 text-gray-800' },
    'api': { label: 'API', className: 'bg-green-100 text-green-800' },
  };
  return map[source] || { label: source, className: 'bg-muted text-muted-foreground' };
};

export function FieldAuditTimeline({ leadId }: FieldAuditTimelineProps) {
  const { data: auditLog, isLoading } = useFieldAuditLog(leadId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Field Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Field Changes
          {auditLog && auditLog.length > 0 && (
            <Badge variant="secondary" className="text-xs">{auditLog.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!auditLog || auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No field changes recorded</p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {auditLog.map((entry: FieldAuditEntry) => {
                const source = getSourceBadge(entry.change_source);
                return (
                  <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={source.className}>{source.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{formatFieldName(entry.table_name, entry.field_name)}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground line-through">
                        {entry.field_name === 'email' 
                          ? formatDisplayEmail(entry.old_value).display 
                          : (entry.old_value || '(empty)')}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {entry.field_name === 'email' 
                          ? formatDisplayEmail(entry.new_value).display 
                          : (entry.new_value || '(empty)')}
                      </span>
                    </div>
                    {entry.changed_by_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.changed_by_name}
                      </div>
                    )}
                    {entry.change_reason && (
                      <p className="text-xs text-muted-foreground italic">{entry.change_reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
