import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MoreVertical, Eye, Edit, Trash, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  studentName: string;
  email: string;
  status: 'new' | 'in_progress' | 'approved' | 'rejected';
  documents: { uploaded: number; total: number };
  avatar?: string;
}

// Sample data
const sampleLeads: Lead[] = [
  {
    id: '1',
    studentName: 'Rajesh Kumar',
    email: 'rajesh@gmail.com',
    status: 'in_progress',
    documents: { uploaded: 3, total: 5 },
  },
  {
    id: '2',
    studentName: 'Priya Shah',
    email: 'priya@gmail.com',
    status: 'approved',
    documents: { uploaded: 5, total: 5 },
  },
  {
    id: '3',
    studentName: 'Amit Patel',
    email: 'amit@gmail.com',
    status: 'new',
    documents: { uploaded: 1, total: 5 },
  },
  {
    id: '4',
    studentName: 'Sneha Reddy',
    email: 'sneha@gmail.com',
    status: 'in_progress',
    documents: { uploaded: 4, total: 5 },
  },
  {
    id: '5',
    studentName: 'Vikram Singh',
    email: 'vikram@gmail.com',
    status: 'rejected',
    documents: { uploaded: 5, total: 5 },
  },
];

const statusColors = {
  new: 'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels = {
  new: 'New',
  in_progress: 'In Progress',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const EnhancedLeadTable = () => {
  const [leads, setLeads] = useState(sampleLeads);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? filteredLeads.map((l) => l.id) : []);
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(
      checked
        ? [...selectedLeads, leadId]
        : selectedLeads.filter((id) => id !== leadId)
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Recent Leads</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg animate-fade-in">
            <span className="text-sm font-medium">
              {selectedLeads.length} selected
            </span>
            <Button size="sm" variant="outline">
              Approve
            </Button>
            <Button size="sm" variant="outline">
              Reject
            </Button>
            <Button size="sm" variant="outline">
              Assign Lender
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedLeads([])}
            >
              Clear
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
            <div className="col-span-1 flex items-center">
              <Checkbox
                checked={selectedLeads.length === filteredLeads.length}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div className="col-span-4">Student</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Documents</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Checkbox */}
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) =>
                      handleSelectLead(lead.id, checked as boolean)
                    }
                  />
                </div>

                {/* Student Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(lead.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lead.studentName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {lead.email}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <Badge
                    variant="outline"
                    className={cn('font-medium', statusColors[lead.status])}
                  >
                    {statusLabels[lead.status]}
                  </Badge>
                </div>

                {/* Documents Progress */}
                <div className="col-span-3 flex items-center">
                  <div className="flex items-center gap-2">
                    {lead.documents.uploaded === lead.documents.total ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">
                          {lead.documents.uploaded}/{lead.documents.total}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-warning transition-all"
                            style={{
                              width: `${
                                (lead.documents.uploaded / lead.documents.total) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {lead.documents.uploaded}/{lead.documents.total}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {leads.length} leads
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
