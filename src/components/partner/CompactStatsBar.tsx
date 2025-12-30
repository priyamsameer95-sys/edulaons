import { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PartnerKPIs } from "@/types/partner";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRightCircle, CheckCircle2, Banknote } from "lucide-react";
import { formatIndianCurrency } from "@/utils/currencyFormatter";

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
  icon: React.ReactNode;
}

const StatItem = memo(({ label, value, isActive, onClick, loading, suffix, icon }: StatItemProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
        "hover:bg-primary/10",
        isActive && "bg-primary/15 shadow-sm ring-1 ring-primary/20"
      )}
    >
      {/* Icon container - unified primary color */}
      <div className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-105",
        "bg-primary/10",
        isActive && "bg-primary/20 ring-2 ring-offset-1 ring-primary/30"
      )}>
        <div className="text-primary">{icon}</div>
      </div>
      
      {/* Stats text */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "font-bold text-lg leading-none",
            isActive ? "text-primary" : "text-foreground"
          )}>
            {value}
          </span>
          {suffix && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {suffix}
            </span>
          )}
        </div>
        <span className={cn(
          "text-xs font-medium",
          isActive ? "text-primary/80" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
});

StatItem.displayName = 'StatItem';

export const CompactStatsBar = memo(({
  kpis,
  loading,
  activeFilter,
  onFilterClick,
}: CompactStatsBarProps) => {
  // Memoize sanctioned amount formatting
  const formattedSanctionedAmount = useMemo(() => {
    return kpis.sanctionedAmount > 0 
      ? formatIndianCurrency(kpis.sanctionedAmount, true) 
      : "";
  }, [kpis.sanctionedAmount]);

  // Memoize stats array
  const stats = useMemo(() => [
    { 
      label: "Total Leads", 
      value: kpis.totalLeads, 
      filterKey: null, 
      suffix: "",
      icon: <Users className="h-4 w-4" />
    },
    { 
      label: "In Pipeline", 
      value: kpis.inPipeline, 
      filterKey: "in_pipeline", 
      suffix: "",
      icon: <ArrowRightCircle className="h-4 w-4" />
    },
    { 
      label: "Sanctioned", 
      value: kpis.sanctioned, 
      filterKey: "sanctioned", 
      suffix: formattedSanctionedAmount,
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    { 
      label: "Disbursed", 
      value: kpis.disbursed, 
      filterKey: "disbursed", 
      suffix: "",
      icon: <Banknote className="h-4 w-4" />
    },
  ], [kpis, formattedSanctionedAmount]);

  // Memoize click handlers
  const handleFilterClick = useCallback((filterKey: string | null) => {
    onFilterClick(filterKey === activeFilter ? null : filterKey);
  }, [activeFilter, onFilterClick]);

  return (
    <div className="inline-flex items-center gap-1 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-1.5 shadow-sm">
      {stats.map((stat) => (
        <StatItem
          key={stat.label}
          label={stat.label}
          value={stat.value}
          filterKey={stat.filterKey}
          isActive={activeFilter === stat.filterKey}
          onClick={() => handleFilterClick(stat.filterKey)}
          loading={loading}
          suffix={stat.suffix}
          icon={stat.icon}
        />
      ))}
    </div>
  );
});

CompactStatsBar.displayName = 'CompactStatsBar';
