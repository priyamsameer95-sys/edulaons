/**
 * Lender Status Card
 * 
 * Shows lender selection status in a non-blocking way.
 * Never blocks document upload.
 */
import { Building2, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LenderStatusCardProps {
  lenderName?: string | null;
  lenderCode?: string | null;
  onViewLenders?: () => void;
}

const LenderStatusCard = ({ 
  lenderName, 
  lenderCode,
  onViewLenders 
}: LenderStatusCardProps) => {
  const hasLender = !!lenderName;

  return (
    <div className={cn(
      "rounded-xl border p-4",
      hasLender 
        ? "bg-muted/30 border-border" 
        : "bg-muted/20 border-dashed border-muted-foreground/30"
    )}>
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-border flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
          
          <div>
            {hasLender ? (
              <>
                <p className="font-semibold text-foreground">{lenderName}</p>
                <p className="text-xs text-muted-foreground">
                  Documents required as per this lender
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Lender will be finalized after documents are reviewed
                </p>
              </>
            )}
          </div>
        </div>
        
        {!hasLender && onViewLenders && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewLenders}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View Eligible Lenders
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LenderStatusCard;
