import { useAdminActionItems } from '@/hooks/useAdminActionItems';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, DollarSign } from 'lucide-react';

interface PriorityActionBarProps {
  activeFilter: 'all' | 'new' | 'docs' | 'follow-up';
  onFilterChange: (filter: 'all' | 'new' | 'docs' | 'follow-up') => void;
}

export function PriorityActionBar({ activeFilter, onFilterChange }: PriorityActionBarProps) {
  const { stats, loading } = useAdminActionItems();

  const items = [
    {
      key: 'new' as const,
      label: 'New Leads',
      count: stats.newLeadsCount,
      icon: Users,
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      activeColor: 'bg-destructive text-destructive-foreground',
    },
    {
      key: 'docs' as const,
      label: 'Docs to Verify',
      count: stats.documentsAwaitingCount,
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      activeColor: 'bg-amber-500 text-white',
    },
  ];

  const pendingValue = `₹${(stats.totalPendingValue / 100000).toFixed(0)}L`;

  return (
    <div className="flex items-center gap-3 p-4 bg-card border-b border-border">
      <span className="text-sm font-medium text-muted-foreground mr-2">Priority:</span>
      
      <Badge
        variant="outline"
        className={`cursor-pointer transition-colors ${
          activeFilter === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        }`}
        onClick={() => onFilterChange('all')}
      >
        All
      </Badge>

      {items.map((item) => (
        <Badge
          key={item.key}
          variant="outline"
          className={`cursor-pointer transition-colors gap-1.5 ${
            activeFilter === item.key ? item.activeColor : item.color
          }`}
          onClick={() => onFilterChange(item.key)}
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
          {!loading && (
            <span className="ml-1 font-semibold">({item.count})</span>
          )}
        </Badge>
      ))}

      {/* Pending Value - not clickable */}
      <Badge
        variant="outline"
        className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20 ml-auto"
      >
        <DollarSign className="h-3.5 w-3.5" />
        Pipeline: {pendingValue}
      </Badge>
    </div>
  );
}
