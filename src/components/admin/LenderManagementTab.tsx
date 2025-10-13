import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, Plus, Edit, Eye, Power, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateLenderModal } from './CreateLenderModal';
import { EditLenderModal } from './EditLenderModal';
import { LenderDetailsSheet } from './LenderDetailsSheet';
import { formatCurrency } from '@/utils/formatters';

interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate: number | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  processing_fee: number | null;
  foreclosure_charges: number | null;
  disbursement_time_days: number | null;
  moratorium_period: string | null;
  key_features: any;
  required_documents: any;
  eligible_expenses: any;
  display_order: number | null;
}

export function LenderManagementTab() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [filteredLenders, setFilteredLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLenders();
  }, []);

  useEffect(() => {
    filterLenders();
  }, [lenders, searchTerm, showActiveOnly]);

  const fetchLenders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setLenders(data || []);
    } catch (error) {
      console.error('Error fetching lenders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lenders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLenders = () => {
    let filtered = lenders;

    if (showActiveOnly) {
      filtered = filtered.filter((l) => l.is_active);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.code.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term)
      );
    }

    setFilteredLenders(filtered);
  };

  const toggleLenderStatus = async (lender: Lender) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .update({ is_active: !lender.is_active })
        .eq('id', lender.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Lender ${!lender.is_active ? 'activated' : 'deactivated'} successfully`,
      });

      fetchLenders();
    } catch (error) {
      console.error('Error toggling lender status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lender status',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (lender: Lender) => {
    setSelectedLender(lender);
    setShowEditModal(true);
  };

  const handleViewDetails = (lender: Lender) => {
    setSelectedLender(lender);
    setShowDetailsSheet(true);
  };

  const handleSuccess = () => {
    fetchLenders();
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lender Management</CardTitle>
              <CardDescription>
                Manage lenders, view statistics, and update preferences
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lender
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lenders by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showActiveOnly ? 'default' : 'outline'}
              onClick={() => setShowActiveOnly(!showActiveOnly)}
            >
              {showActiveOnly ? 'Active Only' : 'Show All'}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Loan Range</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No lenders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLenders.map((lender) => (
                    <TableRow key={lender.id}>
                      <TableCell className="font-medium">{lender.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lender.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lender.is_active ? 'default' : 'secondary'}>
                          {lender.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lender.interest_rate_min && lender.interest_rate_max
                          ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {lender.loan_amount_min && lender.loan_amount_max
                          ? `${formatCurrency(lender.loan_amount_min)} - ${formatCurrency(lender.loan_amount_max)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {lender.processing_time_days
                          ? `${lender.processing_time_days} days`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(lender)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lender)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLenderStatus(lender)}
                          >
                            <Power
                              className={`h-4 w-4 ${lender.is_active ? 'text-green-600' : 'text-gray-400'}`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateLenderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleSuccess}
      />

      {selectedLender && (
        <>
          <EditLenderModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            lender={selectedLender}
            onSuccess={handleSuccess}
          />
          <LenderDetailsSheet
            open={showDetailsSheet}
            onOpenChange={setShowDetailsSheet}
            lender={selectedLender}
          />
        </>
      )}
    </div>
  );
}
