import { AlertCircle, Clock, FileCheck, TrendingUp, User, FileText, CheckCircle2 } from 'lucide-react';
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
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalActions = stats.newLeadsCount + stats.documentsAwaitingCount;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <AlertCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Admin Action Required</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Review pending items</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs text-muted-foreground">New Leads</p>
              <p className="text-sm text-muted-foreground">to</p>
              <p className="text-2xl font-bold text-foreground">{stats.newLeadsCount}</p>
              <p className="text-xs text-muted-foreground">awaiting review</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs text-muted-foreground">Documents</p>
              <p className="text-sm text-muted-foreground">to</p>
              <p className="text-2xl font-bold text-foreground">{stats.documentsAwaitingCount}</p>
              <p className="text-xs text-muted-foreground">verify</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalPendingValue >= 10000000 
                  ? `₹${(stats.totalPendingValue / 10000000).toFixed(1)}Cr`
                  : stats.totalPendingValue >= 100000
                  ? `₹${(stats.totalPendingValue / 100000).toFixed(1)}L`
                  : `₹${stats.totalPendingValue.toFixed(0)}`
                }
              </p>
              <p className="text-xs text-muted-foreground">Value</p>
            </div>
          </div>
        </div>

        {/* Review prompt */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Review and update to keep pipeline moving</p>
        </div>

        {/* Tabs for different action types */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background">
              All ({totalActions})
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs data-[state=active]:bg-background">
              New Leads ({stats.newLeadsCount})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-background">
              Documents ({stats.documentsAwaitingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 max-h-[400px] overflow-y-auto mt-3 pr-1">
            {/* New Leads Section */}
            {newLeads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-0.5 mb-1">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-medium text-muted-foreground">
                    New Leads ({newLeads.length})
                  </h4>
                </div>
                {newLeads.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-lg border bg-card hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{lead.student_name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                            {lead.case_id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{lead.days_since_created}d old</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="truncate">{lead.partner_name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold whitespace-nowrap">
                          ₹{(lead.loan_amount / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
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
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 px-0.5 mb-1">
                  <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Documents ({documentsAwaiting.length})
                  </h4>
                </div>
                {documentsAwaiting.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg border bg-card hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{doc.student_name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                            {doc.case_id}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{doc.document_type_name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{doc.days_waiting}d waiting</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="capitalize">{doc.uploaded_by}</span>
                        </div>
                      </div>
                      <Badge
                        variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'default'}
                        className="text-[10px] px-2 py-0.5 h-5 flex-shrink-0"
                      >
                        {doc.verification_status === 'uploaded' ? 'New' : 'Resub'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                    >
                      Verify Document
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {totalActions === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-base font-semibold mb-1">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">No pending actions at this time</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="space-y-2 max-h-[400px] overflow-y-auto mt-3 pr-1">
            {newLeads.length > 0 ? (
              newLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{lead.student_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                          {lead.case_id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{lead.days_since_created}d old</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="truncate">{lead.partner_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold whitespace-nowrap">
                        ₹{(lead.loan_amount / 100000).toFixed(1)}L
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onReviewLead(lead.id)}
                  >
                    Review & Update Status
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No New Leads</h3>
                <p className="text-sm text-muted-foreground">No leads to review at this time</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-2 max-h-[400px] overflow-y-auto mt-3 pr-1">
            {documentsAwaiting.length > 0 ? (
              documentsAwaiting.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{doc.student_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                          {doc.case_id}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{doc.document_type_name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{doc.days_waiting}d waiting</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="capitalize">{doc.uploaded_by}</span>
                      </div>
                    </div>
                    <Badge
                      variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'default'}
                      className="text-[10px] px-2 py-0.5 h-5 flex-shrink-0"
                    >
                      {doc.verification_status === 'uploaded' ? 'New' : 'Resub'}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                  >
                    Verify Document
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No Documents</h3>
                <p className="text-sm text-muted-foreground">No documents to verify at this time</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
