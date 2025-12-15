import { cn } from "@/lib/utils";
import { PartnerKPIs } from "@/types/partner";
import { Skeleton } from "@/components/ui/skeleton";

interface CompactStatsBarProps {
  kpis: PartnerKPIs;
  loading: boolean;
  activeFilter: string | null;
  onFilterClick: (filter: string | null) => void;
}

interface StatItemProps {
  label: string;
  value: number;
  filterKey: string | null;
  isActive: boolean;
  onClick: () => void;
  loading: boolean;
}

const StatItem = ({ label, value, isActive, onClick, loading }: StatItemProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm",
        "hover:bg-accent",
        isActive && "bg-primary/10 text-primary font-medium"
      )}
    >
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </button>
  );
};

export const CompactStatsBar = ({
  kpis,
  loading,
  activeFilter,
  onFilterClick,
}: CompactStatsBarProps) => {
  const stats = [
    { label: "Total", value: kpis.totalLeads, filterKey: null },
    { label: "In Progress", value: kpis.inPipeline, filterKey: "in_progress" },
    { label: "Approved", value: kpis.sanctioned, filterKey: "approved" },
    { label: "Disbursed", value: kpis.disbursed, filterKey: "disbursed" },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap bg-card border rounded-lg px-2 py-1">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center">
          <StatItem
            label={stat.label}
            value={stat.value}
            filterKey={stat.filterKey}
            isActive={activeFilter === stat.filterKey}
            onClick={() => onFilterClick(stat.filterKey === activeFilter ? null : stat.filterKey)}
            loading={loading}
          />
          {index < stats.length - 1 && (
            <span className="text-border mx-1">|</span>
          )}
        </div>
      ))}
    </div>
  );
};
