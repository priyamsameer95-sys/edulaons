import { useState, useMemo, useCallback, memo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Upload, Plus, Zap, ClipboardCheck, TrendingUp, Rocket, Sparkles, Lock } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import { RefactoredLead } from "@/types/refactored-lead";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import type { LeadStatus, DocumentStatus } from "@/utils/statusUtils";

interface PartnerLeadsTableProps {
  leads: RefactoredLead[];
  loading: boolean;
  onUploadDocs: (lead: RefactoredLead) => void;
  onCompleteLead?: (lead: RefactoredLead) => void;
  onNewLead?: () => void;
  onViewLead?: (lead: RefactoredLead) => void;
}

// Memoized helper functions
const isIncompleteQuickLead = (lead: RefactoredLead): boolean => {
  if (lead.is_quick_lead === true && !lead.quick_lead_completed_at) {
    return true;
  }
  const coApplicant = lead.co_applicant;
  if (coApplicant?.pin_code === '000000') {
    return true;
  }
  return false;
};

const isEligibilityCheckedLead = (lead: RefactoredLead): boolean => {
  return (lead as any).eligibility_score !== null && (lead as any).eligibility_score !== undefined;
};

const getLeadAgeUrgency = (createdAt: string): 'urgent' | 'warning' | 'normal' => {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours > 48) return 'urgent';
  if (hours > 24) return 'warning';
  return 'normal';
};

const canUploadDocs = (lead: RefactoredLead, isIncomplete: boolean): boolean => {
  return !isIncomplete && (lead.documents_status === 'pending' || lead.documents_status === 'resubmission_required');
};

// Memoized eligibility badge component
const EligibilityBadge = memo(({ lead }: { lead: RefactoredLead }) => {
  const score = (lead as any).eligibility_score;
  const result = (lead as any).eligibility_result;
  
  if (!score) return null;
  
  const badgeClass = result === 'eligible' || score >= 70
    ? "bg-green-50 text-green-700 border-green-200"
    : result === 'conditional' || score >= 50
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-orange-50 text-orange-700 border-orange-200";

  return (
    <Badge variant="outline" className={`text-xs ${badgeClass} gap-1`}>
      <TrendingUp className="h-3 w-3" />
      {score}/100
    </Badge>
  );
});

EligibilityBadge.displayName = 'EligibilityBadge';

// Memoized table row component
interface LeadRowProps {
  lead: RefactoredLead;
  onUploadDocs: (lead: RefactoredLead) => void;
  onCompleteLead?: (lead: RefactoredLead) => void;
  onViewLead?: (lead: RefactoredLead) => void;
}

const LeadRow = memo(({ lead, onUploadDocs, onCompleteLead, onViewLead }: LeadRowProps) => {
  const isIncomplete = isIncompleteQuickLead(lead);
  const hasEligibility = isEligibilityCheckedLead(lead);
  const urgency = getLeadAgeUrgency(lead.created_at);
  const canUpload = canUploadDocs(lead, isIncomplete);

  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUploadDocs(lead);
  }, [lead, onUploadDocs]);

  const handleCompleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCompleteLead?.(lead);
  }, [lead, onCompleteLead]);

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewLead?.(lead);
  }, [lead, onViewLead]);

  const handleRowClick = useCallback(() => {
    onViewLead?.(lead);
  }, [lead, onViewLead]);

  return (
    <TableRow 
      className={cn(
        "hover:bg-muted/50 cursor-pointer",
        isIncomplete && urgency === 'urgent' && "bg-red-50/30",
        isIncomplete && urgency === 'warning' && "bg-amber-50/30"
      )}
      onClick={handleRowClick}
    >
      <TableCell className="font-medium text-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {lead.case_id}
            {isIncomplete && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1 cursor-help"
                    >
                      <Zap className="h-3 w-3" />
                      Quick
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border">
                    <p className="text-xs">Quick applications get priority lender responses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {isIncomplete && urgency === 'urgent' && (
            <span className="text-[10px] text-red-600 font-medium">⚠️ Action needed now!</span>
          )}
          {isIncomplete && urgency === 'warning' && (
            <span className="text-[10px] text-amber-600">⏰ Complete today</span>
          )}
          {isIncomplete && urgency === 'normal' && (
            <span className="text-[10px] text-muted-foreground">Complete to unlock 2x lender matches</span>
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
        <div className="flex flex-col gap-1">
          {isIncomplete ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 w-fit cursor-help">
                    🟡 Pending
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border max-w-[200px]">
                  <p className="text-xs">Complete missing details to qualify for 2x more lenders</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <StatusBadge status={lead.status as LeadStatus} type="lead" />
          )}
          {hasEligibility && <EligibilityBadge lead={lead} />}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isIncomplete ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-dashed cursor-help text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border max-w-[200px]">
                  <p className="text-xs">Complete the application to unlock document uploads</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            canUpload ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                className="h-7 px-2.5 text-xs gap-1.5 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-3 w-3" />
                Upload Docs
              </Button>
            ) : (
              <StatusBadge status={lead.documents_status as DocumentStatus} type="document" />
            )
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
        <div className="flex flex-col items-start gap-0.5">
          {isIncomplete && onCompleteLead ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleCompleteClick}
                className="h-8 px-3 text-xs gap-1"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Resume Application
              </Button>
              <span className="text-[10px] text-muted-foreground">Takes &lt;2 mins</span>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewClick}
              className="h-8 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

LeadRow.displayName = 'LeadRow';

// Loading skeleton component
const TableSkeleton = memo(() => (
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
));

TableSkeleton.displayName = 'TableSkeleton';

// Empty state component
const EmptyState = memo(({ onNewLead }: { onNewLead?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border rounded-lg">
    <div className="text-center space-y-6 max-w-md">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Rocket className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">No Active Applications Yet</h2>
        <p className="text-muted-foreground">
          Start your first eligibility check to help students find the best education loan options
        </p>
      </div>
      {onNewLead && (
        <Button 
          onClick={onNewLead} 
          size="lg" 
          className="h-14 px-10 text-lg font-semibold gap-3"
        >
          <Sparkles className="h-6 w-6" />
          Start First Eligibility Check
        </Button>
      )}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

export const PartnerLeadsTable = memo(({
  leads,
  loading,
  onUploadDocs,
  onCompleteLead,
  onNewLead,
  onViewLead,
}: PartnerLeadsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Memoize pagination calculations
  const { totalPages, startIndex, paginatedLeads } = useMemo(() => {
    const total = Math.ceil(leads.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = leads.slice(start, start + itemsPerPage);
    return { totalPages: total, startIndex: start, paginatedLeads: paginated };
  }, [leads, currentPage, itemsPerPage]);

  // Memoize page navigation handlers
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Reset to page 1 when leads change significantly
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return <TableSkeleton />;
  }

  if (leads.length === 0) {
    return <EmptyState onNewLead={onNewLead} />;
  }

  return (
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
              {paginatedLeads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onUploadDocs={onUploadDocs}
                  onCompleteLead={onCompleteLead}
                  onViewLead={onViewLead}
                />
              ))}
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
                    onClick={handlePrevPage}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageClick(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPage}
                    className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PartnerLeadsTable.displayName = 'PartnerLeadsTable';
