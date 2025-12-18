import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Upload, Users, Plus, Zap, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RefactoredLead } from "@/types/refactored-lead";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import type { LeadStatus, DocumentStatus } from "@/utils/statusUtils";
import { LeadDetailSheet } from "@/components/dashboard/LeadDetailSheet";

interface PartnerLeadsTableProps {
  leads: RefactoredLead[];
  loading: boolean;
  onUploadDocs: (lead: RefactoredLead) => void;
  onCompleteLead?: (lead: RefactoredLead) => void;
  onNewLead?: () => void;
}

export const PartnerLeadsTable = ({
  leads,
  loading,
  onUploadDocs,
  onCompleteLead,
  onNewLead,
}: PartnerLeadsTableProps) => {
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = leads.slice(startIndex, startIndex + itemsPerPage);

  const handleViewLead = (lead: RefactoredLead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const isIncompleteQuickLead = (lead: RefactoredLead) => {
    return lead.is_quick_lead === true && !lead.quick_lead_completed_at;
  };

  const canUploadDocs = (lead: RefactoredLead) => {
    const isIncomplete = isIncompleteQuickLead(lead);
    return !isIncomplete && (lead.documents_status === 'pending' || lead.documents_status === 'resubmission_required');
  };

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border rounded-lg">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Start Your First Application</h2>
            <p className="text-muted-foreground">
              Add a student lead to begin processing education loan applications
            </p>
          </div>
          {onNewLead && (
            <Button 
              onClick={onNewLead} 
              size="lg" 
              className="h-14 px-10 text-lg font-semibold gap-3"
            >
              <Plus className="h-6 w-6" />
              Add Your First Lead
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="font-semibold">Case ID</TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Docs</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => {
                  const isIncomplete = isIncompleteQuickLead(lead);
                  
                  return (
                    <TableRow 
                      key={lead.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewLead(lead)}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {lead.case_id}
                            {isIncomplete && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1"
                              >
                                <Zap className="h-3 w-3" />
                                Quick
                              </Badge>
                            )}
                          </div>
                          {isIncomplete && (
                            <span className="text-[10px] text-amber-600">Complete for 2x match</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{lead.student?.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{lead.student?.phone || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isIncomplete ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Incomplete
                          </Badge>
                        ) : (
                          <StatusBadge status={lead.status as LeadStatus} type="lead" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isIncomplete ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <>
                              <StatusBadge status={lead.documents_status as DocumentStatus} type="document" />
                              {canUploadDocs(lead) && (
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUploadDocs(lead);
                                  }}
                                  className="h-6 px-2 text-xs text-primary hover:text-primary"
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        ₹{(lead.loan_amount / 100000).toFixed(1)}L
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd MMM')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isIncomplete && onCompleteLead ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteLead(lead);
                              }}
                              className="h-8 px-3 text-xs gap-1"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewLead(lead);
                              }}
                              className="h-8 px-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, leads.length)} of {leads.length}
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};
