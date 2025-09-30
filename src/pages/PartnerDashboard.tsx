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
import { useGamification } from "@/hooks/useGamification";
import { GamificationHero } from "@/components/gamification/GamificationHero";
import { DailyGoalsWidget } from "@/components/gamification/DailyGoalsWidget";
import { PersonalImpact } from "@/components/gamification/PersonalImpact";
import { AchievementShowcase } from "@/components/gamification/AchievementShowcase";
import { MotivationalMessage } from "@/components/gamification/MotivationalMessage";
import { CelebrationConfetti } from "@/components/gamification/CelebrationConfetti";

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const { toast } = useToast();

  // KPI state with real data from Supabase
  const [kpis, setKpis] = useState({
    totalLeads: 0,
    inPipeline: 0,
    sanctioned: 0,
    disbursed: 0,
    totalPartners: 1
  });

  // Gamification data
  const gamificationData = useGamification(kpis);
  
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
        totalPartners: 1
      };
      
      // Check for achievements
      if (kpis.totalLeads > 0 && newKpis.totalLeads === 1) {
        triggerCelebration({
          icon: '🎯',
          title: 'First Lead!',
          description: 'You created your first lead',
          xpReward: 100
        });
      } else if (kpis.totalLeads < 10 && newKpis.totalLeads >= 10) {
        triggerCelebration({
          icon: '🚀',
          title: 'Rising Star!',
          description: 'Reached 10 total leads',
          xpReward: 250
        });
      } else if (kpis.sanctioned < 5 && newKpis.sanctioned >= 5) {
        triggerCelebration({
          icon: '⭐',
          title: 'Approval Master!',
          description: 'Achieved 5 sanctioned leads',
          xpReward: 300
        });
      }
      
      setKpis(newKpis);

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

  const triggerCelebration = (achievement: any) => {
    setCelebrationData(achievement);
    setShowCelebration(true);
    toast({
      title: achievement.title,
      description: achievement.description,
    });
  };

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

      {/* Gamification Hero */}
      <div className="container mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <GamificationHero
              userName={partner?.name || 'Partner'}
              level={gamificationData.level}
              currentXP={gamificationData.currentXP}
              xpToNextLevel={gamificationData.xpToNextLevel}
              streak={gamificationData.streak}
              unlockedBadges={gamificationData.unlockedBadges}
              totalBadges={gamificationData.totalBadges}
            />
          </div>
          <div>
            <MotivationalMessage />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-2xl mb-8">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - KPIs and Leads */}
              <div className="lg:col-span-2 space-y-8">
                {/* Enhanced KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Total Leads
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          {trendDirections.totalLeads ? (
                            <ArrowUpRight className="h-3 w-3 text-success" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {trends.totalLeads}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpisLoading ? (
                        <Skeleton className="h-10 w-20 mb-1" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold">{kpis.totalLeads}</div>
                          <p className="text-xs text-muted-foreground mt-1">All-time leads created</p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden border-warning/20 bg-warning/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-warning" />
                          In Pipeline
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <ArrowUpRight className="h-3 w-3 text-success" />
                          {trends.inPipeline}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpisLoading ? (
                        <Skeleton className="h-10 w-20 mb-1" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-warning">{kpis.inPipeline}</div>
                          <p className="text-xs text-muted-foreground mt-1">Active processing</p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden border-primary/20 bg-primary/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                          Sanctioned
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          {trendDirections.sanctioned ? (
                            <ArrowUpRight className="h-3 w-3 text-success" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {trends.sanctioned}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpisLoading ? (
                        <Skeleton className="h-10 w-20 mb-1" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-primary">{kpis.sanctioned}</div>
                          <p className="text-xs text-muted-foreground mt-1">Approved loans</p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden border-success/20 bg-success/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-success" />
                          Disbursed
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <ArrowUpRight className="h-3 w-3 text-success" />
                          {trends.disbursed}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpisLoading ? (
                        <Skeleton className="h-10 w-20 mb-1" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-success">{kpis.disbursed}</div>
                          <p className="text-xs text-muted-foreground mt-1">Funds released</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Impact */}
                <PersonalImpact
                  studentsHelped={kpis.totalLeads}
                  loansApproved={kpis.sanctioned}
                  totalLoanAmount={kpis.sanctioned * 2500000}
                  compareToAverage={15}
                />

                {/* Leads Table */}
                <LeadsTab />
              </div>

              {/* Sidebar Widgets */}
              <div className="space-y-6">
                <DailyGoalsWidget
                  goals={gamificationData.dailyGoals}
                  totalXP={gamificationData.xpToNextLevel}
                  earnedXP={gamificationData.currentXP}
                />
                
                <AchievementShowcase achievements={gamificationData.achievements} />
              </div>
            </div>
          </TabsContent>


          <TabsContent value="payouts" className="space-y-8">
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

      {/* Celebration Confetti */}
      <CelebrationConfetti
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievement={celebrationData}
      />

      {/* Floating Action Button - Mobile */}
      <Button onClick={() => setNewLeadOpen(true)} className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-lg" size="icon">
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PartnerDashboard;