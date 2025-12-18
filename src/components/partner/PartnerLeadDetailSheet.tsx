import { useNavigate, useParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  User,
  MapPin,
  Wallet,
  Calendar,
  FileText
} from "lucide-react";
import { RefactoredLead } from "@/types/refactored-lead";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { StatusBadge } from "@/components/lead-status/StatusBadge";
import type { LeadStatus } from "@/utils/statusUtils";
import { formatIndianNumber } from "@/utils/currencyFormatter";

interface PartnerLeadDetailSheetProps {
  lead: RefactoredLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
  initialTab?: string;
}

export const PartnerLeadDetailSheet = ({ 
  lead, 
  open, 
  onOpenChange
}: PartnerLeadDetailSheetProps) => {
  const navigate = useNavigate();
  const { partnerCode } = useParams();
  const { documents } = useLeadDocuments(lead?.id);

  if (!lead) return null;

  const createdDate = lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '';
  
  const uploadedCount = documents.length;

  const handleManageDocuments = () => {
    onOpenChange(false);
    navigate(`/partner/${partnerCode}/lead/${lead.id}/documents`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">
            {lead.case_id} • {createdDate}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status as LeadStatus} type="lead" />
            {lead.is_quick_lead && !lead.quick_lead_completed_at && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Incomplete
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Lead Information */}
          <Card className="border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              {/* Student Details */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.student?.name || 'N/A'}
                  </p>
                  {lead.student?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.student.phone}
                    </p>
                  )}
                  {lead.student?.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {lead.student.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Loan Details */}
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Loan</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">₹{formatIndianNumber(lead.loan_amount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{lead.study_destination || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {lead.intake_month && lead.intake_year 
                        ? `${format(new Date(2000, lead.intake_month - 1), 'MMM')} ${lead.intake_year}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {lead.loan_type || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Co-Applicant Details */}
              {lead.co_applicant && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Co-Applicant</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.co_applicant.name}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {lead.co_applicant.relationship}
                      </Badge>
                    </p>
                    {lead.co_applicant.salary && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5" />
                        ₹{formatIndianNumber(lead.co_applicant.salary)}/yr
                      </p>
                    )}
                    {lead.co_applicant.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.co_applicant.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Button */}
          <Button 
            className="w-full" 
            onClick={handleManageDocuments}
          >
            <FileText className="h-4 w-4 mr-2" />
            Manage Documents
            {uploadedCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {uploadedCount} uploaded
              </Badge>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
