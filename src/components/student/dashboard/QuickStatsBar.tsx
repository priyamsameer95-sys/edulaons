import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { DollarSign, MapPin, FileText, TrendingUp } from "lucide-react";
import type { StudentApplication } from "@/hooks/useStudentApplications";

interface QuickStatsBarProps {
  application: StudentApplication;
}

export const QuickStatsBar = ({ application }: QuickStatsBarProps) => {
  const stats = [
    {
      icon: DollarSign,
      label: "Amount",
      value: formatCurrency(application.loan_amount),
      color: "text-primary",
    },
    {
      icon: MapPin,
      label: "Destination",
      value: application.study_destination,
      color: "text-blue-500",
    },
    {
      icon: FileText,
      label: "Documents",
      value: application.documents_status === 'verified' ? 'Complete' : 
             application.documents_status === 'pending' ? 'Pending' : 
             application.documents_status === 'uploaded' ? 'Reviewing' : 'Action Needed',
      color: application.documents_status === 'verified' ? "text-emerald-500" : 
             application.documents_status === 'pending' ? "text-amber-500" : "text-blue-500",
    },
    {
      icon: TrendingUp,
      label: "Status",
      value: application.status === 'approved' ? 'Approved' :
             application.status === 'rejected' ? 'Rejected' :
             application.status === 'in_progress' ? 'In Progress' : 'New',
      color: application.status === 'approved' ? "text-emerald-500" : 
             application.status === 'rejected' ? "text-destructive" : "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-3 md:p-4 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
            <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className="text-sm md:text-base font-semibold text-foreground truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
