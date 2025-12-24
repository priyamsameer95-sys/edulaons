/**
 * Lead Detail Layout Component
 * 
 * Per Knowledge Base:
 * - Unified component system across Admin/Partner/Student
 * - Role-gated action buttons
 * - Consistent information display
 * - Same "Lead detail" page layout structure
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactCurrency } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  GraduationCap, 
  Building2, 
  IndianRupee, 
  FileText,
  ArrowLeft,
  Clock,
  Phone,
  Mail
} from 'lucide-react';

type UserRole = 'admin' | 'partner' | 'student';

interface LeadInfo {
  id: string;
  caseId: string;
  status: string;
  statusLabel?: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  loanAmount: number;
  studyDestination: string;
  documentsStatus: string;
  partnerName?: string;
  lenderName?: string;
  createdAt: string;
  intakeMonth?: number;
  intakeYear?: number;
}

interface LeadDetailLayoutProps {
  /** Lead information */
  lead: LeadInfo;
  /** Current user role for permission gating */
  userRole: UserRole;
  /** Status badge variant */
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Back button handler */
  onBack?: () => void;
  /** Actions available based on role */
  actions?: React.ReactNode;
  /** Main content (tabs, forms, etc.) */
  children: React.ReactNode;
  /** Sidebar content (optional) */
  sidebar?: React.ReactNode;
  /** Header extra content */
  headerExtra?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const InfoItem = ({ 
  icon: Icon, 
  label, 
  value, 
  className 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-start gap-3", className)}>
    <div className="p-2 rounded-lg bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);


const getIntakeLabel = (month?: number, year?: number): string => {
  if (!month || !year) return 'Not specified';
  const monthName = new Date(2024, month - 1).toLocaleString('default', { month: 'short' });
  return `${monthName} ${year}`;
};

export const LeadDetailLayout: React.FC<LeadDetailLayoutProps> = ({
  lead,
  userRole,
  statusVariant = 'secondary',
  onBack,
  actions,
  children,
  sidebar,
  headerExtra,
  className,
}) => {
  // Determine what fields are visible based on role
  const showContactInfo = userRole === 'admin' || userRole === 'partner';
  const showPartnerInfo = userRole === 'admin';
  const showLenderInfo = userRole === 'admin' || userRole === 'partner';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {lead.studentName}
              </h1>
              <Badge variant={statusVariant}>
                {lead.statusLabel || lead.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Case ID: {lead.caseId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {headerExtra}
          {actions}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IndianRupee className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="text-sm font-bold">{formatCompactCurrency(lead.loanAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="text-sm font-bold">{lead.studyDestination}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Intake</p>
                    <p className="text-sm font-bold">
                      {getIntakeLabel(lead.intakeMonth, lead.intakeYear)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-bold capitalize">{lead.documentsStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          {children}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Student Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem 
                icon={User}
                label="Name"
                value={lead.studentName}
              />
              
              {showContactInfo && lead.studentPhone && (
                <InfoItem 
                  icon={Phone}
                  label="Phone"
                  value={
                    <a href={`tel:${lead.studentPhone}`} className="text-primary hover:underline">
                      {lead.studentPhone}
                    </a>
                  }
                />
              )}
              
              {showContactInfo && lead.studentEmail && (
                <InfoItem 
                  icon={Mail}
                  label="Email"
                  value={
                    <a href={`mailto:${lead.studentEmail}`} className="text-primary hover:underline">
                      {lead.studentEmail}
                    </a>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Partner Info (Admin only) */}
          {showPartnerInfo && lead.partnerName && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground">{lead.partnerName}</p>
              </CardContent>
            </Card>
          )}

          {/* Lender Info */}
          {showLenderInfo && lead.lenderName && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Lender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground">{lead.lenderName}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Sidebar Content */}
          {sidebar}
        </aside>
      </div>
    </div>
  );
};

export default LeadDetailLayout;
