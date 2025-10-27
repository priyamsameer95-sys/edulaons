import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/lead-status/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MapPin, Calendar, FileText, DollarSign, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  case_id: string;
  status: any;
  documents_status: any;
  loan_amount: number;
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  created_at: string;
}

interface StudentApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export const StudentApplicationCard = ({ application, onClick }: StudentApplicationCardProps) => {
  // Calculate progress based on status
  const getProgress = (status: string, docStatus: string) => {
    if (status === 'approved') return 100;
    if (status === 'rejected') return 100;
    if (docStatus === 'verified') return 75;
    if (docStatus === 'uploaded') return 50;
    return 25;
  };

  const progress = getProgress(application.status, application.documents_status);
  const needsAction = application.documents_status === 'pending' || application.documents_status === 'resubmission_required';
  const intakeDate = application.intake_month && application.intake_year 
    ? `${application.intake_month}/${application.intake_year}` 
    : 'TBD';

  return (
    <Card 
      className={cn(
        "cursor-pointer bg-card border border-border rounded-lg group",
        "transition-shadow duration-200",
        "hover:shadow-lg",
        needsAction && "border-l-2 border-l-amber-500",
        application.status === 'approved' && !needsAction && "border-l-2 border-l-emerald-500",
        application.status === 'rejected' && !needsAction && "border-l-2 border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Application #{application.case_id}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Started {formatDate(application.created_at)}
            </p>
          </div>
          {needsAction && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Progress</span>
          <div className="flex-1 bg-muted rounded-full h-1.5">
            <div 
              className={cn(
                "h-1.5 rounded-full transition-all",
                progress < 50 ? "bg-amber-500" : progress < 100 ? "bg-blue-500" : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">{progress}%</span>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Loan Amount
            </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(application.loan_amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Destination
            </span>
            <span className="font-medium text-foreground">{application.study_destination}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Intake
            </span>
            <span className="text-foreground">{intakeDate}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </span>
            <StatusBadge status={application.documents_status} type="document" />
          </div>
        </div>

        {/* Action Button */}
        {needsAction && (
          <Button 
            className="w-full mt-2" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
