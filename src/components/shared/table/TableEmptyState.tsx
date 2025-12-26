import { LucideIcon, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function TableEmptyState({
  icon: Icon = FileCheck,
  title,
  description = 'No items match your filters',
  action,
  children,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="h-12 w-12 mb-3 opacity-50" />
      {title && <h3 className="font-medium mb-1">{title}</h3>}
      <p className="text-sm">{description}</p>
      {action && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
