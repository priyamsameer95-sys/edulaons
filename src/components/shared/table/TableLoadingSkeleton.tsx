import { Skeleton } from '@/components/ui/skeleton';

interface TableLoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableLoadingSkeleton({ 
  rows = 5, 
  className = 'p-4 space-y-3' 
}: TableLoadingSkeletonProps) {
  return (
    <div className={className}>
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
