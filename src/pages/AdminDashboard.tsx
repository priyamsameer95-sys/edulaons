import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, DollarSign, Building2, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

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
        .limit(10);

      if (selectedPartner !== 'all') {
        query.eq('partner_id', selectedPartner);
      }

      const { data } = await query;
      setRecentLeads(data || []);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
    }
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Across all partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              Partner organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.inPipeline}</div>
            <p className="text-xs text-muted-foreground">
              New + In Progress leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalLoanAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sanctioned: {kpis.sanctioned} • Disbursed: {kpis.disbursed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Partner Performance</CardTitle>
                <CardDescription>Top performing partners by lead volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerStats.slice(0, 5).map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {partner.partner_code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{partner.totalLeads} leads</p>
                        <p className="text-sm text-muted-foreground">
                          Last activity: {partner.recentActivity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest lead submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lead.students?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.partners?.name} • {lead.case_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
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
            <CardHeader>
              <CardTitle>Partner Management</CardTitle>
              <CardDescription>Manage and monitor partner performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partnerStats.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Partner Code: {partner.partner_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last Activity: {partner.recentActivity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{partner.totalLeads}</p>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>View and manage leads across all partners</CardDescription>
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
            <CardContent>
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
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
                        {lead.status}
                      </Badge>
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(lead.loan_amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;