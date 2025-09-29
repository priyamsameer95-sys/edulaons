import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, DollarSign, Building2, LogOut, Plus, Search, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import CreatePartnerModal from '@/components/admin/CreatePartnerModal';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [statusData, setStatusData] = useState<Array<{name: string, value: number, color: string}>>([]);

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
        .limit(20);

      if (selectedPartner !== 'all') {
        query.eq('partner_id', selectedPartner);
      }

      const { data } = await query;
      const leads = data || [];
      setRecentLeads(leads);
      
      // Filter leads based on search term
      filterLeads(leads);
      
      // Calculate status distribution for chart
      const statusCounts: Record<string, number> = {};
      leads.forEach(lead => {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      });

      const chartData = Object.entries(statusCounts).map(([status, count], index) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'][index] || '#6b7280'
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

      {/* Simple KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalPartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Partner organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.inPipeline}</div>
            <p className="text-xs text-muted-foreground mt-1">New + In Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.totalLoanAmount)}</div>
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lead Status Chart - Only Essential Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Lead Status
                </CardTitle>
                <CardDescription>Current lead distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {statusData.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: { label: "Leads", color: "hsl(var(--primary))" }
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
                {statusData.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {statusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest submissions across all partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLeads.slice(0, 6).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{lead.students?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.partners?.name} • {lead.case_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
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
                    <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {partner.partner_code} • Last Activity: {partner.recentActivity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{partner.totalLeads}</div>
                          <p className="text-xs text-muted-foreground">Total Leads</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/partner/${partner.partner_code}`, '_blank')}
                          className="gap-1"
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>View and search leads across all partners</CardDescription>
              </div>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-48">
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
              {/* Simple Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, email, or case ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Results */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchTerm ? 'No leads match your search' : 'No leads found'}</p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{lead.students?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.students?.email} • Case: {lead.case_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Partner: {lead.partners?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
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