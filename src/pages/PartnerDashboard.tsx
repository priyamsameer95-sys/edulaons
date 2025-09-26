import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileBarChart, Users, CheckCircle, BadgeIndianRupee } from "lucide-react";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { NewLeadModal } from "@/components/dashboard/NewLeadModal";

const PartnerDashboard = () => {
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");

  // Mock KPI data - in real app, fetch from Supabase
  const kpis = {
    totalLeads: 248,
    inPipeline: 87,
    sanctioned: 42,
    disbursed: 119
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Partner Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your education loan leads and track payouts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setNewLeadOpen(true)}
                className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md"
              >
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
                  <div className="text-2xl font-bold text-foreground">{kpis.totalLeads}</div>
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
                  <div className="text-2xl font-bold text-warning">{kpis.inPipeline}</div>
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
                  <div className="text-2xl font-bold text-primary">{kpis.sanctioned}</div>
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
                  <div className="text-2xl font-bold text-success">{kpis.disbursed}</div>
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
        onSuccess={() => {
          // Refresh data and focus new lead
          setActiveTab("leads");
        }}
      />

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={() => setNewLeadOpen(true)}
        className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full bg-gradient-primary hover:bg-primary-hover shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PartnerDashboard;