import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, Settings, Shield, Calendar } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ShareButton from "@/components/ShareButton";
import { Partner } from "@/types/partner";

interface PartnerHeaderProps {
  partner?: Partner;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const PartnerHeader = ({ partner, isAdmin, onSignOut }: PartnerHeaderProps) => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();

  return (
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
            {isAdmin && (
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/admin'}
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button onClick={onSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button onClick={() => navigate(`/partner/${partnerCode}/new-lead`)}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
