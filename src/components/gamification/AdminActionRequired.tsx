import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, FileText, Users, Eye, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useAdminActionItems } from "@/hooks/useAdminActionItems";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AdminActionRequiredProps {
  onReviewLead: (leadId: string) => void;
  onVerifyDocument: (documentId: string, leadId: string) => void;
}

export const AdminActionRequired = ({ onReviewLead, onVerifyDocument }: AdminActionRequiredProps) => {
  const { newLeads, documentsAwaiting, stats, loading } = useAdminActionItems();
  const [activeTab, setActiveTab] = useState<"all" | "leads" | "documents">("all");

  if (loading) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-6">
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalActions = stats.newLeadsCount + stats.documentsAwaitingCount;
  const isUrgent = totalActions > 5;

  return (
    <Card className={`border-2 shadow-lg transition-all hover:shadow-xl ${
      isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'
    }`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isUrgent ? 'bg-destructive/10' : 'bg-warning/10'}`}>
              <AlertCircle className={`h-6 w-6 ${isUrgent ? 'text-destructive' : 'text-warning'}`} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Admin Action Required</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Review pending items</p>
            </div>
          </div>
          {totalActions > 0 && (
            <Badge 
              variant={isUrgent ? "destructive" : "secondary"} 
              className="text-base px-4 py-1.5 font-semibold"
            >
              {totalActions} Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* New Leads Card */}
          <div className="relative overflow-hidden bg-card rounded-xl p-5 border-2 border-primary/20 shadow-md hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              {stats.newLeadsCount > 0 && (
                <Badge variant="secondary" className="font-semibold">
                  {stats.newLeadsCount > 5 ? 'High Priority' : 'Review'}
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">New Leads</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-primary">{stats.newLeadsCount}</p>
              <p className="text-sm text-muted-foreground mb-1">awaiting review</p>
            </div>
          </div>

          {/* Documents Pending Card */}
          <div className="relative overflow-hidden bg-card rounded-xl p-5 border-2 border-warning/30 shadow-md hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              {stats.documentsAwaitingCount > 0 && (
                <Badge variant="secondary" className="font-semibold">
                  {stats.documentsAwaitingCount > 5 ? 'Urgent' : 'Pending'}
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Documents</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-warning">{stats.documentsAwaitingCount}</p>
              <p className="text-sm text-muted-foreground mb-1">to verify</p>
            </div>
          </div>

          {/* Total Value Card */}
          <div className="relative overflow-hidden bg-card rounded-xl p-5 border-2 border-success/30 shadow-md hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <Badge variant="secondary" className="font-semibold">
                Pipeline Value
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Pending Value</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-success">
                ₹{stats.totalPendingValue >= 10000000 
                  ? `${(stats.totalPendingValue / 10000000).toFixed(1)}Cr` 
                  : `${(stats.totalPendingValue / 100000).toFixed(1)}L`}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Enhanced Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-card data-[state=active]:shadow-md font-semibold py-2.5"
            >
              <div className="flex flex-col items-center gap-1">
                <span>All Items</span>
                <Badge variant="secondary" className="text-xs">{totalActions}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="data-[state=active]:bg-card data-[state=active]:shadow-md font-semibold py-2.5"
            >
              <div className="flex flex-col items-center gap-1">
                <span>New Leads</span>
                <Badge variant="secondary" className="text-xs">{stats.newLeadsCount}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-card data-[state=active]:shadow-md font-semibold py-2.5"
            >
              <div className="flex flex-col items-center gap-1">
                <span>Documents</span>
                <Badge variant="secondary" className="text-xs">{stats.documentsAwaitingCount}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {totalActions === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border-2 border-dashed border-success/30">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-semibold mb-2">All Caught Up!</p>
                <p className="text-sm text-muted-foreground">No pending actions at this time</p>
              </div>
            ) : (
              <>
                {/* Priority Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Recent Actions Needed
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Showing top {Math.min(6, totalActions)} items
                  </Badge>
                </div>

                {/* Show limited new leads in "All" tab */}
                {newLeads.slice(0, 3).map((lead, index) => (
                  <div
                    key={lead.id}
                    className="relative bg-card rounded-xl p-4 border-2 border-primary/20 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    {/* Priority Indicator */}
                    {index < 2 && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="destructive" className="text-xs font-semibold">
                          High Priority
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base mb-1.5 truncate">
                              {lead.student_name}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <span className="font-semibold text-foreground">Case:</span>
                                <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                  {lead.case_id}
                                </code>
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground font-medium">
                                {lead.partner_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="inline-flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="font-bold text-success text-lg">
                              ₹{lead.loan_amount >= 10000000 
                                ? `${(lead.loan_amount / 10000000).toFixed(1)}Cr` 
                                : `${(lead.loan_amount / 100000).toFixed(1)}L`}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{lead.days_since_created} days old</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => onReviewLead(lead.id)}
                          className="w-full sm:w-auto font-semibold"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Lead Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show limited documents in "All" tab */}
                {documentsAwaiting.slice(0, 3).map((doc, index) => (
                  <div
                    key={doc.id}
                    className="relative bg-card rounded-xl p-4 border-2 border-warning/30 hover:border-warning/50 hover:shadow-md transition-all"
                  >
                    {/* Priority Indicator */}
                    {index === 0 && documentsAwaiting.length > 3 && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="text-xs font-semibold border-warning text-warning">
                          Urgent
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-warning/10 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-warning" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base mb-1.5 truncate">
                              {doc.document_type_name}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <span className="font-semibold text-foreground">Case:</span>
                                <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                  {doc.case_id}
                                </code>
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground font-medium">
                                {doc.student_name}
                              </span>
                            </div>
                          </div>
                          <Badge 
                            variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'secondary'}
                            className="text-xs font-semibold shrink-0"
                          >
                            {doc.verification_status === 'uploaded' ? 'New' : 'Resub'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Waiting {doc.days_waiting} days</span>
                          </div>
                          <span className="text-muted-foreground text-sm">•</span>
                          <span className="text-muted-foreground text-sm capitalize">By {doc.uploaded_by}</span>
                        </div>

                        <Button
                          onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                          variant="default"
                          className="w-full sm:w-auto font-semibold"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Document
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {(newLeads.length > 3 || documentsAwaiting.length > 3) && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      {Math.max(0, totalActions - 6)} more items available. Switch tabs to view all.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4 mt-4">
            {newLeads.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border-2 border-dashed border-muted">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No New Leads</p>
                <p className="text-sm text-muted-foreground">All leads have been reviewed</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {newLeads.length} New {newLeads.length === 1 ? 'Lead' : 'Leads'}
                  </h3>
                </div>

                {newLeads.map((lead, index) => (
                  <div
                    key={lead.id}
                    className="relative bg-card rounded-xl p-4 border-2 border-primary/20 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    {index < 2 && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="destructive" className="text-xs font-semibold">
                          High Priority
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <h4 className="font-bold text-base mb-1.5">
                            {lead.student_name}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">Case:</span>
                              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                {lead.case_id}
                              </code>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground font-medium">
                              {lead.partner_name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="inline-flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="font-bold text-success text-lg">
                              ₹{lead.loan_amount >= 10000000 
                                ? `${(lead.loan_amount / 10000000).toFixed(1)}Cr` 
                                : `${(lead.loan_amount / 100000).toFixed(1)}L`}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{lead.days_since_created} days old</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => onReviewLead(lead.id)}
                          className="w-full sm:w-auto font-semibold"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Lead Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            {documentsAwaiting.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border-2 border-dashed border-muted">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No Pending Documents</p>
                <p className="text-sm text-muted-foreground">All documents have been verified</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {documentsAwaiting.length} {documentsAwaiting.length === 1 ? 'Document' : 'Documents'} Awaiting Verification
                  </h3>
                </div>

                {documentsAwaiting.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="relative bg-card rounded-xl p-4 border-2 border-warning/30 hover:border-warning/50 hover:shadow-md transition-all"
                  >
                    {index === 0 && documentsAwaiting.length > 5 && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="text-xs font-semibold border-warning text-warning">
                          Urgent
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-warning/10 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-warning" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="font-bold text-base flex-1">
                              {doc.document_type_name}
                            </h4>
                            <Badge 
                              variant={doc.verification_status === 'resubmission_required' ? 'destructive' : 'secondary'}
                              className="text-xs font-semibold shrink-0"
                            >
                              {doc.verification_status === 'uploaded' ? 'New' : 'Resub'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">Case:</span>
                              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                {doc.case_id}
                              </code>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground font-medium">
                              {doc.student_name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Waiting {doc.days_waiting} days</span>
                          </div>
                          <span className="text-muted-foreground text-sm">•</span>
                          <span className="text-muted-foreground text-sm capitalize">By {doc.uploaded_by}</span>
                        </div>

                        <Button
                          onClick={() => onVerifyDocument(doc.id, doc.lead_id)}
                          variant="default"
                          className="w-full sm:w-auto font-semibold"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Document
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
