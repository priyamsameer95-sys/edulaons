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
        "cursor-pointer transition-all duration-300 premium-card hover-lift border-l-4 group",
        needsAction ? "border-l-red-500 animate-glow" : 
        application.status === 'approved' ? "border-l-green-500" :
        application.status === 'rejected' ? "border-l-red-400" :
        "border-l-blue-500"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {needsAction && (
              <div className="w-2 h-2 rounded-full bg-red-500 animate-gentle-pulse" />
            )}
            <div>
              <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                Application #{application.case_id}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Started {formatDate(application.created_at)}
              </p>
            </div>
          </div>
          {needsAction && (
            <Badge variant="destructive" className="animate-scale-in text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Action Needed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Circular Progress Section */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold text-primary">{progress}%</p>
            <p className="text-xs text-muted-foreground">
              {getMotivationalMessage(progress)}
            </p>
          </div>
          
          {/* SVG Circular Progress */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-muted fill-none"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={cn(
                  "fill-none transition-all duration-1000 ease-out",
                  getProgressColor(progress)
                )}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {progress}%
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary/70" />
              Loan Amount
            </span>
            <span className="font-bold text-primary">
              {formatCurrency(application.loan_amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70" />
              Destination
            </span>
            <span className="font-semibold">{application.study_destination}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/70" />
              Intake
            </span>
            <span>{intakeDate}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary/70" />
              Documents
            </span>
            <StatusBadge status={application.documents_status} type="document" />
          </div>
        </div>

        {/* Action CTA */}
        {needsAction && (
          <Button 
            className="w-full mt-2 animate-scale-in" 
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload documents to continue
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
