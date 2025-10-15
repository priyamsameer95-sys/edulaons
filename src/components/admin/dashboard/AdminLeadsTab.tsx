import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { TableSkeleton } from '@/components/common/LoadingStates';
import { EnhancedAdminLeadActions } from '@/components/admin/EnhancedAdminLeadActions';
import { useRefactoredLeads } from '@/hooks/useRefactoredLeads';
import { useLeadFiltering } from '@/hooks/useLeadFiltering';

export const AdminLeadsTab = () => {
  const { leads, loading } = useRefactoredLeads();
  const { 
    filteredData, 
    searchTerm, 
    setSearchTerm, 
    activeFilters, 
    setFilter 
  } = useLeadFiltering(leads);
  
  if (loading) return <TableSkeleton rows={10} columns={6} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lead Filters</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select 
              value={activeFilters.partner || 'all'} 
              onValueChange={(value) => setFilter('partner', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={activeFilters.status || 'all'} 
              onValueChange={(value) => setFilter('status', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No leads found matching your filters</p>
            ) : (
              <p className="text-sm text-muted-foreground">{filteredData.length} leads found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
