import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileBarChart, Users, CheckCircle, BadgeIndianRupee } from "lucide-react";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { NewLeadModal } from "@/components/dashboard/NewLeadModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const PartnerDashboard = () => {
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
      
      // Get total leads count
      const { count: totalCount, error: totalError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get in pipeline count (new, qualified, docs_pending, docs_verified, applied)
      const { count: pipelineCount, error: pipelineError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'qualified', 'docs_pending', 'docs_verified', 'applied']);

      if (pipelineError) throw pipelineError;

      // Get sanctioned count
      const { count: sanctionedCount, error: sanctionedError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sanctioned');

      if (sanctionedError) throw sanctionedError;

      // Get disbursed count
      const { count: disbursedCount, error: disbursedError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disbursed');

      if (disbursedError) throw disbursedError;

      setKpis({
        totalLeads: totalCount || 0,
        inPipeline: pipelineCount || 0,
        sanctioned: sanctionedCount || 0,
        disbursed: disbursedCount || 0
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
          table: 'leads'
        },
        () => {
          // Refresh KPIs when any lead changes
          fetchKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sky-700">Cashkaro - Partner Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your education loan leads and track payouts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setNewLeadOpen(true)} className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
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
            <TabsTrigger value="leads" className="flex items-center gap-2 bg-green-50">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2 bg-emerald-100 rounded-sm font-bold">
              <BadgeIndianRupee className="h-4 w-4" />
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-card border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-foreground">{kpis.totalLeads}</div>}
                  <p className="text-xs text-muted-foreground mt-1">All-time leads created</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    In Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-warning">{kpis.inPipeline}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Active processing</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-md">
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

              <Card className="bg-gradient-card border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <BadgeIndianRupee className="h-4 w-4 mr-2" />
                    Disbursed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpisLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold text-success">{kpis.disbursed}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Funds released</p>
                </CardContent>
              </Card>
            </div>

            <LeadsTab onNewLead={() => setNewLeadOpen(true)} />
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
        onSuccess={() => {
          // Refresh data and focus new lead
          setActiveTab("leads");
          fetchKPIs(); // Refresh KPIs after successful lead creation
        }} 
      />

      {/* Floating Action Button - Mobile */}
      <Button onClick={() => setNewLeadOpen(true)} className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full bg-gradient-primary hover:bg-primary-hover shadow-lg" size="icon">
        <Plus className="h-6 w-6" />
      </Button>
    </div>;
};
export default PartnerDashboard;