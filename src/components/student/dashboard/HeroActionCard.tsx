/**
 * Hero Action Card
 * 
 * Primary action card with calm, directive messaging.
 * Contains the ONE primary CTA on the page.
 * Thick progress bar, clear copy.
 */
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroActionCardProps {
  onUploadClick: () => void;
  pendingCount: number;
  uploadedCount: number;
  totalCount: number;
  isComplete?: boolean;
  className?: string;
}

const HeroActionCard = ({
  onUploadClick,
  pendingCount,
  uploadedCount,
  totalCount,
  isComplete = false,
  className,
}: HeroActionCardProps) => {
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  if (isComplete) {
    return (
      <div className={cn(
        "p-6 lg:p-8 bg-card border border-border rounded-2xl text-center",
        className
      )}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">
          All Documents Uploaded
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your documents are being reviewed. We'll notify you once lenders start processing your application.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 lg:p-8 bg-card border border-border rounded-2xl",
      className
    )}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">
          Upload Documents to Move Forward
        </h2>
        <p className="text-muted-foreground mb-6">
          Once documents are uploaded, lenders can start reviewing your application.
        </p>

        {/* Thick Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {uploadedCount} of {totalCount} documents uploaded
          </p>
        </div>

        {/* Primary CTA */}
        <Button
          onClick={onUploadClick}
          size="lg"
          className={cn(
            "h-12 px-8 text-base font-semibold",
            "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
            "transition-all duration-300"
          )}
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Documents
        </Button>

        {/* Secondary text */}
        <p className="mt-3 text-sm text-muted-foreground">
          {pendingCount} document{pendingCount !== 1 ? 's' : ''} pending
        </p>
      </div>
    </div>
  );
};

export default HeroActionCard;
