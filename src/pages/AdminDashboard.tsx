import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, DollarSign, Building2, LogOut, Plus, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import EnhancedKPICards from '@/components/admin/EnhancedKPICards';
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';
import LeadFilters, { LeadFilters as LeadFiltersType } from '@/components/admin/LeadFilters';

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
  loan_amount: number;
  created_at: string;
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
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [activeFilters, setActiveFilters] = useState<LeadFiltersType>({
    search: '',
    partnerId: 'all',
    status: 'all',
    loanAmountMin: '',
    loanAmountMax: '',
    dateFrom: undefined,
    dateTo: undefined,
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
    } catch (error) {
      console.error('Error fetching partner stats:', error);
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
          loan_amount,
          created_at,
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
        .limit(50);

      if (selectedPartner !== 'all') {
        query.eq('partner_id', selectedPartner);
      }

      const { data } = await query;
      setRecentLeads(data || []);
      applyFilters(data || [], activeFilters);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
    }
  };

  const applyFilters = (leads: Lead[], filters: LeadFiltersType) => {
    let filtered = [...leads];

    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.students?.name.toLowerCase().includes(searchLower) ||
        lead.students?.email.toLowerCase().includes(searchLower) ||
        lead.case_id.toLowerCase().includes(searchLower) ||
        lead.partners?.name.toLowerCase().includes(searchLower)
      );
    }

    // Partner filter
    if (filters.partnerId !== 'all') {
      filtered = filtered.filter(lead => 
        partnerStats.find(p => p.id === filters.partnerId)?.partner_code === lead.partners?.partner_code
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Loan amount filter
    if (filters.loanAmountMin) {
      filtered = filtered.filter(lead => Number(lead.loan_amount) >= Number(filters.loanAmountMin));
    }
    if (filters.loanAmountMax) {
      filtered = filtered.filter(lead => Number(lead.loan_amount) <= Number(filters.loanAmountMax));
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(lead => new Date(lead.created_at) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(lead => new Date(lead.created_at) <= dateTo);
    }

    setFilteredLeads(filtered);
  };

  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setActiveFilters(newFilters);
    applyFilters(recentLeads, newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.search.trim()) count++;
    if (activeFilters.partnerId !== 'all') count++;
    if (activeFilters.status !== 'all') count++;
    if (activeFilters.loanAmountMin) count++;
    if (activeFilters.loanAmountMax) count++;
    if (activeFilters.dateFrom) count++;
    if (activeFilters.dateTo) count++;
    return count;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAdminKPIs(),
        fetchPartnerStats(),
        fetchRecentLeads(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, [selectedPartner]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'disbursed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {appUser?.email} • Role: {appUser?.role}
          </p>
        </div>
        <Button onClick={signOut} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Enhanced KPI Cards */}
      <EnhancedKPICards kpis={kpis} />

      {/* Analytics Charts */}
      <AdminDashboardCharts />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card border-0">
              <CardHeader>
                <CardTitle>Partner Performance</CardTitle>
                <CardDescription>Top performing partners by lead volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerStats.slice(0, 5).map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {partner.partner_code}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{partner.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {partner.recentActivity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-0 text-white">
              <div className="absolute inset-0 bg-black/10 rounded-lg" />
              <CardHeader className="relative">
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-white/80">Latest lead submissions</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {recentLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{lead.students?.name}</p>
                        <p className="text-sm text-white/80">
                          {lead.partners?.name} • {lead.case_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                          {lead.status}
                        </Badge>
                        <p className="text-sm text-white/80 mt-1">
                          {formatCurrency(Number(lead.loan_amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AdminDashboardCharts />
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
              <div className="grid gap-4 md:grid-cols-2">
                {partnerStats.map((partner) => (
                  <div key={partner.id} className="relative overflow-hidden bg-gradient-card p-6 border-0 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{partner.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          Code: {partner.partner_code}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Last Activity: {partner.recentActivity}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div>
                            <div className="text-2xl font-bold text-primary">{partner.totalLeads}</div>
                            <p className="text-xs text-muted-foreground">Total Leads</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">{partner.activeLenders}</div>
                            <p className="text-xs text-muted-foreground">Active Lenders</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/partner/${partner.partner_code}`, '_blank')}
                        className="gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        View Dashboard
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <LeadFilters 
            partners={partnerStats} 
            onFiltersChange={handleFiltersChange}
            activeFiltersCount={getActiveFiltersCount()}
          />
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filtered Results</CardTitle>
                  <CardDescription>
                    Showing {filteredLeads.length} of {recentLeads.length} leads
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {filteredLeads.length} leads
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No leads match your current filters</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{lead.students?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.students?.email} • Case: {lead.case_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Partner: {lead.partners?.name} • Lender: {lead.lenders?.name}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium">
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
    </div>
  );
};

export default AdminDashboard;