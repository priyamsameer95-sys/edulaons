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

  const getMotivationalMessage = (progress: number) => {
    if (progress < 25) return "Keep going! You got this 💪";
    if (progress < 50) return "You're making good progress! 🚀";
    if (progress < 75) return "You're halfway there! 🎉";
    if (progress < 100) return "Almost done! Waiting on review";
    return "Success! Your dream is one step closer 🎓";
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "stroke-red-500";
    if (progress < 50) return "stroke-orange-500";
    if (progress < 75) return "stroke-blue-500";
    return "stroke-green-500";
  };

  const progress = getProgress(application.status, application.documents_status);
  const needsAction = application.documents_status === 'pending' || application.documents_status === 'resubmission_required';
  const intakeDate = application.intake_month && application.intake_year 
    ? `${application.intake_month}/${application.intake_year}` 
    : 'TBD';

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card 
      className={cn(
        "cursor-pointer bg-white border border-slate-200 rounded-xl group",
        "transition-shadow duration-200",
        "hover:shadow-lg",
        needsAction && "border-l-4 border-l-amber-500",
        application.status === 'approved' && !needsAction && "border-l-4 border-l-emerald-500",
        application.status === 'rejected' && !needsAction && "border-l-4 border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Application #{application.case_id}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Started {formatDate(application.created_at)}
            </p>
          </div>
          {needsAction && (
            <Badge variant="destructive" className="text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
              <AlertCircle className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Progress</span>
            <span className="font-semibold text-slate-900">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full",
                progress < 50 ? "bg-amber-500" : progress < 100 ? "bg-blue-500" : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Loan Amount
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(application.loan_amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              Destination
            </span>
            <span className="font-medium text-slate-900">{application.study_destination}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Intake
            </span>
            <span className="text-slate-900">{intakeDate}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
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
