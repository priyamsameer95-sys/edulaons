import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 6 }: TableSkeletonProps) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

interface CardGridSkeletonProps {
  items?: number;
}

export const CardGridSkeleton = ({ items = 4 }: CardGridSkeletonProps) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: items }).map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-12 w-64" />
    <CardGridSkeleton items={4} />
    <Skeleton className="h-96 w-full" />
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-10 w-32" />
  </div>
);
