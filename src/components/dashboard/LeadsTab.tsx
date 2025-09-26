import { useState, useEffect } from "react";
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
  CalendarIcon, 
  Search, 
  Filter, 
  Eye,
  FileCheck,
  FileWarning,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lead, DbLead, mapDbLeadToLead } from "@/types/lead";

interface LeadsTabProps {
  onNewLead?: () => void;
}

export const LeadsTab = ({ onNewLead }: LeadsTabProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch leads",
          variant: "destructive",
        });
        return;
      }

      // Map database leads to display leads
      const mappedLeads = (data as DbLead[] || []).map(mapDbLeadToLead);
      setLeads(mappedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error", 
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription for new leads
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('New lead created:', payload.new);
          const newLead = mapDbLeadToLead(payload.new as DbLead);
          setLeads(current => [newLead, ...current]);
          toast({
            title: "New Lead Created",
            description: `Lead ${newLead.case_id} has been added`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead updated:', payload.new);
          const updatedLead = mapDbLeadToLead(payload.new as DbLead);
          setLeads(current => 
            current.map(lead => 
              lead.id === updatedLead.id ? updatedLead : lead
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Debug: Log current leads state
  console.log('Current leads in state:', leads.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      // Success States
      case 'sanctioned': return 'bg-success text-success-foreground';
      case 'disbursed': return 'bg-success text-success-foreground';
      case 'login_confirmed': return 'bg-success text-success-foreground';
      
      // In Progress States  
      case 'qualified': return 'bg-primary text-primary-foreground';
      case 'docs_verified': return 'bg-primary text-primary-foreground';
      case 'applied': return 'bg-primary text-primary-foreground';
      
      // Pending States
      case 'new': return 'bg-warning text-warning-foreground';
      case 'docs_pending': return 'bg-warning text-warning-foreground';
      case 'future_intake': return 'bg-warning text-warning-foreground';
      case 'intake_deferred': return 'bg-warning text-warning-foreground';
      
      // Negative States
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'lost_to_competitor': return 'bg-destructive text-destructive-foreground';
      case 'sanctioned_declined': return 'bg-destructive text-destructive-foreground';
      case 'login_rejected': return 'bg-destructive text-destructive-foreground';
      
      // Neutral/Other States
      case 'loan_via_us_other_lender': return 'bg-secondary text-secondary-foreground';
      case 'self_funding': return 'bg-secondary text-secondary-foreground';
      case 'duplicate_lead': return 'bg-secondary text-secondary-foreground';
      case 'relook_reopened': return 'bg-secondary text-secondary-foreground';
      
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLoanTypeBadge = (type: string) => {
    return type === 'secured' ? 
      'bg-primary text-primary-foreground' : 
      'bg-secondary text-secondary-foreground';
  };

  const getDocsProgress = (documentsStatus: string) => {
    switch (documentsStatus) {
      case 'verified':
        return { icon: CheckCircle, color: "text-success" };
      case 'pending':
        return { icon: Clock, color: "text-warning" };
      case 'rejected':
        return { icon: XCircle, color: "text-destructive" };
      default:
        return { icon: FileWarning, color: "text-muted-foreground" };
    }
  };

  const handleViewLead = (lead: Lead) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="docs_pending">Docs Pending</SelectItem>
                  <SelectItem value="docs_verified">Docs Verified</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="sanctioned">Sanctioned</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                  <SelectItem value="login_confirmed">Login Confirmed</SelectItem>
                  <SelectItem value="login_rejected">Login Rejected</SelectItem>
                  <SelectItem value="lost_to_competitor">Lost to Competitor</SelectItem>
                  <SelectItem value="intake_deferred">Intake Deferred</SelectItem>
                  <SelectItem value="loan_via_us_other_lender">Loan via Us (Other Lender)</SelectItem>
                  <SelectItem value="future_intake">Future Intake</SelectItem>
                  <SelectItem value="sanctioned_declined">Sanctioned Declined</SelectItem>
                  <SelectItem value="self_funding">Self Funding</SelectItem>
                  <SelectItem value="duplicate_lead">Duplicate Lead</SelectItem>
                  <SelectItem value="relook_reopened">Relook/Re-opened</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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

            {/* Lender Filter */}
            <div className="space-y-2">
              <Label htmlFor="lender">Lender</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Lenders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lenders</SelectItem>
                  <SelectItem value="hdfc">HDFC Bank</SelectItem>
                  <SelectItem value="icici">ICICI Bank</SelectItem>
                  <SelectItem value="sbi">SBI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select>
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
                    <TableHead className="font-semibold">Lender</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Create your first lead to start managing education loan applications and track their progress through the pipeline."
          action={onNewLead ? {
            label: "Create First Lead",
            onClick: onNewLead
          } : undefined}
        />
      ) : (
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
                    <TableHead className="font-semibold">Lender</TableHead>
                    <TableHead className="font-semibold">Loan Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Docs</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Updated</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const docsProgress = getDocsProgress(lead.documents_status);
                    const IconComponent = docsProgress.icon;
                    
                    return (
                      <TableRow key={lead.case_id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{lead.case_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.student_name}</div>
                            <div className="text-sm text-muted-foreground">{lead.student_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{lead.lender}</TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getLoanTypeBadge(lead.loan_type.toLowerCase()))}>
                            {lead.loan_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getStatusColor(lead.status))}>
                            {lead.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <IconComponent className={cn("h-4 w-4", docsProgress.color)} />
                            <span className="text-sm capitalize">
                              {lead.documents_status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>₹{(lead.loan_amount / 100000).toFixed(1)}L</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLead(lead)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
};