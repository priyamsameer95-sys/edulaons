import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, TrendingUp, CheckCircle, DollarSign, LogOut, Settings, Users, IndianRupee, FileBarChart } from "lucide-react";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { NewLeadModal } from "@/components/dashboard/NewLeadModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Partner {
  id: string;
  name: string;
  partner_code: string;
  email: string;
  phone?: string;
  address?: string;
}

interface PartnerDashboardProps {
  partner?: Partner;
}

const PartnerDashboard = ({ partner }: PartnerDashboardProps) => {
  const { signOut, appUser, isAdmin } = useAuth();
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");
  const [kpisLoading, setKpisLoading] = useState(true);
  const { toast } = useToast();

  // KPI state with real data from Supabase
  const [kpis, setKpis] = useState({
    totalLeads: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0
  });

  // Fetch real KPI data from Supabase
  const fetchKPIs = async () => {
    try {
      setKpisLoading(true);
      
      let totalQuery = supabase.from('leads_new').select('*', { count: 'exact', head: true });
      let statusQuery = supabase.from('leads_new').select('status, loan_amount');
      
      // Filter by partner if not admin and partner is specified
      if (!isAdmin() && partner?.id) {
        totalQuery = totalQuery.eq('partner_id', partner.id);
        statusQuery = statusQuery.eq('partner_id', partner.id);
      }
      
      const { count: totalLeads, error: totalError } = await totalQuery;
      if (totalError) throw totalError;

      const { data: leadsByStatus, error: statusError } = await statusQuery;
      if (statusError) throw statusError;

      let inPipeline = 0, sanctioned = 0, disbursed = 0;

      leadsByStatus?.forEach((lead) => {
        switch (lead.status) {
          case 'new':
          case 'in_progress':
            inPipeline++;
            break;
          case 'approved':
            sanctioned++;
            break;
          default:
            break;
        }
      });

      setKpis({
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
        disbursed
      });

    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setKpisLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();

    // Set up real-time subscription to update KPIs when leads change
    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_new'
        },
        () => {
          fetchKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {partner ? `${partner.name} Dashboard` : 'Partner Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {partner 
                  ? `Partner Code: ${partner.partner_code} • Welcome back!`
                  : "Manage your student loan applications and track progress"
                }
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin() && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/admin'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              )}
              <Button onClick={signOut} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              <Button onClick={() => setNewLeadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold">{kpis.totalLeads}</div>}
                  <p className="text-xs text-muted-foreground mt-1">All-time leads created</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    In Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-warning">{kpis.inPipeline}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Active processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sanctioned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-primary">{kpis.sanctioned}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Approved loans</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Disbursed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-success">{kpis.disbursed}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Funds released</p>
                </CardContent>
              </Card>
            </div>

            <LeadsTab />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <PayoutsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Lead Modal */}
      <NewLeadModal 
        open={newLeadOpen} 
        onOpenChange={setNewLeadOpen}
        onSuccess={() => fetchKPIs()}
      />

      {/* Floating Action Button - Mobile */}
      <Button onClick={() => setNewLeadOpen(true)} className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-lg" size="icon">
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PartnerDashboard;