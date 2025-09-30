import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, TrendingUp, CheckCircle, DollarSign, LogOut, Settings, Users, IndianRupee, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { NewLeadModal } from "@/components/dashboard/NewLeadModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PersonalImpact } from "@/components/gamification/PersonalImpact";

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
    disbursed: 0,
    totalPartners: 1
  });

  const [totalLoanAmount, setTotalLoanAmount] = useState(0);


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
      let totalAmount = 0;

      leadsByStatus?.forEach((lead) => {
        totalAmount += Number(lead.loan_amount) || 0;
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

      setTotalLoanAmount(totalAmount);

      setKpis({
        totalLeads: totalLeads || 0,
        inPipeline,
        sanctioned,
        disbursed,
        totalPartners: 1
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

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-8 pb-12">
        <div className="space-y-6">
          {/* Impact This Month & KPI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Impact Card */}
            <div className="lg:col-span-1">
              <PersonalImpact 
                studentsHelped={kpis.totalLeads}
                loansApproved={kpis.sanctioned}
                totalLoanAmount={totalLoanAmount}
                compareToAverage={15}
              />
            </div>

            {/* KPI Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-2 gap-4 content-start">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{kpis.totalLeads}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  In Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{kpis.inPipeline}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Sanctioned
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{kpis.sanctioned}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Disbursed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{kpis.disbursed}</div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Tabs Section */}
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
