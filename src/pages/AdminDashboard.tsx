import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, DollarSign, Building2, LogOut, Plus, Search, PieChart, Trophy, BarChart3, Clock, CheckCircle, FileCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { BulkStatusUpdate } from '@/components/lead-status/BulkStatusUpdate';
import { AdminLeadActions } from '@/components/admin/AdminLeadActions';
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { StatusUpdateModal } from '@/components/lead-status/StatusUpdateModal';
import { Checkbox } from '@/components/ui/checkbox';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

interface AdminKPIs {
  totalLeads: number;
  totalPartners: number;
  inPipeline: number;
  sanctioned: number;
  disbursed: number;
  totalLoanAmount: number;
}

interface PartnerStats {
  id: string;
  name: string;
  partner_code: string;
  totalLeads: number;
  activeLenders: number;
  recentActivity: string;
}

interface Lead {
  id: string;
  case_id: string;
  status: string;
  documents_status: string;
  loan_amount: number;
  loan_type: string;
  study_destination: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  partner_name: string;
  students: {
    name: string;
    email: string;
  };
  partners: {
    name: string;
    partner_code: string;
  };
  lenders: {
    name: string;
  };
}

interface TopPartnerData {
  name: string;
  total_leads: number;
  percentage: number;
}

interface LoanAmountComparison {
  pipeline: number;
  sanctioned: number;
  conversionRate: number;
}

const AdminDashboard = () => {
  const { signOut, appUser } = useAuth();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKPIs>({
    totalLeads: 0,
    totalPartners: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
    totalLoanAmount: 0,
  });
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetailSheet, setShowLeadDetailSheet] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [quickUpdateLead, setQuickUpdateLead] = useState<Lead | null>(null);
  const [statusData, setStatusData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [topPartner, setTopPartner] = useState<TopPartnerData | null>(null);
  const [loanComparison, setLoanComparison] = useState<LoanAmountComparison>({
    pipeline: 0,
    sanctioned: 0,
    conversionRate: 0
  });

  const fetchAdminKPIs = async () => {
    try {
      // Fetch total leads count
      const { count: totalLeads } = await supabase
        .from('leads_new')
        .select('*', { count: 'exact', head: true });

      // Fetch total partners count
      const { count: totalPartners } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });

      // Fetch leads by status
      const { data: leadsByStatus } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      let inPipeline = 0, sanctioned = 0, disbursed = 0, totalLoanAmount = 0;

      leadsByStatus?.forEach((lead) => {
        totalLoanAmount += Number(lead.loan_amount) || 0;
        
        switch (lead.status) {
          case 'new':
          case 'in_progress':
            inPipeline++;
            break;
          case 'approved':
            sanctioned++;
            break;
          // Note: 'disbursed' status doesn't exist in current enum, removing for now
        }
      });

      setKpis({
        totalLeads: totalLeads || 0,
        totalPartners: totalPartners || 0,
        inPipeline,
        sanctioned,
        disbursed,
        totalLoanAmount,
      });
    } catch (error) {
      console.error('Error fetching admin KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const fetchPartnerStats = async () => {
    try {
      const { data: partners } = await supabase
        .from('partners')
        .select(`
          id,
          name,
          partner_code,
          leads_new!partner_id (
            id,
            status,
            created_at
          )
        `);

      const stats: PartnerStats[] = partners?.map((partner) => ({
        id: partner.id,
        name: partner.name,
        partner_code: partner.partner_code,
        totalLeads: partner.leads_new.length,
        activeLenders: 1, // Simplified for now
        recentActivity: partner.leads_new.length > 0 
          ? new Date(partner.leads_new[0].created_at).toLocaleDateString()
          : 'No activity',
      })) || [];

      setPartnerStats(stats);

      // Calculate top partner
      if (stats.length > 0) {
        const topPartnerData = stats.reduce((max, partner) => 
          partner.totalLeads > max.totalLeads ? partner : max
        );
        const totalLeads = stats.reduce((sum, partner) => sum + partner.totalLeads, 0);
        
        setTopPartner({
          name: topPartnerData.name,
          total_leads: topPartnerData.totalLeads,
          percentage: totalLeads > 0 ? Math.round((topPartnerData.totalLeads / totalLeads) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching partner stats:', error);
    }
  };

  const fetchLoanComparison = async () => {
    try {
      const { data: leads } = await supabase
        .from('leads_new')
        .select('status, loan_amount');

      let pipelineAmount = 0;
      let sanctionedAmount = 0;

      leads?.forEach((lead) => {
        const amount = Number(lead.loan_amount) || 0;
        if (lead.status === 'new' || lead.status === 'in_progress') {
          pipelineAmount += amount;
        } else if (lead.status === 'approved') {
          sanctionedAmount += amount;
        }
      });

      const conversionRate = pipelineAmount > 0 ? 
        Math.round((sanctionedAmount / (pipelineAmount + sanctionedAmount)) * 100) : 0;

      setLoanComparison({
        pipeline: pipelineAmount,
        sanctioned: sanctionedAmount,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching loan comparison:', error);
    }
  };

  const fetchRecentLeads = async () => {
    try {
      const query = supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          status,
          documents_status,
          loan_amount,
          loan_type,
          study_destination,
          created_at,
          updated_at,
          students (
            name,
            email
          ),
          partners (
            name,
            partner_code
          ),
          lenders (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (selectedPartner !== 'all') {
        query.eq('partner_id', selectedPartner);
      }

      const { data } = await query;
      const leads = (data || []).map(lead => ({
        ...lead,
        student_name: lead.students?.name || 'N/A',
        partner_name: lead.partners?.name || 'N/A'
      }));
      setRecentLeads(leads);
      
      // Filter leads based on search term
      filterLeads(leads);
      
      // Calculate status distribution for chart
      const statusCounts: Record<string, number> = {};
      leads.forEach(lead => {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      });

      const statusColors = {
        'new': 'hsl(var(--primary))',
        'in_progress': 'hsl(var(--warning))',
        'approved': 'hsl(var(--success))',
        'rejected': 'hsl(var(--destructive))',
        'disbursed': 'hsl(var(--accent))'
      };

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: statusColors[status as keyof typeof statusColors] || 'hsl(var(--muted-foreground))'
      }));
      
      setStatusData(chartData);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    }
  };

  const filterLeads = (leads: Lead[]) => {
    if (!searchTerm.trim()) {
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter(lead => 
      lead.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.students?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.partners?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredLeads(filtered);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAdminKPIs(),
          fetchPartnerStats(),
          fetchRecentLeads(),
          fetchLoanComparison(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPartner]);

  useEffect(() => {
    filterLeads(recentLeads);
  }, [searchTerm, recentLeads]);

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetailSheet(true);
  };

  const handleQuickStatusUpdate = (lead: Lead, newStatus: LeadStatus) => {
    setQuickUpdateLead(lead);
    setShowStatusUpdateModal(true);
  };

  const handleStatusUpdated = async () => {
    // Refresh all relevant data after status update
    await Promise.all([
      fetchRecentLeads(),
      fetchAdminKPIs(),
      fetchPartnerStats(),
      fetchLoanComparison()
    ]);
    setSelectedLeads([]); // Clear selections after update
    
    // Show success feedback
    toast({
      title: 'Success',
      description: 'Lead status updated and dashboard refreshed',
    });
  };

  // Convert Lead to RefactoredLead format for AdminLeadActions
  const convertToRefactoredLead = (lead: Lead) => ({
    id: lead.id,
    case_id: lead.case_id,
    student_id: lead.id, // Using lead id as fallback
    co_applicant_id: lead.id, // Using lead id as fallback
    partner_id: lead.partners?.name || null,
    lender_id: lead.lenders?.name || '',
    loan_amount: Number(lead.loan_amount),
    loan_type: lead.loan_type as 'secured' | 'unsecured',
    study_destination: lead.study_destination as any,
    intake_month: null, // Not available in current Lead interface
    intake_year: null, // Not available in current Lead interface
    status: lead.status as any,
    documents_status: lead.documents_status as any,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    student: {
      id: lead.id,
      name: lead.students?.name || '',
      email: lead.students?.email || '',
      phone: '',
      date_of_birth: null,
      nationality: null,
      street_address: null,
      city: null,
      state: null,
      country: null,
      postal_code: null,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    },
    partner: lead.partners ? {
      id: lead.id,
      name: lead.partners.name,
      email: '',
      phone: null,
      address: null,
      is_active: true,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    } : undefined,
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {appUser?.email} • <Badge variant="secondary">{appUser?.role}</Badge>
          </p>
        </div>
        <Button onClick={signOut} variant="outline" className="hover:bg-destructive hover:text-destructive-foreground transition-colors">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all partners</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.totalPartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Partner organizations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Pipeline</CardTitle>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.inPipeline}</div>
            <p className="text-xs text-muted-foreground mt-1">New + In Progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Value</CardTitle>
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(kpis.totalLoanAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sanctioned: {kpis.sanctioned}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Compact Overview Cards - Full Width */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Top Partner Card - Compact */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Trophy className="h-4 w-4 text-warning" />
                    Top Partner
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {topPartner ? (
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-foreground">{topPartner.name}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Leads:</span>
                        <span className="font-semibold">{topPartner.total_leads}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Share:</span>
                        <Badge variant="secondary" className="text-xs">{topPartner.percentage}%</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No data available</div>
                  )}
                </CardContent>
              </Card>

              {/* Pipeline Overview */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(loanComparison.pipeline)}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (loanComparison.pipeline / (loanComparison.pipeline || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Total in pipeline</p>
                  </div>
                </CardContent>
              </Card>

              {/* Sanctioned Overview */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Sanctioned
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-success">
                      {formatCurrency(loanComparison.sanctioned)}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-success h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${loanComparison.conversionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{loanComparison.conversionRate}% conversion</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-accent-foreground" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active:</span>
                      <span className="font-semibold">{kpis.inPipeline}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Partners:</span>
                      <span className="font-semibold">{kpis.totalPartners}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold">{kpis.totalLeads}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Full Width Table Style */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-accent-foreground" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest lead submissions across all partners</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {recentLeads.length} active leads
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
                      <div className="col-span-2">Student</div>
                      <div className="col-span-2">Partner</div>
                      <div className="col-span-1">Destination</div>
                      <div className="col-span-2">Loan Amount</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Date</div>
                      <div className="col-span-3">Actions</div>
                    </div>
                    {/* Data Rows */}
                    {recentLeads.slice(0, 8).map((lead) => (
                      <div key={lead.id} className="grid grid-cols-12 gap-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors rounded">
                        <div className="col-span-2">
                          <p className="font-medium text-sm truncate">{lead.students?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.students?.email}</p>
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="text-xs">
                            {lead.partners?.name}
                          </Badge>
                        </div>
                        <div className="col-span-1">
                          <p className="text-sm">{lead.study_destination}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-semibold text-sm">
                            {formatCurrency(Number(lead.loan_amount))}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <StatusBadge status={lead.status as LeadStatus} type="lead" className="text-xs" />
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-3">
                          <AdminLeadActions
                            lead={convertToRefactoredLead(lead)}
                            documentCount={0}
                            onViewDetails={(refactoredLead) => handleViewLead(lead)}
                            onStatusUpdate={(refactoredLead, newStatus) => handleQuickStatusUpdate(lead, newStatus)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Partner Management
                </CardTitle>
                <CardDescription>Manage and monitor partner performance</CardDescription>
              </div>
              <Button onClick={() => setShowCreatePartner(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Partner
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partnerStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No partners found</p>
                  </div>
                ) : (
                  partnerStats.map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: <Badge variant="secondary" className="text-xs">{partner.partner_code}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last Activity: {partner.recentActivity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">{partner.totalLeads}</div>
                          <p className="text-xs text-muted-foreground">Total Leads</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/partner/${partner.partner_code}`, '_blank')}
                          className="gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>View and search leads across all partners</CardDescription>
              </div>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by partner" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="all">All Partners</SelectItem>
                  {partnerStats.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Bulk Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, email, or case ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {selectedLeads.length > 0 && (
                  <Button
                    onClick={() => setShowBulkUpdate(true)}
                    className="flex items-center gap-2"
                  >
                    <FileCheck className="h-4 w-4" />
                    Update Status ({selectedLeads.length})
                  </Button>
                )}
              </div>

              {/* Select All Option */}
              {filteredLeads.length > 0 && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all {filteredLeads.length} leads
                  </span>
                </div>
              )}

              {/* Results */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchTerm ? 'No leads match your search' : 'No leads found'}</p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div key={lead.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-foreground">{lead.students?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.students?.email}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Case: {lead.case_id}</span>
                          <span>•</span>
                          <span>Partner: {lead.partners?.name}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <StatusBadge status={lead.status as LeadStatus} type="lead" />
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(Number(lead.loan_amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Partner Modal */}
      <CreatePartnerModal 
        open={showCreatePartner}
        onOpenChange={setShowCreatePartner}
        onPartnerCreated={() => {
          fetchPartnerStats();
          setShowCreatePartner(false);
        }}
      />

      {/* Bulk Status Update Modal */}
      <BulkStatusUpdate
        open={showBulkUpdate}
        onOpenChange={setShowBulkUpdate}
        leadIds={selectedLeads}
        onStatusUpdated={() => {
          setSelectedLeads([]);
          setShowBulkUpdate(false);
          fetchRecentLeads();
        }}
      />

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        open={showLeadDetailSheet}
        onOpenChange={setShowLeadDetailSheet}
        lead={selectedLead}
        onLeadUpdated={handleStatusUpdated}
      />

      {/* Quick Status Update Modal */}
      {quickUpdateLead && (
        <StatusUpdateModal
          open={showStatusUpdateModal}
          onOpenChange={setShowStatusUpdateModal}
          leadId={quickUpdateLead.id}
          currentStatus={quickUpdateLead.status as LeadStatus}
          currentDocumentsStatus={quickUpdateLead.documents_status as DocumentStatus}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;