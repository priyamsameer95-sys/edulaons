/**
 * Sticky Upload CTA
 * 
 * Primary call-to-action that stays visible.
 * Only ONE primary button on the screen.
 * Includes trust text below.
 */
import { Upload, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StickyUploadCTAProps {
  onClick: () => void;
  disabled?: boolean;
  pendingCount?: number;
  className?: string;
}

const StickyUploadCTA = ({ 
  onClick, 
  disabled = false,
  pendingCount = 0,
  className 
}: StickyUploadCTAProps) => {
  return (
    <div className={cn(
      "sticky bottom-0 left-0 right-0 z-50",
      "bg-gradient-to-t from-background via-background to-background/80",
      "pt-4 pb-6 px-4 -mx-4 sm:-mx-6",
      "border-t border-border/50",
      className
    )}>
      <div className="max-w-4xl mx-auto space-y-3">
        <Button
          onClick={onClick}
          disabled={disabled}
          size="lg"
          className={cn(
            "w-full h-14 text-base font-semibold",
            "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
            "transition-all duration-300"
          )}
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Documents
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
              {pendingCount} pending
            </span>
          )}
        </Button>
        
        {/* Trust Text */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Your documents are securely shared only with verified lenders</span>
        </div>
      </div>
    </div>
  );
};

export default StickyUploadCTA;
