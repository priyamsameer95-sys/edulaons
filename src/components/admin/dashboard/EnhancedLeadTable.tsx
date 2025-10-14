import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
} from 'lucide-react';
import { RefactoredLead } from '@/types/refactored-lead';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActiveFilters } from '@/pages/AdminDashboard';

interface EnhancedLeadTableProps {
  leads: RefactoredLead[];
  globalFilters?: ActiveFilters;
  onViewLead: (lead: RefactoredLead) => void;
  onUpdateStatus: (lead: RefactoredLead) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  document_review: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  document_review: 'Document Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const EnhancedLeadTable = ({ leads, globalFilters, onViewLead, onUpdateStatus }: EnhancedLeadTableProps) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter leads based on search, local status filter, and global filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Local search
      const matchesSearch = 
        lead.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Local status filter
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      
      // Global filters
      const matchesGlobalStatus = !globalFilters?.status?.length || 
        globalFilters.status.includes(lead.status);
      
      const matchesGlobalDocStatus = !globalFilters?.documents_status?.length || 
        globalFilters.documents_status.includes(lead.documents_status);
      
      const matchesGlobalDestination = !globalFilters?.study_destination?.length || 
        globalFilters.study_destination.includes(lead.study_destination);
      
      const matchesGlobalLoanAmount = !globalFilters?.loan_amount?.length || 
        globalFilters.loan_amount.some(range => {
          const amount = Number(lead.loan_amount);
          switch(range) {
            case '0-10L': return amount < 1000000;
            case '10L-20L': return amount >= 1000000 && amount < 2000000;
            case '20L-30L': return amount >= 2000000 && amount < 3000000;
            case '30L+': return amount >= 3000000;
            default: return true;
          }
        });
      
      return matchesSearch && matchesStatus && matchesGlobalStatus && 
             matchesGlobalDocStatus && matchesGlobalDestination && matchesGlobalLoanAmount;
    });
  }, [leads, searchTerm, filterStatus, globalFilters]);

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getDocumentProgress = (lead: RefactoredLead) => {
    switch (lead.documents_status) {
      case 'verified': return 100;
      case 'uploaded': return 75;
      case 'resubmission_required': return 40;
      case 'pending': return 20;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="document_review">Document Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedLeads.length} selected</span>
            <Button size="sm" variant="outline">
              Update Status
            </Button>
            <Button size="sm" variant="outline">
              Assign Lender
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedLeads([])}>
              Clear
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <Checkbox 
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Documents</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.slice(0, 10).map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(lead.student?.name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{lead.student?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{lead.student?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="outline" 
                      className={statusColors[lead.status] || statusColors.new}
                    >
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{lead.documents_status.replace('_', ' ')}</span>
                        <span className="font-medium">{getDocumentProgress(lead)}%</span>
                      </div>
                      <Progress value={getDocumentProgress(lead)} className="h-2" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewLead(lead)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(lead)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filteredLeads.length > 10 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing 10 of {filteredLeads.length} leads
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
