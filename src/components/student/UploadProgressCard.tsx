/**
 * Upload Progress Card
 * 
 * Shows document upload progress with a visual progress bar.
 */
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressCardProps {
  uploadedCount: number;
  totalCount: number;
  verifiedCount?: number;
  rejectedCount?: number;
}

const UploadProgressCard = ({
  uploadedCount,
  totalCount,
  verifiedCount = 0,
  rejectedCount = 0,
}: UploadProgressCardProps) => {
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
  const pendingCount = totalCount - uploadedCount;

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Your Progress</h3>
        <span className="text-sm font-semibold text-foreground">
          {uploadedCount} of {totalCount}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex flex-wrap gap-3 text-xs">
        {verifiedCount > 0 && (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{verifiedCount} verified</span>
          </div>
        )}
        {uploadedCount - verifiedCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{uploadedCount - verifiedCount} pending review</span>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn(
              "w-3.5 h-3.5 rounded-full border-2",
              rejectedCount > 0 ? "border-red-400" : "border-muted-foreground"
            )} />
            <span>{pendingCount} still needed</span>
          </div>
        )}
        {rejectedCount > 0 && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{rejectedCount} need reupload</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressCard;
