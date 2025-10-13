import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterGroup {
  title: string;
  options: { label: string; value: string; count: number }[];
}

const filterGroups: FilterGroup[] = [
  {
    title: 'Status',
    options: [
      { label: 'New', value: 'new', count: 125 },
      { label: 'In Progress', value: 'in_progress', count: 340 },
      { label: 'Approved', value: 'approved', count: 512 },
      { label: 'Rejected', value: 'rejected', count: 270 },
    ],
  },
  {
    title: 'Document Status',
    options: [
      { label: 'Pending', value: 'pending', count: 89 },
      { label: 'Uploaded', value: 'uploaded', count: 234 },
      { label: 'Verified', value: 'verified', count: 512 },
      { label: 'Rejected', value: 'doc_rejected', count: 45 },
    ],
  },
  {
    title: 'Loan Amount',
    options: [
      { label: '< ₹5L', value: 'below_5', count: 178 },
      { label: '₹5L - ₹10L', value: '5_to_10', count: 425 },
      { label: '₹10L - ₹20L', value: '10_to_20', count: 298 },
      { label: '> ₹20L', value: 'above_20', count: 156 },
    ],
  },
  {
    title: 'Study Destination',
    options: [
      { label: 'USA', value: 'usa', count: 423 },
      { label: 'UK', value: 'uk', count: 298 },
      { label: 'Canada', value: 'canada', count: 234 },
      { label: 'Australia', value: 'australia', count: 178 },
      { label: 'Germany', value: 'germany', count: 124 },
    ],
  },
];

export const SmartFiltersPanel = () => {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openGroups, setOpenGroups] = useState<string[]>(['Status', 'Document Status']);

  const handleFilterChange = (groupTitle: string, value: string, checked: boolean) => {
    setSelectedFilters((prev) => {
      const groupFilters = prev[groupTitle] || [];
      if (checked) {
        return { ...prev, [groupTitle]: [...groupFilters, value] };
      } else {
        return {
          ...prev,
          [groupTitle]: groupFilters.filter((v) => v !== value),
        };
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).reduce(
      (sum, filters) => sum + filters.length,
      0
    );
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const activeCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filters</CardTitle>
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeCount}
              </Badge>
            )}
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {filterGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.includes(group.title)}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 hover:bg-muted"
              >
                <span className="font-medium text-sm">{group.title}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openGroups.includes(group.title) && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="px-3 pt-2 pb-3 space-y-2">
              {group.options.map((option) => {
                const isChecked =
                  selectedFilters[group.title]?.includes(option.value) || false;
                
                return (
                  <div
                    key={option.value}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${group.title}-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleFilterChange(
                            group.title,
                            option.value,
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor={`${group.title}-${option.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.count}
                    </span>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Active Filters Summary */}
        {activeCount > 0 && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Active Filters:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedFilters).map(([group, values]) =>
                values.map((value) => {
                  const option = filterGroups
                    .find((g) => g.title === group)
                    ?.options.find((o) => o.value === value);
                  
                  return (
                    <Badge
                      key={`${group}-${value}`}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {option?.label}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => handleFilterChange(group, value, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <Button className="w-full mt-4" disabled={activeCount === 0}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
};
