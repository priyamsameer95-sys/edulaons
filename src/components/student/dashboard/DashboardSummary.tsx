import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, Activity, CheckCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface DashboardSummaryProps {
  totalApplications: number;
  activeApplications: number;
  approvedApplications: number;
  totalLoanAmount: number;
}

export const DashboardSummary = ({
  totalApplications,
  activeApplications,
  approvedApplications,
  totalLoanAmount,
}: DashboardSummaryProps) => {
  const stats = [
    {
      icon: FileCheck,
      label: "Total Applications",
      value: totalApplications,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Activity,
      label: "Active",
      value: activeApplications,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: CheckCircle,
      label: "Approved",
      value: approvedApplications,
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      icon: DollarSign,
      label: "Total Approved",
      value: formatCurrency(totalLoanAmount),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {typeof stat.value === 'number' ? stat.value : stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
