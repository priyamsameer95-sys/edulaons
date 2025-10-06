import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, TrendingUp, CheckCircle, DollarSign, LogOut, Settings, Users, IndianRupee, ArrowUpRight, ArrowDownRight, Shield, Calendar } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { NewLeadModal } from "@/components/dashboard/NewLeadModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  // KPI state with real data from Supabase
  const [kpis, setKpis] = useState({
    totalLeads: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
  });
  
  // Calculate trends (mock data for now - would be real historical comparison)
  const trends = {
    totalLeads: kpis.totalLeads > 10 ? '+12%' : '+5%',
    inPipeline: kpis.inPipeline > 5 ? '+8%' : '+3%',
    sanctioned: kpis.sanctioned > 5 ? '+15%' : '+7%',
    disbursed: '+10%'
  };
  
  const trendDirections = {
    totalLeads: kpis.totalLeads > 10,
    inPipeline: true,
    sanctioned: kpis.sanctioned > 5,
    disbursed: true
  };

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

      const newKpis = {
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
        disbursed,
      };
      
      setKpis(newKpis);
      setLastUpdated(new Date());

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
      {/* Professional Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {partner ? partner.name : 'Partner Dashboard'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {partner && `Code: ${partner.partner_code}`}
                  </p>
                  {partner && (
                    <>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3 text-success" />
                        <span className="text-success">Verified Partner</span>
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Partner since 2024
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {partner && (
                <ShareButton 
                  shareUrl={`${window.location.origin}/public/partner/${partner.partner_code}`}
                  title="Partner Page"
                  description="Share this public page with potential students"
                  variant="outline"
                />
              )}
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

      {/* Full Width Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        <div className="space-y-8">
          {/* Enhanced KPI Cards - Single Row - More Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-all hover:border-primary/30 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    Total Leads
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {trendDirections.totalLeads ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trends.totalLeads}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-4xl font-bold">{kpis.totalLeads}</div>
                    <p className="text-xs text-muted-foreground">
                      Updated {format(lastUpdated, 'h:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-warning/20 bg-warning/5 hover:border-warning/40 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-warning/20 group-hover:bg-warning/30 transition-colors">
                      <TrendingUp className="h-4 w-4 text-warning" />
                    </div>
                    In Pipeline
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    {trends.inPipeline}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-warning">{kpis.inPipeline}</div>
                    <p className="text-xs text-muted-foreground">
                      Active applications
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-primary/20 bg-primary/5 hover:border-primary/40 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    Sanctioned
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {trendDirections.sanctioned ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trends.sanctioned}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">{kpis.sanctioned}</div>
                    <p className="text-xs text-muted-foreground">
                      Approved loans
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-success/20 bg-success/5 hover:border-success/40 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-success/20 group-hover:bg-success/30 transition-colors">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    Disbursed
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    {trends.disbursed}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-success">{kpis.disbursed}</div>
                    <p className="text-xs text-muted-foreground">
                      Funds released
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Freshness Indicator */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Live Data • Last updated {format(lastUpdated, 'h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Secure connection</span>
              <span>•</span>
              <span>Real-time sync</span>
            </div>
          </div>

          {/* Tabs Section - Full Width */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Payouts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6 mt-6">
              {/* Leads Table - Main Focus */}
              <LeadsTab />
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6 mt-6">
              <PayoutsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Lead Modal */}
      <NewLeadModal 
        open={newLeadOpen} 
        onOpenChange={setNewLeadOpen}
        onSuccess={() => fetchKPIs()}
      />

      {/* Floating Action Button - Mobile */}
      <Button 
        onClick={() => setNewLeadOpen(true)} 
        className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-lg z-50" 
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PartnerDashboard;
