import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BREConfigTab, type SimplifiedBREData } from './lender-config/BREConfigTab';
import { useAuth } from '@/hooks/useAuth';
import type { PremiumUniversity } from './lender-config/PremiumUniversitiesSection';
import type { RankedUniversity } from './lender-config/RankedUniversitiesSection';
import type { Json } from '@/integrations/supabase/types';

interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
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
  bre_text?: string | null;
  bre_updated_at?: string | null;
  bre_updated_by?: string | null;
  university_restrictions?: Json | null;
}

interface EditLenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lender: Lender;
  onSuccess: () => void;
}

export function EditLenderModal({
  open,
  onOpenChange,
  lender,
  onSuccess,
}: EditLenderModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    interest_rate_min: '',
    interest_rate_max: '',
    loan_amount_min: '',
    loan_amount_max: '',
    processing_fee: '',
    foreclosure_charges: '',
    processing_time_days: '',
    disbursement_time_days: '',
    approval_rate: '',
    moratorium_period: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    logo_url: '',
  });

  const [breData, setBreData] = useState<SimplifiedBREData>({
    bre_text: '',
    bre_updated_at: null,
    bre_updated_by: null,
    premium_universities: [],
    ranked_universities: [],
  });

  const [originalBreText, setOriginalBreText] = useState<string>('');
  const [originalPremiumUniversities, setOriginalPremiumUniversities] = useState<PremiumUniversity[]>([]);
  const [originalRankedUniversities, setOriginalRankedUniversities] = useState<RankedUniversity[]>([]);

  useEffect(() => {
    if (lender) {
      setFormData({
        name: lender.name || '',
        code: lender.code || '',
        description: lender.description || '',
        interest_rate_min: lender.interest_rate_min?.toString() || '',
        interest_rate_max: lender.interest_rate_max?.toString() || '',
        loan_amount_min: lender.loan_amount_min?.toString() || '',
        loan_amount_max: lender.loan_amount_max?.toString() || '',
        processing_fee: lender.processing_fee?.toString() || '',
        foreclosure_charges: lender.foreclosure_charges?.toString() || '',
        processing_time_days: lender.processing_time_days?.toString() || '',
        disbursement_time_days: lender.disbursement_time_days?.toString() || '',
        approval_rate: lender.approval_rate?.toString() || '',
        moratorium_period: lender.moratorium_period || '',
        contact_email: lender.contact_email || '',
        contact_phone: lender.contact_phone || '',
        website: lender.website || '',
        logo_url: lender.logo_url || '',
      });

      // Parse premium and ranked universities from university_restrictions
      const restrictions = lender.university_restrictions as { 
        premium?: PremiumUniversity[]; 
        ranked?: RankedUniversity[];
        updated_at?: string 
      } | null;
      const premiumUniversities = restrictions?.premium || [];
      const rankedUniversities = restrictions?.ranked || [];

      // Set BRE data from lender
      setBreData({
        bre_text: lender.bre_text || '',
        bre_updated_at: lender.bre_updated_at || null,
        bre_updated_by: lender.bre_updated_by || null,
        premium_universities: premiumUniversities,
        ranked_universities: rankedUniversities,
      });
      setOriginalBreText(lender.bre_text || '');
      setOriginalPremiumUniversities(premiumUniversities);
      setOriginalRankedUniversities(rankedUniversities);
    }
  }, [lender]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if BRE text or universities were modified
      const breTextChanged = breData.bre_text !== originalBreText;
      const premiumChanged = JSON.stringify(breData.premium_universities || []) !== JSON.stringify(originalPremiumUniversities);
      const rankedChanged = JSON.stringify(breData.ranked_universities || []) !== JSON.stringify(originalRankedUniversities);
      const universitiesChanged = premiumChanged || rankedChanged;

      const updateData: Record<string, unknown> = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        interest_rate_min: formData.interest_rate_min ? parseFloat(formData.interest_rate_min) : null,
        interest_rate_max: formData.interest_rate_max ? parseFloat(formData.interest_rate_max) : null,
        loan_amount_min: formData.loan_amount_min ? parseFloat(formData.loan_amount_min) : null,
        loan_amount_max: formData.loan_amount_max ? parseFloat(formData.loan_amount_max) : null,
        processing_fee: formData.processing_fee ? parseFloat(formData.processing_fee) : null,
        foreclosure_charges: formData.foreclosure_charges ? parseFloat(formData.foreclosure_charges) : null,
        processing_time_days: formData.processing_time_days ? parseInt(formData.processing_time_days) : null,
        disbursement_time_days: formData.disbursement_time_days ? parseInt(formData.disbursement_time_days) : null,
        approval_rate: formData.approval_rate ? parseFloat(formData.approval_rate) : null,
        moratorium_period: formData.moratorium_period || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        logo_url: formData.logo_url || null,
        // Always update bre_text
        bre_text: breData.bre_text || null,
        // Save premium and ranked universities to university_restrictions JSONB
        university_restrictions: {
          premium: breData.premium_universities || [],
          ranked: breData.ranked_universities || [],
          updated_at: universitiesChanged ? new Date().toISOString() : undefined,
        },
      };

      // Only update bre_updated_at and bre_updated_by if BRE text was changed
      if (breTextChanged) {
        updateData.bre_updated_at = new Date().toISOString();
        updateData.bre_updated_by = user?.id || null;
      }

      const { error } = await supabase
        .from('lenders')
        .update(updateData)
        .eq('id', lender.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lender updated successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating lender:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lender',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lender</DialogTitle>
          <DialogDescription>
            Update lender details and financial terms
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="bre">BRE Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lender Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., HDFC Credila"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Lender Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g., HDFC_CREDILA"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the lender..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interest_rate_min">Min Interest Rate (%)</Label>
                <Input
                  id="interest_rate_min"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate_min}
                  onChange={(e) => handleChange('interest_rate_min', e.target.value)}
                  placeholder="e.g., 9.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_rate_max">Max Interest Rate (%)</Label>
                <Input
                  id="interest_rate_max"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate_max}
                  onChange={(e) => handleChange('interest_rate_max', e.target.value)}
                  placeholder="e.g., 12.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_amount_min">Min Loan Amount (₹)</Label>
                <Input
                  id="loan_amount_min"
                  type="number"
                  value={formData.loan_amount_min}
                  onChange={(e) => handleChange('loan_amount_min', e.target.value)}
                  placeholder="e.g., 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_amount_max">Max Loan Amount (₹)</Label>
                <Input
                  id="loan_amount_max"
                  type="number"
                  value={formData.loan_amount_max}
                  onChange={(e) => handleChange('loan_amount_max', e.target.value)}
                  placeholder="e.g., 10000000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processing_fee">Processing Fee (%)</Label>
                <Input
                  id="processing_fee"
                  type="number"
                  step="0.01"
                  value={formData.processing_fee}
                  onChange={(e) => handleChange('processing_fee', e.target.value)}
                  placeholder="e.g., 1.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foreclosure_charges">Foreclosure Charges (%)</Label>
                <Input
                  id="foreclosure_charges"
                  type="number"
                  step="0.01"
                  value={formData.foreclosure_charges}
                  onChange={(e) => handleChange('foreclosure_charges', e.target.value)}
                  placeholder="e.g., 2.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processing_time_days">Processing Time (days)</Label>
                <Input
                  id="processing_time_days"
                  type="number"
                  value={formData.processing_time_days}
                  onChange={(e) => handleChange('processing_time_days', e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disbursement_time_days">Disbursement Time (days)</Label>
                <Input
                  id="disbursement_time_days"
                  type="number"
                  value={formData.disbursement_time_days}
                  onChange={(e) => handleChange('disbursement_time_days', e.target.value)}
                  placeholder="e.g., 7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approval_rate">Approval Rate (%)</Label>
                <Input
                  id="approval_rate"
                  type="number"
                  step="0.01"
                  value={formData.approval_rate}
                  onChange={(e) => handleChange('approval_rate', e.target.value)}
                  placeholder="e.g., 85"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moratorium_period">Moratorium Period</Label>
              <Input
                id="moratorium_period"
                value={formData.moratorium_period}
                onChange={(e) => handleChange('moratorium_period', e.target.value)}
                placeholder="e.g., Course duration + 12 months"
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contact@lender.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+91 1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.lender.com"
              />
            </div>
          </TabsContent>

          <TabsContent value="bre" className="space-y-4 pt-4">
            <BREConfigTab data={breData} onChange={setBreData} />
          </TabsContent>

        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Lender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
