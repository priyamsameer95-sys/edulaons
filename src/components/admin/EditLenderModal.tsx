import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LenderFormFields, LenderFormData } from './LenderFormFields';
import { LenderLogoUpload } from './LenderLogoUpload';
import { Loader2 } from 'lucide-react';

interface EditLenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lenderId: string;
}

export function EditLenderModal({ open, onOpenChange, onSuccess, lenderId }: EditLenderModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const { toast } = useToast();

  const form = useForm<LenderFormData>({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      logo_url: '',
      interest_rate_min: '',
      interest_rate_max: '',
      loan_amount_min: '',
      loan_amount_max: '',
      processing_fee: '',
      foreclosure_charges: '',
      moratorium_period: '',
      processing_time_days: '',
      disbursement_time_days: '',
      approval_rate: '',
      key_features: [],
      eligible_expenses: [],
      required_documents: [],
      display_order: '0',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && lenderId) {
      fetchLenderData();
    }
  }, [open, lenderId]);

  const fetchLenderData = async () => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('id', lenderId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          website: data.website || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          logo_url: data.logo_url || '',
          interest_rate_min: data.interest_rate_min?.toString() || '',
          interest_rate_max: data.interest_rate_max?.toString() || '',
          loan_amount_min: data.loan_amount_min?.toString() || '',
          loan_amount_max: data.loan_amount_max?.toString() || '',
          processing_fee: data.processing_fee?.toString() || '',
          foreclosure_charges: data.foreclosure_charges?.toString() || '',
          moratorium_period: data.moratorium_period || '',
          processing_time_days: data.processing_time_days?.toString() || '',
          disbursement_time_days: data.disbursement_time_days?.toString() || '',
          approval_rate: data.approval_rate?.toString() || '',
          key_features: Array.isArray(data.key_features) ? (data.key_features as string[]) : [],
          eligible_expenses: Array.isArray(data.eligible_expenses) ? (data.eligible_expenses as string[]) : [],
          required_documents: Array.isArray(data.required_documents) ? (data.required_documents as string[]) : [],
          display_order: data.display_order?.toString() || '0',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching lender:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lender data',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const onSubmit = async (data: LenderFormData) => {
    setLoading(true);

    try {
      // Prepare data for update
      const lenderData = {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        website: data.website || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        logo_url: data.logo_url || null,
        interest_rate_min: data.interest_rate_min ? parseFloat(data.interest_rate_min) : null,
        interest_rate_max: data.interest_rate_max ? parseFloat(data.interest_rate_max) : null,
        loan_amount_min: data.loan_amount_min ? parseFloat(data.loan_amount_min) : null,
        loan_amount_max: data.loan_amount_max ? parseFloat(data.loan_amount_max) : null,
        processing_fee: data.processing_fee ? parseFloat(data.processing_fee) : null,
        foreclosure_charges: data.foreclosure_charges ? parseFloat(data.foreclosure_charges) : null,
        moratorium_period: data.moratorium_period || null,
        processing_time_days: data.processing_time_days ? parseInt(data.processing_time_days) : null,
        disbursement_time_days: data.disbursement_time_days ? parseInt(data.disbursement_time_days) : null,
        approval_rate: data.approval_rate ? parseFloat(data.approval_rate) : null,
        key_features: data.key_features.filter(f => f.trim() !== ''),
        eligible_expenses: data.eligible_expenses,
        required_documents: data.required_documents,
        display_order: parseInt(data.display_order) || 0,
        is_active: data.is_active,
      };

      const { error } = await supabase
        .from('lenders')
        .update(lenderData)
        .eq('id', lenderId);

      if (error) throw error;

      toast({
        title: 'Lender updated',
        description: 'Lender details have been updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lender:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update lender',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Lender</DialogTitle>
          <DialogDescription>
            Update lender details, features, and requirements
          </DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lender Logo</label>
                <LenderLogoUpload
                  currentLogoUrl={form.watch('logo_url')}
                  onLogoChange={(url) => form.setValue('logo_url', url)}
                  lenderCode={form.watch('code') || 'lender'}
                />
              </div>

              {/* Form Fields */}
              <LenderFormFields form={form} />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Lender
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
