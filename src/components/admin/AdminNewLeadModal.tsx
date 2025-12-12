import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, GraduationCap, Users, ChevronDown, Building2 } from 'lucide-react';
import { cn, convertNumberToWords } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UniversitySelector } from '@/components/ui/university-selector';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { supabase } from '@/integrations/supabase/client';
import { LoadingButton } from '@/components/ui/loading-button';

interface AdminNewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  partners: Array<{ id: string; name: string }>;
}

interface FormData {
  partner_id: string;
  student_name: string;
  student_phone: string;
  student_email: string;
  student_pin_code: string;
  country: string;
  universities: string[];
  intake_month: string;
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
  co_applicant_name: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_relationship: string;
  co_applicant_pin_code: string;
}

const countries = [
  'USA', 'Canada', 'UK', 'Australia', 'Germany', 'Ireland', 'New Zealand', 'Other'
];

const relationships = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

export const AdminNewLeadModal = ({ open, onOpenChange, onSuccess, partners }: AdminNewLeadModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amountInWords, setAmountInWords] = useState('');
  const [coApplicantOpen, setCoApplicantOpen] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    partner_id: '',
    student_name: '',
    student_phone: '',
    student_email: '',
    student_pin_code: '',
    country: '',
    universities: [''],
    intake_month: '',
    loan_type: '',
    amount_requested: '',
    co_applicant_name: '',
    co_applicant_phone: '',
    co_applicant_salary: '',
    co_applicant_relationship: '',
    co_applicant_pin_code: '',
  });

  const resetForm = () => {
    setFormData({
      partner_id: '',
      student_name: '',
      student_phone: '',
      student_email: '',
      student_pin_code: '',
      country: '',
      universities: [''],
      intake_month: '',
      loan_type: '',
      amount_requested: '',
      co_applicant_name: '',
      co_applicant_phone: '',
      co_applicant_salary: '',
      co_applicant_relationship: '',
      co_applicant_pin_code: '',
    });
    setAmountInWords('');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'amount_requested') {
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) {
        setAmountInWords(convertNumberToWords(num));
      } else {
        setAmountInWords('');
      }
    }
  };

  const handleUniversitiesChange = useCallback((universities: string[]) => {
    setFormData((prev) => ({ ...prev, universities }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.partner_id) {
      toast({ title: 'Select Partner', description: 'Please select a partner to attribute this lead to', variant: 'destructive' });
      return false;
    }
    if (!formData.student_name.trim()) {
      toast({ title: 'Missing Student Name', variant: 'destructive' });
      return false;
    }
    if (!formData.student_phone.trim()) {
      toast({ title: 'Missing Student Phone', variant: 'destructive' });
      return false;
    }
    if (!formData.student_pin_code.trim() || !/^\d{6}$/.test(formData.student_pin_code)) {
      toast({ title: 'Invalid PIN Code', description: 'Enter a 6-digit PIN code', variant: 'destructive' });
      return false;
    }
    if (!formData.country) {
      toast({ title: 'Select Country', variant: 'destructive' });
      return false;
    }
    if (!formData.intake_month) {
      toast({ title: 'Select Intake', variant: 'destructive' });
      return false;
    }
    if (!formData.loan_type) {
      toast({ title: 'Select Loan Type', variant: 'destructive' });
      return false;
    }
    if (!formData.amount_requested || parseFloat(formData.amount_requested) < 100000) {
      toast({ title: 'Invalid Amount', description: 'Minimum loan amount is ₹1 lakh', variant: 'destructive' });
      return false;
    }
    if (!formData.co_applicant_name.trim()) {
      toast({ title: 'Missing Co-Applicant Name', variant: 'destructive' });
      return false;
    }
    if (!formData.co_applicant_phone.trim()) {
      toast({ title: 'Missing Co-Applicant Phone', variant: 'destructive' });
      return false;
    }
    if (!formData.co_applicant_salary.trim() || parseFloat(formData.co_applicant_salary) <= 0) {
      toast({ title: 'Invalid Salary', variant: 'destructive' });
      return false;
    }
    if (!formData.co_applicant_relationship) {
      toast({ title: 'Select Relationship', variant: 'destructive' });
      return false;
    }
    if (!formData.co_applicant_pin_code.trim() || !/^\d{6}$/.test(formData.co_applicant_pin_code)) {
      toast({ title: 'Invalid Co-Applicant PIN Code', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Process universities
      const processedUniversities = await Promise.all(
        formData.universities
          .filter((u) => u && u.trim())
          .map(async (uni) => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
            if (isUUID) return uni;

            const { data: newUni, error } = await supabase
              .from('universities')
              .insert({ name: uni.trim(), country: formData.country, city: 'Unknown' })
              .select('id')
              .single();

            if (error) throw new Error(`Failed to add university: ${uni}`);
            return newUni.id;
          })
      );

      const payload = {
        partner_id: formData.partner_id,
        student_name: formData.student_name,
        student_phone: formData.student_phone,
        student_email: formData.student_email || undefined,
        student_pin_code: formData.student_pin_code,
        country: formData.country,
        universities: processedUniversities,
        intake_month: formData.intake_month,
        loan_type: formData.loan_type,
        amount_requested: formData.amount_requested,
        co_applicant_name: formData.co_applicant_name,
        co_applicant_phone: formData.co_applicant_phone,
        co_applicant_salary: formData.co_applicant_salary,
        co_applicant_relationship: formData.co_applicant_relationship,
        co_applicant_pin_code: formData.co_applicant_pin_code,
      };

      const { data, error } = await supabase.functions.invoke('create-lead', { body: payload });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to create lead');

      toast({
        title: 'Lead Created',
        description: `Case ${data.lead.case_id} created for partner`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Failed to Create Lead',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) resetForm(); onOpenChange(newOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Lead on Behalf of Partner
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Selection */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <Label className="text-sm font-medium">Select Partner *</Label>
              <Select value={formData.partner_id} onValueChange={(v) => handleInputChange('partner_id', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">This lead will be attributed to the selected partner</p>
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={formData.student_name} onChange={(e) => handleInputChange('student_name', e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <Label>Mobile *</Label>
                  <Input value={formData.student_phone} onChange={(e) => handleInputChange('student_phone', e.target.value)} placeholder="9876543210" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.student_email} onChange={(e) => handleInputChange('student_email', e.target.value)} placeholder="student@example.com" />
                </div>
                <div>
                  <Label>PIN Code *</Label>
                  <Input value={formData.student_pin_code} onChange={(e) => handleInputChange('student_pin_code', e.target.value)} placeholder="110001" maxLength={6} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Study Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Destination Country *</Label>
                  <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Intake *</Label>
                  <MonthYearPicker value={formData.intake_month} onChange={(v) => handleInputChange('intake_month', v)} />
                </div>
              </div>

              {formData.country && (
                <div>
                  <Label>University</Label>
                  <UniversitySelector country={formData.country} universities={formData.universities} onChange={handleUniversitiesChange} />
                </div>
              )}

              <div>
                <Label>Loan Type *</Label>
                <RadioGroup value={formData.loan_type} onValueChange={(v) => handleInputChange('loan_type', v as 'secured' | 'unsecured')} className="flex gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="secured" id="secured" />
                    <Label htmlFor="secured" className="font-normal">Secured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unsecured" id="unsecured" />
                    <Label htmlFor="unsecured" className="font-normal">Unsecured</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Loan Amount (₹) *</Label>
                <Input type="number" value={formData.amount_requested} onChange={(e) => handleInputChange('amount_requested', e.target.value)} placeholder="2500000" />
                {amountInWords && <p className="text-xs text-muted-foreground mt-1">{amountInWords}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Co-Applicant */}
          <Collapsible open={coApplicantOpen} onOpenChange={setCoApplicantOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Co-Applicant Details
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', coApplicantOpen && 'rotate-180')} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={formData.co_applicant_name} onChange={(e) => handleInputChange('co_applicant_name', e.target.value)} placeholder="Parent/Guardian name" />
                    </div>
                    <div>
                      <Label>Relationship *</Label>
                      <Select value={formData.co_applicant_relationship} onValueChange={(v) => handleInputChange('co_applicant_relationship', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {relationships.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mobile *</Label>
                      <Input value={formData.co_applicant_phone} onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)} placeholder="9876543210" />
                    </div>
                    <div>
                      <Label>Monthly Salary (₹) *</Label>
                      <Input type="number" value={formData.co_applicant_salary} onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)} placeholder="50000" />
                    </div>
                  </div>
                  <div>
                    <Label>PIN Code *</Label>
                    <Input value={formData.co_applicant_pin_code} onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value)} placeholder="110001" maxLength={6} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={loading} loadingText="Creating Lead...">
              Create Lead
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
