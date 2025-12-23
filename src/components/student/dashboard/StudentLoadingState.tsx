import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StudentLoadingState = () => (
  <div className="space-y-6">
    <Skeleton className="h-28 w-full rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="bg-card border border-border rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
