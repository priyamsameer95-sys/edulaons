import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';
import { Loader2, Mail, Phone, Globe, TrendingUp, Clock, DollarSign } from 'lucide-react';

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
  processing_fee: number | null;
  foreclosure_charges: number | null;
  processing_time_days: number | null;
  disbursement_time_days: number | null;
  approval_rate: number | null;
  moratorium_period: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
}

interface LenderDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lender: Lender;
}

export function LenderDetailsSheet({
  open,
  onOpenChange,
  lender,
}: LenderDetailsSheetProps) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeLeads: 0,
    approvedLeads: 0,
    totalLoanAmount: 0,
    loading: true,
  });

  useEffect(() => {
    if (open && lender) {
      fetchLenderStats();
    }
  }, [open, lender]);

  const fetchLenderStats = async () => {
    try {
      const { data, error } = await supabase
        .from('leads_new')
        .select('id, status, loan_amount')
        .eq('lender_id', lender.id);

      if (error) throw error;

      const totalLeads = data?.length || 0;
      const activeLeads = data?.filter((l) => l.status === 'in_progress').length || 0;
      const approvedLeads = data?.filter((l) => l.status === 'approved').length || 0;
      const totalLoanAmount = data?.reduce((sum, l) => sum + (l.loan_amount || 0), 0) || 0;

      setStats({
        totalLeads,
        activeLeads,
        approvedLeads,
        totalLoanAmount,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching lender stats:', error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {lender.name}
            <Badge variant={lender.is_active ? 'default' : 'secondary'}>
              {lender.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {lender.code} • Detailed lender information and statistics
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Performance Statistics</h3>
            {stats.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.totalLeads}</div>
                  <div className="text-sm text-muted-foreground">Total Leads</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.activeLeads}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.approvedLeads}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalLoanAmount)}</div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {lender.description && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{lender.description}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Financial Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Financial Details</h3>
            <div className="space-y-3">
              {lender.interest_rate_min && lender.interest_rate_max && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Interest Rate:</span>
                  <span className="text-sm font-medium ml-auto">
                    {lender.interest_rate_min}% - {lender.interest_rate_max}%
                  </span>
                </div>
              )}
              {lender.loan_amount_min && lender.loan_amount_max && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Loan Range:</span>
                  <span className="text-sm font-medium ml-auto">
                    {formatCurrency(lender.loan_amount_min)} - {formatCurrency(lender.loan_amount_max)}
                  </span>
                </div>
              )}
              {lender.processing_fee && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Processing Fee:</span>
                  <span className="text-sm font-medium ml-auto">{lender.processing_fee}%</span>
                </div>
              )}
              {lender.foreclosure_charges && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Foreclosure Charges:</span>
                  <span className="text-sm font-medium ml-auto">{lender.foreclosure_charges}%</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Processing Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Processing Information</h3>
            <div className="space-y-3">
              {lender.processing_time_days && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Processing Time:</span>
                  <span className="text-sm font-medium ml-auto">{lender.processing_time_days} days</span>
                </div>
              )}
              {lender.disbursement_time_days && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Disbursement Time:</span>
                  <span className="text-sm font-medium ml-auto">{lender.disbursement_time_days} days</span>
                </div>
              )}
              {lender.approval_rate && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Approval Rate:</span>
                  <span className="text-sm font-medium ml-auto">{lender.approval_rate}%</span>
                </div>
              )}
              {lender.moratorium_period && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Moratorium Period:</span>
                  <span className="text-sm font-medium ml-auto">{lender.moratorium_period}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
            <div className="space-y-3">
              {lender.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${lender.contact_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {lender.contact_email}
                  </a>
                </div>
              )}
              {lender.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${lender.contact_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {lender.contact_phone}
                  </a>
                </div>
              )}
              {lender.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={lender.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {lender.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
