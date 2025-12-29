/**
 * Change Lender Modal
 * 
 * Allows students to change their preferred lender
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, 
  Star, 
  Percent, 
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lender {
  id: string;
  name: string;
  code: string;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  processing_time_days: number | null;
  logo_url: string | null;
}

interface ChangeLenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentLenderId: string | null;
  onLenderChanged: () => void;
}

const ChangeLenderModal = ({
  open,
  onOpenChange,
  leadId,
  currentLenderId,
  onLenderChanged
}: ChangeLenderModalProps) => {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(currentLenderId);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLenders();
      setSelectedLenderId(currentLenderId);
    }
  }, [open, currentLenderId]);

  const fetchLenders = async () => {
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('id, name, code, interest_rate_min, interest_rate_max, processing_time_days, logo_url')
        .eq('is_active', true)
        .order('preferred_rank', { ascending: true });

      if (error) throw error;
      setLenders(data || []);
    } catch (err) {
      console.error('Error fetching lenders:', err);
      toast.error('Failed to load lenders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLenderId || selectedLenderId === currentLenderId) {
      onOpenChange(false);
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('leads_new')
        .update({ 
          target_lender_id: selectedLenderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lender preference updated');
      onLenderChanged();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating lender:', err);
      toast.error('Failed to update lender preference');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Change Preferred Lender
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select your preferred lender. You can compare rates and processing times.
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {lenders.map((lender) => {
                const isSelected = selectedLenderId === lender.id;
                const isCurrent = currentLenderId === lender.id;

                return (
                  <button
                    key={lender.id}
                    onClick={() => setSelectedLenderId(lender.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {lender.logo_url ? (
                        <img 
                          src={lender.logo_url} 
                          alt={lender.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{lender.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {lender.interest_rate_min && lender.interest_rate_max && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Percent className="w-3 h-3" />
                            {lender.interest_rate_min}% - {lender.interest_rate_max}%
                          </span>
                        )}
                        {lender.processing_time_days && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {lender.processing_time_days} days
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={updating || selectedLenderId === currentLenderId}
                className="flex-1"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Confirm
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangeLenderModal;
