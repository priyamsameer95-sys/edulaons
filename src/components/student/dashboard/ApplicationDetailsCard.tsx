/**
 * ApplicationDetailsCard - Compact app info with edit button
 */
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Globe, Calendar, IndianRupee, Building2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationDetailsCardProps {
  loanAmount: number;
  studyDestination: string;
  intakeMonth: number | null;
  intakeYear: number | null;
  targetLender?: { name: string } | null;
  createdAt: string;
  isEditLocked: boolean;
  onEditClick: () => void;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatIntake = (month: number | null, year: number | null) => {
  if (!month || !year) return 'Not specified';
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

const formatDestination = (destination: string) => {
  const map: Record<string, string> = {
    'usa': '🇺🇸 USA',
    'uk': '🇬🇧 UK',
    'canada': '🇨🇦 Canada',
    'australia': '🇦🇺 Australia',
    'germany': '🇩🇪 Germany',
    'ireland': '🇮🇪 Ireland',
    'singapore': '🇸🇬 Singapore',
    'other': '🌍 Other',
  };
  return map[destination.toLowerCase()] || destination;
};

const ApplicationDetailsCard = ({
  loanAmount,
  studyDestination,
  intakeMonth,
  intakeYear,
  targetLender,
  createdAt,
  isEditLocked,
  onEditClick,
  className,
}: ApplicationDetailsCardProps) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-medium">Application Details</CardTitle>
        {!isEditLocked && (
          targetLender ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditClick}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onEditClick}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Continue Application
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Loan Amount */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IndianRupee className="w-3 h-3" />
              <span>Loan Amount</span>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(loanAmount)}</p>
          </div>

          {/* Study Destination */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>Destination</span>
            </div>
            <p className="text-sm font-medium">{formatDestination(studyDestination)}</p>
          </div>

          {/* Intake */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Intake</span>
            </div>
            <p className="text-sm font-medium">{formatIntake(intakeMonth, intakeYear)}</p>
          </div>

          {/* Lender or Applied */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{targetLender ? 'Lender' : 'Applied'}</span>
            </div>
            <p className="text-sm font-medium capitalize">
              {targetLender?.name || formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationDetailsCard;
