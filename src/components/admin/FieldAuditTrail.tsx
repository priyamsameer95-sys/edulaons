import { format } from 'date-fns';
import { History, User, Bot, UserCircle, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFieldAuditLog } from '@/hooks/useClarifications';
import { cn } from '@/lib/utils';
import { formatDisplayText } from '@/utils/formatters';

interface FieldAuditTrailProps {
  leadId: string | null;
}

export function FieldAuditTrail({ leadId }: FieldAuditTrailProps) {
  const { auditLog, loading } = useFieldAuditLog(leadId);

  const getSourceBadge = (source: string) => {
    const sourceConfig: Record<string, { label: string; className: string }> = {
      quick_eligibility: { label: 'Quick Eligibility', className: 'bg-purple-100 text-purple-700' },
      complete_profile: { label: 'Complete Profile', className: 'bg-blue-100 text-blue-700' },
      admin_edit: { label: 'Admin Edit', className: 'bg-amber-100 text-amber-700' },
      partner_edit: { label: 'Partner Edit', className: 'bg-green-100 text-green-700' },
      clarification_response: { label: 'Clarification', className: 'bg-cyan-100 text-cyan-700' },
      document_extraction: { label: 'AI Extraction', className: 'bg-pink-100 text-pink-700' },
      system: { label: 'System', className: 'bg-gray-100 text-gray-700' },
    };
    return sourceConfig[source] || { label: source, className: 'bg-gray-100 text-gray-700' };
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'student':
        return <User className="h-4 w-4" />;
      case 'partner':
        return <Briefcase className="h-4 w-4" />;
      case 'admin':
        return <UserCircle className="h-4 w-4" />;
      case 'system':
        return <Bot className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatFieldName = (tableName: string, fieldName: string) => {
    const tableLabels: Record<string, string> = {
      students: 'Student',
      co_applicants: 'Co-Applicant',
      leads_new: 'Lead',
    };

    const fieldLabels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      postal_code: 'PIN Code',
      city: 'City',
      state: 'State',
      date_of_birth: 'Date of Birth',
      highest_qualification: 'Qualification',
      relationship: 'Relationship',
      salary: 'Salary',
      employer: 'Employer',
      occupation: 'Occupation',
      loan_amount: 'Loan Amount',
      status: 'Status',
      lan_number: 'LAN Number',
      sanction_amount: 'Sanction Amount',
    };

    const table = tableLabels[tableName] || formatDisplayText(tableName);
    const field = fieldLabels[fieldName] || formatDisplayText(fieldName);
    return `${table} → ${field}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Data Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No field changes recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {auditLog.map((entry, index) => {
                  const sourceBadge = getSourceBadge(entry.change_source);
                  return (
                    <div key={entry.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute left-2.5 w-3 h-3 rounded-full border-2 border-background',
                          entry.changed_by_type === 'admin'
                            ? 'bg-amber-500'
                            : entry.changed_by_type === 'student'
                            ? 'bg-blue-500'
                            : entry.changed_by_type === 'system'
                            ? 'bg-gray-500'
                            : 'bg-green-500'
                        )}
                      />

                      <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', sourceBadge.className)}
                            >
                              {sourceBadge.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatFieldName(entry.table_name, entry.field_name)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(entry.created_at), 'dd MMM, HH:mm')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          {entry.old_value && (
                            <>
                              <span className="text-muted-foreground line-through">
                                {entry.old_value.length > 30
                                  ? entry.old_value.slice(0, 30) + '...'
                                  : entry.old_value}
                              </span>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <span className="font-medium">
                            {entry.new_value && entry.new_value.length > 50
                              ? entry.new_value.slice(0, 50) + '...'
                              : entry.new_value || '(empty)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {getActorIcon(entry.changed_by_type)}
                          <span className="capitalize">{entry.changed_by_type}</span>
                          {entry.changed_by_name && (
                            <>
                              <span>•</span>
                              <span>{entry.changed_by_name}</span>
                            </>
                          )}
                          {entry.change_reason && (
                            <>
                              <span>•</span>
                              <span className="italic">{entry.change_reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
