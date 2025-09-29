import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { 
  CalendarIcon, 
  Search, 
  Filter, 
  Eye,
  FileCheck,
  Users,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { EmptyState } from "@/components/ui/empty-state";
import { useRefactoredLeads } from "@/hooks/useRefactoredLeads";
import { RefactoredLead } from "@/types/refactored-lead";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import { StatusUpdateModal } from "@/components/lead-status/StatusUpdateModal";
import { LEAD_STATUS_OPTIONS, DOCUMENT_STATUS_OPTIONS } from "@/utils/statusUtils";
import type { LeadStatus, DocumentStatus } from "@/utils/statusUtils";

interface LeadsTabProps {
  onNewLead?: () => void;
}

export const LeadsTab = ({ onNewLead }: LeadsTabProps) => {
  const [selectedLead, setSelectedLead] = useState<RefactoredLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [leadToUpdate, setLeadToUpdate] = useState<RefactoredLead | null>(null);
  
  // Use the new refactored leads hook
  const { leads, loading, refetch } = useRefactoredLeads();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Real-time subscriptions are handled by the useRefactoredLeads hook

  // Filter leads based on current filter criteria
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (lead.student?.name || '').toLowerCase().includes(query) ||
          (lead.student?.phone || '').toLowerCase().includes(query) ||
          lead.case_id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      // Loan type filter
      if (loanTypeFilter !== "all" && lead.loan_type.toLowerCase() !== loanTypeFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== "all" && lead.study_destination.toLowerCase() !== countryFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const leadDate = new Date(lead.created_at);
        if (dateRange.from && leadDate < dateRange.from) return false;
        if (dateRange.to && leadDate > dateRange.to) return false;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter, loanTypeFilter, countryFilter, dateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, loanTypeFilter, countryFilter, dateRange]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter !== "all" || loanTypeFilter !== "all" || countryFilter !== "all" || dateRange.from || dateRange.to;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLoanTypeFilter("all");
    setCountryFilter("all");
    setDateRange({});
    setCurrentPage(1);
  };

  const handleStatusUpdate = (lead: RefactoredLead) => {
    setLeadToUpdate(lead);
    setStatusUpdateModalOpen(true);
  };

  const getLoanTypeBadge = (type: string) => {
    return type === 'secured' ? 
      'bg-primary text-primary-foreground' : 
      'bg-secondary text-secondary-foreground';
  };


  const handleViewLead = (lead: RefactoredLead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, phone, case ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} -{" "}
                          {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Pick a date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => setDateRange(range || {})}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="loanType">Loan Type</Label>
              <Select value={loanTypeFilter} onValueChange={setLoanTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="secured">Secured</SelectItem>
                  <SelectItem value="unsecured">Unsecured</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* Country Filter */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                  <SelectItem value="australia">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table or Empty State */}
      {loading ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Leads Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted">
                    <TableHead className="font-semibold">Case ID</TableHead>
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="font-semibold">Loan Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Docs</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Updated</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? "No leads match filters" : "No leads yet"}
          description={
            hasActiveFilters 
              ? "Try adjusting your filters to see more results, or clear all filters to view all leads."
              : "Create your first lead to start managing education loan applications and track their progress through the pipeline."
          }
          action={
            hasActiveFilters 
              ? { label: "Clear Filters", onClick: clearFilters }
              : onNewLead 
                ? { label: "Create First Lead", onClick: onNewLead }
                : undefined
          }
        />
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>
              Leads Overview
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {filteredLeads.length > itemsPerPage ? (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} leads</>
                ) : (
                  <>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</>
                )}
                {hasActiveFilters && <> (filtered from {leads.length} total)</>}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted">
                    <TableHead className="font-semibold">Case ID</TableHead>
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="font-semibold">Loan Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Docs</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Updated</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => {
                    return (
                      <TableRow key={lead.case_id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{lead.case_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.student?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{lead.student?.phone || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getLoanTypeBadge(lead.loan_type.toLowerCase()))}>
                            {lead.loan_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={lead.status as LeadStatus} type="lead" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={lead.documents_status as DocumentStatus} type="document" />
                          </div>
                        </TableCell>
                        <TableCell>₹{(lead.loan_amount / 100000).toFixed(1)}L</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLead(lead)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(lead)}
                              className="h-8 w-8 p-0"
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers with ellipsis logic */}
                  {totalPages <= 7 ? (
                    // Show all pages if 7 or fewer
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))
                  ) : (
                    // Show pages with ellipsis for more than 7 pages
                    <>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          isActive={currentPage === 1}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: 3 }, (_, i) => {
                        const page = currentPage - 1 + i;
                        if (page > 1 && page < totalPages) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      }).filter(Boolean)}
                      
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          isActive={currentPage === totalPages}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      )}

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Status Update Modal */}
      {leadToUpdate && (
        <StatusUpdateModal
          open={statusUpdateModalOpen}
          onOpenChange={setStatusUpdateModalOpen}
          leadId={leadToUpdate.id}
          currentStatus={leadToUpdate.status as LeadStatus}
          currentDocumentsStatus={leadToUpdate.documents_status as DocumentStatus}
          onStatusUpdated={() => {
            refetch();
            setStatusUpdateModalOpen(false);
            setLeadToUpdate(null);
          }}
        />
      )}
    </div>
  );
};