import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, IndianRupee } from "lucide-react";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { PayoutsTab } from "@/components/dashboard/PayoutsTab";
import { ProcessFlowGuide } from "@/components/dashboard/ProcessFlowGuide";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerKPIs } from "@/hooks/usePartnerKPIs";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { PartnerKPICards } from "@/components/partner/PartnerKPICards";
import { DataFreshnessIndicator } from "@/components/partner/DataFreshnessIndicator";
import { Partner } from "@/types/partner";

interface PartnerDashboardProps {
  partner?: Partner;
}

const PartnerDashboard = ({ partner }: PartnerDashboardProps) => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();
  const { signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  
  // Use the centralized KPI hook
  const { kpis, loading: kpisLoading, lastUpdated } = usePartnerKPIs(partner?.id, isAdmin());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PartnerHeader 
        partner={partner} 
        isAdmin={isAdmin()} 
        onSignOut={signOut} 
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        <div className="space-y-8">
          {/* KPI Cards */}
          <PartnerKPICards 
            kpis={kpis} 
            loading={kpisLoading} 
            lastUpdated={lastUpdated} 
          />

          {/* Data Freshness Indicator */}
          <DataFreshnessIndicator lastUpdated={lastUpdated} />

          {/* Process Flow Guide */}
          <ProcessFlowGuide
            currentStep={2}
            completedSteps={[1]}
            totalLeads={kpis.totalLeads}
          />

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

      {/* Floating Action Button - Mobile */}
      <Button 
        onClick={() => navigate(`/partner/${partnerCode}/new-lead`)}
        className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-lg z-50" 
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PartnerDashboard;
