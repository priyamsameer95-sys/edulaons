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
  suffix?: string;
}

const StatItem = ({ label, value, isActive, onClick, loading, suffix }: StatItemProps) => {
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
      {suffix && <span className="text-xs text-green-600 font-medium">{suffix}</span>}
    </button>
  );
};

export const CompactStatsBar = ({
  kpis,
  loading,
  activeFilter,
  onFilterClick,
}: CompactStatsBarProps) => {
  // Calculate conversion rate (sanctioned out of total)
  const conversionRate = kpis.totalLeads > 0 
    ? Math.round((kpis.sanctioned / kpis.totalLeads) * 100) 
    : 0;

  const stats = [
    { label: "Total", value: kpis.totalLeads, filterKey: null, suffix: "" },
    { label: "In Pipeline", value: kpis.inPipeline, filterKey: "in_pipeline", suffix: "" },
    { label: "Sanctioned", value: kpis.sanctioned, filterKey: "sanctioned", suffix: kpis.totalLeads > 0 ? ` (${conversionRate}%)` : "" },
    { label: "Disbursed", value: kpis.disbursed, filterKey: "disbursed", suffix: "" },
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
            suffix={stat.suffix}
          />
          {index < stats.length - 1 && (
            <span className="text-border mx-1">|</span>
          )}
        </div>
      ))}
    </div>
  );
};
