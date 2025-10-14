import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, X, Filter } from 'lucide-react';
import { RefactoredLead } from '@/types/refactored-lead';
import { ActiveFilters } from '@/pages/AdminDashboard';
import { useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
  count: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface SmartFiltersPanelProps {
  leads: RefactoredLead[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export const SmartFiltersPanel = ({ leads, activeFilters, onFiltersChange }: SmartFiltersPanelProps) => {
  // Calculate dynamic filter options from real lead data
  const filterGroups: FilterGroup[] = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const docStatusCounts: Record<string, number> = {};
    const loanAmountCounts: Record<string, number> = {};
    const destinationCounts: Record<string, number> = {};

    leads.forEach(lead => {
      // Count by status
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      
      // Count by document status
      docStatusCounts[lead.documents_status] = (docStatusCounts[lead.documents_status] || 0) + 1;
      
      // Count by loan amount ranges
      const amount = Number(lead.loan_amount);
      if (amount < 1000000) loanAmountCounts['0-10L'] = (loanAmountCounts['0-10L'] || 0) + 1;
      else if (amount < 2000000) loanAmountCounts['10L-20L'] = (loanAmountCounts['10L-20L'] || 0) + 1;
      else if (amount < 3000000) loanAmountCounts['20L-30L'] = (loanAmountCounts['20L-30L'] || 0) + 1;
      else loanAmountCounts['30L+'] = (loanAmountCounts['30L+'] || 0) + 1;
      
      // Count by destination
      destinationCounts[lead.study_destination] = (destinationCounts[lead.study_destination] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      new: 'New',
      contacted: 'Contacted',
      in_progress: 'In Progress',
      document_review: 'Document Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };

    const docStatusLabels: Record<string, string> = {
      pending: 'Pending',
      uploaded: 'Uploaded',
      verified: 'Verified',
      rejected: 'Rejected',
      resubmission_required: 'Resubmission Required'
    };

    return [
      {
        id: 'status',
        label: 'Status',
        options: Object.entries(statusCounts).map(([value, count]) => ({
          label: statusLabels[value] || value,
          value,
          count
        }))
      },
      {
        id: 'documents_status',
        label: 'Document Status',
        options: Object.entries(docStatusCounts).map(([value, count]) => ({
          label: docStatusLabels[value] || value,
          value,
          count
        }))
      },
      {
        id: 'loan_amount',
        label: 'Loan Amount',
        options: Object.entries(loanAmountCounts).map(([value, count]) => ({
          label: value,
          value,
          count
        }))
      },
      {
        id: 'study_destination',
        label: 'Study Destination',
        options: Object.entries(destinationCounts).map(([value, count]) => ({
          label: value,
          value,
          count
        }))
      }
    ].filter(group => group.options.length > 0);
  }, [leads]);

  const [openGroups, setOpenGroups] = useState<string[]>(['status', 'documents_status']);

  const handleFilterChange = (groupId: string, optionValue: string, checked: boolean) => {
    const newFilters = { ...activeFilters };
    const groupFilters = (newFilters[groupId as keyof ActiveFilters] as string[]) || [];
    
    if (checked) {
      newFilters[groupId as keyof ActiveFilters] = [...groupFilters, optionValue] as any;
    } else {
      newFilters[groupId as keyof ActiveFilters] = groupFilters.filter(v => v !== optionValue) as any;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((sum, filters) => sum + (filters?.length || 0), 0);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Smart Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
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
            key={group.id}
            open={openGroups.includes(group.id)}
            onOpenChange={() => toggleGroup(group.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 hover:bg-muted"
              >
                <span className="font-medium text-sm">{group.label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openGroups.includes(group.id) ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="px-3 pt-2 pb-3 space-y-2">
              {group.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${group.id}-${option.value}`}
                      checked={((activeFilters[group.id as keyof ActiveFilters] as string[]) || []).includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleFilterChange(group.id, option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${group.id}-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {option.count}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 p-4 border-t">
            {Object.entries(activeFilters).map(([groupId, values]) =>
              (values as string[])?.map(value => {
                const group = filterGroups.find(g => g.id === groupId);
                const option = group?.options.find(o => o.value === value);
                return (
                  <Badge
                    key={`${groupId}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option?.label || value}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange(groupId, value, false)}
                    />
                  </Badge>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
