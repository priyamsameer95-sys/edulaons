import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  Grid3x3,
  List,
  Loader2
} from 'lucide-react';
import { LenderManagementCard } from './LenderManagementCard';
import { CreateLenderModal } from './CreateLenderModal';
import { EditLenderModal } from './EditLenderModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate: number | null;
  is_active: boolean;
  key_features: any;
  eligible_expenses: any;
  required_documents: any;
  created_at: string;
}

export function LendersManagementTab() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [filteredLenders, setFilteredLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'rate'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLenders();
  }, []);

  useEffect(() => {
    filterAndSortLenders();
  }, [lenders, searchTerm, statusFilter, sortBy]);

  const fetchLenders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .order('display_order', { ascending: true });

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

  const filterAndSortLenders = () => {
    let filtered = [...lenders];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lender => 
        lender.name.toLowerCase().includes(search) ||
        lender.code.toLowerCase().includes(search) ||
        lender.description?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lender => 
        statusFilter === 'active' ? lender.is_active : !lender.is_active
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rate':
          return (a.interest_rate_min || 999) - (b.interest_rate_min || 999);
        default:
          return 0;
      }
    });

    setFilteredLenders(filtered);
  };

  const handleToggleStatus = async (lender: Lender) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .update({ is_active: !lender.is_active })
        .eq('id', lender.id);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `${lender.name} is now ${!lender.is_active ? 'active' : 'inactive'}`,
      });

      fetchLenders();
    } catch (error) {
      console.error('Error updating status:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Lender Management</h2>
          <p className="text-muted-foreground">Manage lenders, features, and eligibility criteria</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lender
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lenders by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="created">Sort by Newest</SelectItem>
            <SelectItem value="rate">Sort by Interest Rate</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3x3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Total Lenders</p>
          <p className="text-2xl font-bold">{lenders.length}</p>
        </div>
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 border border-success/20">
          <p className="text-sm font-medium text-muted-foreground">Active Lenders</p>
          <p className="text-2xl font-bold text-success">
            {lenders.filter(l => l.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-muted/50 to-muted/25 rounded-lg p-4 border">
          <p className="text-sm font-medium text-muted-foreground">Inactive Lenders</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {lenders.filter(l => !l.is_active).length}
          </p>
        </div>
      </div>

      {/* Lenders Grid/List */}
      {filteredLenders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'No lenders match your filters'
              : 'No lenders added yet'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Lender
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
        }>
          {filteredLenders.map((lender) => (
            <LenderManagementCard
              key={lender.id}
              lender={lender}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateLenderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchLenders}
      />

      {selectedLender && (
        <EditLenderModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={fetchLenders}
          lenderId={selectedLender.id}
        />
      )}
    </div>
  );
}
