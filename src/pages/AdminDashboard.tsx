import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, DollarSign, Building2, LogOut, Plus, Search, PieChart, Trophy, BarChart3, Clock, CheckCircle, FileCheck, Shield, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { BulkStatusUpdate } from '@/components/lead-status/BulkStatusUpdate';
import { EnhancedAdminLeadActions } from '@/components/admin/EnhancedAdminLeadActions';
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { EnhancedStatusUpdateModal } from '@/components/lead-status/EnhancedStatusUpdateModal';
import { useStatusManager } from '@/hooks/useStatusManager';
import { Checkbox } from '@/components/ui/checkbox';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';
import { useRefactoredLeads } from '@/hooks/useRefactoredLeads';
import { RefactoredLead } from '@/types/refactored-lead';
import { assertAdminRole } from '@/utils/roleCheck';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { useSearchParams } from 'react-router-dom';
import { DatabaseCleanupPanel } from '@/components/admin/DatabaseCleanupPanel';

import { PartnerLeaderboard } from '@/components/gamification/PartnerLeaderboard';
import { AdminActionRequired } from '@/components/gamification/AdminActionRequired';
import { PersonalImpact } from '@/components/gamification/PersonalImpact';
import { DocumentVerificationModal } from '@/components/admin/DocumentVerificationModal';
import UserManagementTab from '@/components/admin/UserManagementTab';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { AdminActionsDrawer } from '@/components/admin/AdminActionsDrawer';
import { AdminActivityBoard } from '@/components/admin/AdminActivityBoard';
import { LenderManagementTab } from '@/components/admin/LenderManagementTab';
import { UniversityCourseImporter } from '@/components/admin/UniversityCourseImporter';

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

// Using RefactoredLead type from shared types
type Lead = RefactoredLead;

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
  const [searchParams] = useSearchParams();
  const showCleanup = searchParams.get('cleanup') === 'true';
  
  // If cleanup mode, render cleanup panel only
  if (showCleanup) {
    return <DatabaseCleanupPanel />;
  }

  const { signOut, appUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const { bulkUpdateStatus } = useStatusManager();
  const tabsRef = useRef<HTMLDivElement>(null);
  const { leads: allLeads, loading: leadsLoading, refetch: refetchLeads } = useRefactoredLeads();
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
  const [showDocVerificationModal, setShowDocVerificationModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentLeadId, setDocumentLeadId] = useState<string | null>(null);


  // Generate leaderboard data from partner stats
  const leaderboardData = partnerStats
    .map(partner => ({
      id: partner.id,
      name: partner.name,
      totalLeads: partner.totalLeads,
      conversionRate: Math.min(Math.round((partner.totalLeads * 0.7) + Math.random() * 20), 95),
      rank: 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .map((partner, index) => ({ ...partner, rank: index + 1 }))
    .slice(0, 5);

  const handleReviewLead = (leadId: string) => {
    const lead = recentLeads.find(l => l.id === leadId);
    if (lead) {
      handleViewLead(lead);
    }
  };

  const handleVerifyDocument = async (documentId: string, leadId: string) => {
    try {
      const { data: document } = await supabase
        .from('lead_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        setSelectedDocument(document);
        setDocumentLeadId(leadId);
        setShowDocVerificationModal(true);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document details',
        variant: 'destructive',
      });
    }
  };

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
          leads_new!leads_new_partner_id_fkey (
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
      console.log('🔍 [AdminDash] fetchRecentLeads called with:', {
        allLeadsCount: allLeads.length,
        selectedPartner
      });
      
      // Filter leads from the hook based on selected partner
      let leads = allLeads;
      
      if (selectedPartner !== 'all') {
        leads = allLeads.filter(lead => lead.partner?.id === selectedPartner);
        console.log(`📊 [AdminDash] Filtered by partner: ${leads.length} leads`);
      }
      
      // Sort by created_at descending and limit to 20
      leads = leads
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      
      console.log('✅ [AdminDash] Recent leads set:', leads.length);
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
    console.log('🔍 [AdminDash] filterLeads called:', {
      inputLeadsCount: leads.length,
      searchTerm
    });
    
    if (!searchTerm.trim()) {
      console.log('✅ [AdminDash] No search term, showing all:', leads.length);
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter(lead => 
      lead.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.partner?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('✅ [AdminDash] Filtered leads:', filtered.length);
    setFilteredLeads(filtered);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAdminKPIs(),
          fetchPartnerStats(),
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

  // Separate effect for recent leads that depends on allLeads
  useEffect(() => {
    if (!leadsLoading && allLeads.length > 0) {
      fetchRecentLeads();
    }
  }, [allLeads, leadsLoading, selectedPartner]);

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

  const handleQuickStatusUpdate = (lead: Lead) => {
    setQuickUpdateLead(lead);
    setShowStatusUpdateModal(true);
  };

  const handleStatusUpdated = async () => {
    try {
      // Refresh all relevant data after status update
      await Promise.all([
        fetchRecentLeads(),
        fetchAdminKPIs(),
        fetchPartnerStats(),
        fetchLoanComparison()
      ]);
      
      // Clear selections and reset states
      setSelectedLeads([]);
      setQuickUpdateLead(null);
      setShowStatusUpdateModal(false);
      
      // Show success feedback
      toast({
        title: 'Dashboard Updated',
        description: 'All data has been refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Refresh Error',
        description: 'Some data may not be up to date',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Longer delay to ensure drawer closes and tab content is rendered
    setTimeout(() => {
      if (tabsRef.current) {
        // Scroll with offset to account for header
        const yOffset = -20; // Small offset from top
        const element = tabsRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 350);
  };

  // Wrapper functions for AdminActivityBoard callbacks
  const handleViewLeadById = (leadId: string) => {
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      handleViewLead(lead);
    }
  };

  const handleQuickStatusUpdateById = (leadId: string) => {
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      handleQuickStatusUpdate(lead);
    }
  };

  // No conversion needed - already using RefactoredLead

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Skeleton className="h-8 w-64 animate-shimmer" />
              <Skeleton className="h-10 w-24 animate-shimmer" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className={`h-32 animate-shimmer stagger-fade-${i + 1 as 1 | 2 | 3 | 4}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type guard for admin role
  if (!appUser || !assertAdminRole(appUser.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-card to-card/50 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AdminActionsDrawer
                userRole={appUser.role as 'admin' | 'super_admin'}
                activeTab={activeTab}
                onCreatePartner={() => setShowCreatePartner(true)}
                onSignOut={signOut}
                onTabChange={handleTabChange}
              />
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Monitor and manage all leads and partners</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-8 pb-12">
        <div className="space-y-8">
            {/* Compact Welcome */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-8 border border-primary/20 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Welcome back, Admin!
                  </h2>
                  <p className="text-muted-foreground mt-1">System Overview & Performance</p>
                </div>
              </div>
            </div>

            {/* Strategic KPI Cards - Single Row with Staggered Animation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="hover-lift stagger-fade-1 border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-2">All partners</p>
                </CardContent>
              </Card>

              <Card className="hover-lift stagger-fade-2 border-l-4 border-l-success/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Building2 className="h-4 w-4 text-success" />
                    </div>
                    Active Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{kpis.totalPartners}</div>
                  <p className="text-xs text-muted-foreground mt-2">Contributing</p>
                </CardContent>
              </Card>

              <Card className="hover-lift stagger-fade-3 border-l-4 border-l-accent/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <DollarSign className="h-4 w-4 text-accent" />
                    </div>
                    Pipeline Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-accent">{formatCurrency(loanComparison.pipeline)}</div>
                  <p className="text-xs text-muted-foreground mt-2">{kpis.inPipeline} leads</p>
                </CardContent>
              </Card>

              <Card className="hover-lift stagger-fade-4 border-l-4 border-l-warning/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TrendingUp className="h-4 w-4 text-warning" />
                    </div>
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">{loanComparison.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-2">{kpis.sanctioned} approved</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <div ref={tabsRef}>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className={`grid w-full ${appUser?.role === 'super_admin' ? 'grid-cols-7' : 'grid-cols-5'} max-w-6xl`}>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger value="lenders" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Lenders
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                {appUser?.role === 'super_admin' && (
                  <>
                    <TabsTrigger value="import" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Data Import
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Audit
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Activity Board */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Live feed of lead activities and status changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdminActivityBoard
                        onViewLead={handleViewLeadById}
                        onUpdateStatus={handleQuickStatusUpdateById}
                        onVerifyDocument={handleVerifyDocument}
                      />
                    </CardContent>
                  </Card>

                  {/* Actionable Insights Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Lead Pipeline Breakdown */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Pipeline Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {(() => {
                            const statusCounts = recentLeads.reduce((acc, lead) => {
                              acc[lead.status] = (acc[lead.status] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            const statusOrder = ['new', 'in_progress', 'approved', 'rejected'];
                            const statusLabels: Record<string, string> = {
                              new: 'New',
                              in_progress: 'In Progress',
                              approved: 'Approved',
                              rejected: 'Rejected'
                            };
                            
                            return statusOrder.map((status) => {
                              const count = statusCounts[status] || 0;
                              const percentage = kpis.totalLeads > 0 ? Math.round((count / kpis.totalLeads) * 100) : 0;
                              
                              return (
                                <div key={status}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">{statusLabels[status]}</span>
                                    <span className="font-medium">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        status === 'new' ? 'bg-primary' :
                                        status === 'in_progress' ? 'bg-warning' :
                                        status === 'approved' ? 'bg-success' :
                                        'bg-destructive'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Partner Performance Summary */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                          <Trophy className="h-4 w-4 text-warning" />
                          Top Performers
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {partnerStats
                            .sort((a, b) => b.totalLeads - a.totalLeads)
                            .slice(0, 3)
                            .map((partner, index) => (
                              <div key={partner.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 flex items-center justify-center p-0 text-xs">
                                    {index + 1}
                                  </Badge>
                                  <span className="text-sm font-medium truncate">{partner.name}</span>
                                </div>
                                <span className="text-sm font-bold">{partner.totalLeads}</span>
                              </div>
                            ))}
                          {partnerStats.length === 0 && (
                            <p className="text-xs text-muted-foreground">No partner data</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Status Overview */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                          <FileCheck className="h-4 w-4 text-accent-foreground" />
                          Document Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {(() => {
                            const docCounts = recentLeads.reduce((acc, lead) => {
                              acc[lead.documents_status] = (acc[lead.documents_status] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            const docStatuses = [
                              { key: 'pending', label: 'Pending', color: 'text-warning' },
                              { key: 'verified', label: 'Verified', color: 'text-success' },
                              { key: 'rejected', label: 'Rejected', color: 'text-destructive' },
                            ];
                            
                            return docStatuses.map(({ key, label, color }) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}:</span>
                                <span className={`font-semibold ${color}`}>{docCounts[key] || 0}</span>
                              </div>
                            ));
                          })()}
                          <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">{recentLeads.length}</span>
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
                    <div className="grid grid-cols-10 gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
                      <div className="col-span-2">Student</div>
                      <div className="col-span-2">Partner</div>
                      <div className="col-span-1">Destination</div>
                      <div className="col-span-1">Lender</div>
                      <div className="col-span-2">Loan Amount</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Date</div>
                    </div>
                    {/* Data Rows */}
                    {recentLeads.slice(0, 8).map((lead) => (
                      <div 
                        key={lead.id} 
                        className="grid grid-cols-10 gap-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded cursor-pointer group"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowLeadDetailSheet(true);
                        }}
                      >
                        <div className="col-span-2">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{lead.student?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.student?.email}</p>
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="text-xs">
                            {lead.partner?.name}
                          </Badge>
                        </div>
                        <div className="col-span-1">
                          <p className="text-sm">{lead.study_destination}</p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs truncate">{lead.lender?.name || 'N/A'}</p>
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
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
                </div>
              </TabsContent>

              <TabsContent value="lenders" className="space-y-6 mt-6">
                <LenderManagementTab />
              </TabsContent>

              <TabsContent value="partners" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Partner Management
                      </CardTitle>
                      <CardDescription>Manage and monitor partner performance</CardDescription>
                    </div>
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
                    <div key={partner.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200 gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: <Badge variant="secondary" className="text-xs">{partner.partner_code}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last Activity: {partner.recentActivity}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <div className="text-lg font-bold text-foreground">{partner.totalLeads}</div>
                          <p className="text-xs text-muted-foreground">Total Leads</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/partner/${partner.partner_code}`, '_blank')}
                          className="gap-1 hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
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

              <TabsContent value="leads" className="space-y-6 mt-6">
                <Card>
            <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>View and search leads across all partners</CardDescription>
              </div>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by partner" />
                </SelectTrigger>
                <SelectContent>
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
              <div className="flex flex-col lg:flex-row gap-4">
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
                        <h3 className="font-semibold text-foreground">{lead.student?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.student?.email}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Case: {lead.case_id}</span>
                          <span>•</span>
                          <span>Partner: {lead.partner?.name}</span>
                          <span>•</span>
                          <span>Lender: {lead.lender?.name || 'N/A'}</span>
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

              <TabsContent value="users" className="space-y-6 mt-6">
              <UserManagementTab
                currentUserRole={appUser.role as 'admin' | 'super_admin'}
                currentUserId={appUser.id}
              />
              </TabsContent>

              {appUser.role === 'super_admin' && (
                <>
                  <TabsContent value="import" className="space-y-6 mt-6">
                    <UniversityCourseImporter />
                  </TabsContent>
                  
                  <TabsContent value="audit" className="space-y-6 mt-6">
                    <AuditLogViewer />
                  </TabsContent>
                </>
              )}
            </Tabs>
            </div>
        </div>
      </div>

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
        <EnhancedStatusUpdateModal
          open={showStatusUpdateModal}
          onOpenChange={setShowStatusUpdateModal}
          leadId={quickUpdateLead.id}
          currentStatus={quickUpdateLead.status as LeadStatus}
          currentDocumentsStatus={quickUpdateLead.documents_status as DocumentStatus}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* Document Verification Modal */}
      {selectedDocument && documentLeadId && (
        <DocumentVerificationModal
          open={showDocVerificationModal}
          onOpenChange={setShowDocVerificationModal}
          document={selectedDocument}
          onVerificationComplete={async () => {
            setShowDocVerificationModal(false);
            setSelectedDocument(null);
            setDocumentLeadId(null);
            await Promise.all([
              fetchRecentLeads(),
              fetchAdminKPIs(),
            ]);
            toast({
              title: 'Document Updated',
              description: 'Document verification status has been updated',
            });
          }}
        />
      )}
    </div>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;