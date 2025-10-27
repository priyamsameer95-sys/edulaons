import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageCircle, BookOpen, FileText, Search } from "lucide-react";

interface QuickActionsPanelProps {
  onNewApplication: () => void;
  pendingActionsCount: number;
}

export const QuickActionsPanel = ({
  onNewApplication,
  pendingActionsCount,
}: QuickActionsPanelProps) => {
  const actions = [
    {
      icon: FileText,
      label: "New Application",
      description: "Start a new loan application",
      onClick: onNewApplication,
      variant: "default" as const,
    },
    {
      icon: Upload,
      label: "Upload Documents",
      description: "Upload pending documents",
      badge: pendingActionsCount > 0 ? pendingActionsCount : undefined,
      variant: "outline" as const,
    },
    {
      icon: Search,
      label: "Track Status",
      description: "Check application progress",
      variant: "outline" as const,
    },
    {
      icon: BookOpen,
      label: "Help Center",
      description: "FAQs and guides",
      variant: "outline" as const,
    },
    {
      icon: MessageCircle,
      label: "Contact Support",
      description: "Get help from our team",
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start h-auto py-3 px-4"
            onClick={action.onClick}
          >
            <div className="flex items-center gap-3 w-full">
              <action.icon className="h-5 w-5 shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium flex items-center gap-2">
                  {action.label}
                  {action.badge && (
                    <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-semibold rounded-full bg-warning text-warning-foreground">
                      {action.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
