/**
 * Hero Action Card
 * 
 * Single clear next step with ONE primary CTA.
 * Calm, directive messaging. No panic.
 */
import { Upload, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroActionCardProps {
  onUploadClick: () => void;
  pendingCount: number;
  isComplete?: boolean;
  className?: string;
}

const HeroActionCard = ({
  onUploadClick,
  pendingCount,
  isComplete = false,
  className,
}: HeroActionCardProps) => {
  if (isComplete) {
    return (
      <div className={cn(
        "p-8 lg:p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
        "border border-emerald-200 dark:border-emerald-800/50 rounded-2xl",
        className
      )}>
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              All Documents Uploaded
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Your documents are being reviewed. We'll notify you once lenders start processing your application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-8 lg:p-10 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent",
      "border border-primary/20 rounded-2xl",
      className
    )}>
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Next Step
          </p>
          <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">
            Upload Your Documents
          </h2>
          <p className="text-muted-foreground">
            Once uploaded, lenders can review your application and provide offers.
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <Button
            onClick={onUploadClick}
            size="lg"
            className={cn(
              "w-full lg:w-auto h-14 px-8 text-base font-semibold",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
              "transition-all duration-300"
            )}
          >
            Upload Documents
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-3">
            {pendingCount} document{pendingCount !== 1 ? 's' : ''} required
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroActionCard;
