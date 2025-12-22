import { useNavigate, useParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  User,
  MapPin,
  Wallet,
  Calendar,
  FileText,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock
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

// Helper to get friendly status label with meaning
const getStatusInfo = (status: string, hasDocuments: boolean) => {
  const statusMap: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    'new': { icon: '🟢', label: 'New – Awaiting Document Uploads', color: 'text-green-600' },
    'lead_intake': { icon: '🟢', label: 'New – Awaiting Document Uploads', color: 'text-green-600' },
    'docs_uploading': { icon: '🟠', label: 'Pending – Documents Being Uploaded', color: 'text-amber-600' },
    'docs_submitted': { icon: '🔵', label: 'Submitted – Verification in Progress', color: 'text-blue-600' },
    'docs_verified': { icon: '✅', label: 'Verified – Ready for Lender Review', color: 'text-green-600' },
    'approved': { icon: '🎉', label: 'Approved – Loan Sanctioned', color: 'text-green-600' },
    'rejected': { icon: '🔴', label: 'Rejected – Review Feedback', color: 'text-red-600' },
  };
  return statusMap[status] || { icon: '🟡', label: 'In Progress', color: 'text-amber-600' };
};

// Helper to calculate progress percentage
const getProgressPercentage = (status: string, hasDocuments: boolean) => {
  const progressMap: Record<string, number> = {
    'new': 20,
    'lead_intake': 20,
    'first_contact': 30,
    'docs_uploading': 40,
    'docs_submitted': 60,
    'docs_verified': 75,
    'logged_with_lender': 80,
    'sanctioned': 90,
    'approved': 100,
    'disbursed': 100,
  };
  return progressMap[status] || 25;
};

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
  const statusInfo = getStatusInfo(lead.status, uploadedCount > 0);
  const progressPercent = getProgressPercentage(lead.status, uploadedCount > 0);
  
  // Extract short lead ID for friendly display
  const shortLeadId = lead.case_id?.replace('EDU-', '#') || lead.case_id;

  const handleManageDocuments = () => {
    onOpenChange(false);
    navigate(`/partner/${partnerCode}/lead/${lead.id}/documents`);
  };

  return (
    <TooltipProvider>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader className="space-y-3 pb-4 border-b">
            <SheetTitle className="text-lg font-semibold">
              Lead {shortLeadId} • Added on {createdDate}
            </SheetTitle>
            
            {/* Status with meaning */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
              {lead.is_quick_lead && !lead.quick_lead_completed_at && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Incomplete
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Application Progress</span>
                <span className="font-medium">{progressPercent}% Complete</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </SheetHeader>

          <div className="py-4 space-y-4 flex-1">
            {/* Application Summary */}
            <Card className="border">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Application Summary
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Here's what we have on file for this lead.
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                {/* Student Details */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    Student
                    {lead.student?.name && lead.student?.phone ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    )}
                  </p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    Loan
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  </p>
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
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs capitalize cursor-help">
                            {lead.loan_type || 'N/A'}
                            <Info className="h-3 w-3 ml-1" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="text-xs">
                            {lead.loan_type === 'unsecured' 
                              ? "Unsecured loans don't require collateral but may have higher interest rates."
                              : "Secured loans require collateral but typically offer lower interest rates."}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Co-Applicant Details */}
                {lead.co_applicant && (
                  <div className="space-y-1.5 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      Co-Applicant
                      {lead.co_applicant.name && lead.co_applicant.salary ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                    </p>
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

            {/* Trust Reassurance */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Your data is encrypted and never shared with third parties.</span>
            </div>
          </div>

          {/* Sticky CTA Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 space-y-2">
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
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Uploading documents doubles your lender match chances
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};