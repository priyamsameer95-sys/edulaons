import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileCheck, Clock, ArrowRight } from 'lucide-react';

interface ActionItem {
  id: string;
  type: 'urgent' | 'attention';
  title: string;
  description: string;
  count: number;
  action: () => void;
}

interface ActionRequiredSectionProps {
  urgentCount: number;
  attentionCount: number;
  onViewUrgent: () => void;
  onViewAttention: () => void;
}

export function ActionRequiredSection({
  urgentCount,
  attentionCount,
  onViewUrgent,
  onViewAttention,
}: ActionRequiredSectionProps) {
  if (urgentCount === 0 && attentionCount === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-destructive/30 bg-destructive/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
          Action Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <Badge variant="destructive" className="mb-1 font-bold">
                    URGENT
                  </Badge>
                  <p className="text-sm text-muted-foreground">Items need immediate attention</p>
                </div>
              </div>
              <Button
                onClick={onViewUrgent}
                variant="destructive"
                size="sm"
                className="gap-2 font-semibold"
              >
                {urgentCount} Items
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {attentionCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-warning/10 border-2 border-warning/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 border-warning text-warning font-bold">
                    ATTENTION
                  </Badge>
                  <p className="text-sm text-muted-foreground">Items need review soon</p>
                </div>
              </div>
              <Button
                onClick={onViewAttention}
                variant="outline"
                size="sm"
                className="gap-2 border-warning text-warning hover:bg-warning/10 font-semibold"
              >
                {attentionCount} Items
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
