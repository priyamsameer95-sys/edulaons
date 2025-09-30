import { AlertCircle, Clock, FileCheck, TrendingUp, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminActionItems } from '@/hooks/useAdminActionItems';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface AdminActionRequiredProps {
  onReviewLead: (leadId: string) => void;
  onVerifyDocument: (documentId: string, leadId: string) => void;
}

export const AdminActionRequired = ({ onReviewLead, onVerifyDocument }: AdminActionRequiredProps) => {
  const { newLeads, documentsAwaiting, stats, loading } = useAdminActionItems();
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'documents'>('all');

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalActions = stats.newLeadsCount + stats.documentsAwaitingCount;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            Admin Action Required
          </CardTitle>
          {totalActions > 0 && (
            <Badge variant="default" className="animate-pulse">
              {totalActions}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Summary Stats */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">New Leads</p>
              <p className="text-3xl font-bold text-primary">{stats.newLeadsCount}</p>
            </div>
            <div className="text-center border-l border-r border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Documents</p>
              <p className="text-3xl font-bold text-primary">{stats.documentsAwaitingCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Value</p>
              <p className="text-xl font-bold text-primary">
                {stats.totalPendingValue >= 10000000 
                  ? `₹${(stats.totalPendingValue / 10000000).toFixed(1)}Cr`
                  : `₹${(stats.totalPendingValue / 100000).toFixed(1)}L`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-primary/10">
            <TrendingUp className="h-3 w-3" />
            <span>Review and update to keep pipeline moving</span>
          </div>
        </div>

        {/* Tabs for different action types */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="all" className="text-xs">
              All ({totalActions})
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">
              Leads ({stats.newLeadsCount})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              Docs ({stats.documentsAwaitingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 max-h-[450px] overflow-y-auto mt-4 pr-1">
            {/* New Leads Section */}
            {newLeads.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
                  <User className="h-4 w-4" />
                  New Leads ({newLeads.length})
                </h4>
                {newLeads.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm truncate">{lead.student_name}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {lead.case_id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{lead.days_since_created}d old</span>
                          </div>
                          <span>•</span>
                          <span className="truncate">{lead.partner_name}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold whitespace-nowrap">
                          ₹{(lead.loan_amount / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full hover:bg-primary hover:text-primary-foreground"
                      onClick={() => onReviewLead(lead.id)}
                    >
                      Review & Update Status
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Section */}
            {documentsAwaiting.length > 0 && (
              <div className="space-y-2.5 mt-5">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
                  <FileCheck className="h-4 w-4" />
                  Documents ({documentsAwaiting.length})
                </h4>
                {documentsAwaiting.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm truncate">{doc.student_name}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {doc.case_id}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1.5">{doc.document_type_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{doc.days_waiting}d waiting</span>
                          </div>
                          <span>•</span>
                          <span className="capitalize">{doc.uploaded_by}</span>
                        </div>
                      </div>
                      <Badge
                        variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'default'}
                        className="text-xs flex-shrink-0"
                      >
                        {doc.verification_status === 'uploaded' ? 'New' : 'Resub'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full hover:bg-primary hover:text-primary-foreground"
                      onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                    >
                      Verify Document
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {totalActions === 0 && (
              <div className="text-center py-8">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">All caught up! No actions required.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="space-y-3 max-h-[450px] overflow-y-auto mt-4 pr-1">
            {newLeads.length > 0 ? (
              newLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{lead.student_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {lead.case_id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{lead.days_since_created} days old</span>
                        <span>•</span>
                        <span>{lead.partner_name}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">
                        ₹{(lead.loan_amount / 100000).toFixed(1)}L
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => onReviewLead(lead.id)}
                  >
                    Review & Update Status
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No new leads to review</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3 max-h-[450px] overflow-y-auto mt-4 pr-1">
            {documentsAwaiting.length > 0 ? (
              documentsAwaiting.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{doc.student_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.case_id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.document_type_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Waiting {doc.days_waiting} days</span>
                        <span>•</span>
                        <span>By {doc.uploaded_by}</span>
                      </div>
                    </div>
                    <Badge
                      variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {doc.verification_status === 'uploaded' ? 'New' : 'Resubmitted'}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 hover:bg-primary hover:text-primary-foreground"
                    onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                  >
                    Verify Document
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No documents to verify</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
