import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MapPin, Calendar, FileText, Building2, Upload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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
  lender?: {
    name: string;
    code: string;
  };
}

interface StudentApplicationCardProps {
  application: Application;
  onClick: () => void;
}

const getStatusConfig = (status: string, docStatus: string) => {
  if (status === 'approved') {
    return { 
      color: 'emerald', 
      icon: CheckCircle2, 
      label: 'Approved',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    };
  }
  if (status === 'rejected') {
    return { 
      color: 'red', 
      icon: AlertCircle, 
      label: 'Rejected',
      bgClass: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    };
  }
  if (docStatus === 'pending' || docStatus === 'resubmission_required') {
    return { 
      color: 'amber', 
      icon: Upload, 
      label: 'Docs Needed',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
    };
  }
  return { 
    color: 'blue', 
    icon: Clock, 
    label: 'In Progress',
    bgClass: 'bg-card border-border'
  };
};

export const StudentApplicationCard = ({ application, onClick }: StudentApplicationCardProps) => {
  const statusConfig = getStatusConfig(application.status, application.documents_status);
  const StatusIcon = statusConfig.icon;
  const needsAction = application.documents_status === 'pending' || application.documents_status === 'resubmission_required';
  
  const intakeDate = application.intake_month && application.intake_year 
    ? new Date(application.intake_year, application.intake_month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'TBD';

  return (
    <Card 
      className={cn(
        "cursor-pointer group transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        statusConfig.bgClass
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono">#{application.case_id}</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {formatCurrency(application.loan_amount)}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "gap-1 shrink-0",
              statusConfig.color === 'emerald' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
              statusConfig.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
              statusConfig.color === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
              statusConfig.color === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{application.study_destination}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{intakeDate}</span>
          </div>
          {application.lender?.name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{application.lender.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="capitalize">{application.documents_status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Action Button */}
        {needsAction && (
          <Button 
            className="w-full mt-4 gap-2" 
            size="sm"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
