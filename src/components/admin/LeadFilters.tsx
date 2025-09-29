import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadFiltersProps {
  partners: Array<{ id: string; name: string; partner_code: string }>;
  onFiltersChange: (filters: LeadFilters) => void;
  activeFiltersCount: number;
}

export interface LeadFilters {
  search: string;
  partnerId: string;
  status: string;
  loanAmountMin: string;
  loanAmountMax: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const LeadFilters = ({ partners, onFiltersChange, activeFiltersCount }: LeadFiltersProps) => {
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    partnerId: 'all',
    status: 'all',
    loanAmountMin: '',
    loanAmountMax: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  const updateFilters = (newFilters: Partial<LeadFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: LeadFilters = {
      search: '',
      partnerId: 'all',
      status: 'all',
      loanAmountMin: '',
      loanAmountMax: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Lead Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Filter and search through leads</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, email, or case ID..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters - Collapsible */}
        {showFilters && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Partner Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Partner</label>
              <Select 
                value={filters.partnerId} 
                onValueChange={(value) => updateFilters({ partnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium mb-1 block">Loan Amount (₹)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.loanAmountMin}
                  onChange={(e) => updateFilters({ loanAmountMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.loanAmountMax}
                  onChange={(e) => updateFilters({ loanAmountMax: e.target.value })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilters({ dateFrom: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilters({ dateTo: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadFilters;