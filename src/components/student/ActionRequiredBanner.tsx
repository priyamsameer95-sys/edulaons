/**
 * Action Required Banner
 * 
 * Visually dominant message showing what action the user must take.
 * This is the primary visual element driving user action.
 */
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerVariant = 'documents_required' | 'under_review' | 'approved' | 'action_needed';

interface ActionRequiredBannerProps {
  variant: BannerVariant;
  uploadedCount: number;
  totalCount: number;
  pendingCount: number;
  rejectedCount?: number;
}

const BANNER_CONFIG: Record<BannerVariant, {
  icon: typeof AlertCircle;
  title: string;
  subtitle: string;
  bgClass: string;
  iconBgClass: string;
  iconClass: string;
}> = {
  documents_required: {
    icon: FileWarning,
    title: 'Documents Required to Move Forward',
    subtitle: 'Your application is created. Upload the required documents to start lender review.',
    bgClass: 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30',
    iconBgClass: 'bg-amber-500/20',
    iconClass: 'text-amber-600',
  },
  action_needed: {
    icon: AlertCircle,
    title: 'Action Required',
    subtitle: 'Some documents need to be re-uploaded or there are pending clarifications.',
    bgClass: 'bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent border-red-500/30',
    iconBgClass: 'bg-red-500/20',
    iconClass: 'text-red-600',
  },
  under_review: {
    icon: Clock,
    title: 'Under Review',
    subtitle: 'Your documents are being reviewed. We\'ll notify you once complete.',
    bgClass: 'bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/30',
    iconBgClass: 'bg-blue-500/20',
    iconClass: 'text-blue-600',
  },
  approved: {
    icon: CheckCircle2,
    title: 'Documents Verified',
    subtitle: 'All your documents have been verified. Your loan is being processed.',
    bgClass: 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30',
    iconBgClass: 'bg-emerald-500/20',
    iconClass: 'text-emerald-600',
  },
};

const ActionRequiredBanner = ({
  variant,
  uploadedCount,
  totalCount,
  pendingCount,
  rejectedCount = 0,
}: ActionRequiredBannerProps) => {
  const config = BANNER_CONFIG[variant];
  const Icon = config.icon;
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <div className={cn(
      "rounded-xl border p-5 sm:p-6",
      config.bgClass
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          config.iconBgClass
        )}>
          <Icon className={cn("w-6 h-6", config.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
              variant === 'documents_required' && "bg-amber-500/20 text-amber-700",
              variant === 'action_needed' && "bg-red-500/20 text-red-700",
              variant === 'under_review' && "bg-blue-500/20 text-blue-700",
              variant === 'approved' && "bg-emerald-500/20 text-emerald-700"
            )}>
              {variant === 'documents_required' ? 'Action Required' : 
               variant === 'action_needed' ? 'Attention Needed' :
               variant === 'under_review' ? 'In Progress' : 'Complete'}
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {config.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {config.subtitle}
          </p>
          
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {uploadedCount} of {totalCount} documents uploaded
              </span>
              <span className="font-semibold text-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Status Pills */}
            <div className="flex items-center gap-2 mt-3">
              {pendingCount > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingCount} pending upload
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {rejectedCount} need re-upload
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionRequiredBanner;
