import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface LenderFormData {
  name: string;
  code: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  interest_rate_min: string;
  interest_rate_max: string;
  loan_amount_min: string;
  loan_amount_max: string;
  processing_fee: string;
  foreclosure_charges: string;
  moratorium_period: string;
  processing_time_days: string;
  disbursement_time_days: string;
  approval_rate: string;
  key_features: string[];
  eligible_expenses: string[];
  required_documents: string[];
  display_order: string;
  is_active: boolean;
}

interface LenderFormFieldsProps {
  form: UseFormReturn<LenderFormData>;
}

export function LenderFormFields({ form }: LenderFormFieldsProps) {
  const addKeyFeature = () => {
    const current = form.getValues('key_features') || [];
    form.setValue('key_features', [...current, '']);
  };

  const removeKeyFeature = (index: number) => {
    const current = form.getValues('key_features') || [];
    form.setValue('key_features', current.filter((_, i) => i !== index));
  };

  const updateKeyFeature = (index: number, value: string) => {
    const current = form.getValues('key_features') || [];
    current[index] = value;
    form.setValue('key_features', [...current]);
  };

  const expenseCategories = [
    'Tuition Fees', 'Living Expenses', 'Travel Costs', 'Books & Supplies',
    'Equipment', 'Accommodation', 'Health Insurance', 'Visa Fees'
  ];

  const documentTypes = [
    'Passport', 'Admission Letter', 'Academic Transcripts', 'Bank Statements',
    'Income Proof', 'Property Documents', 'Co-applicant KYC', 'Test Scores'
  ];

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">1</span>
          Basic Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lender Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HDFC Credila" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lender Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HDFC_CREDILA" {...field} />
                </FormControl>
                <FormDescription>Unique identifier (uppercase, underscores)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the lender and their services..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@lender.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+91 XXX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Financial Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">2</span>
          Financial Details
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="interest_rate_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="9.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interest_rate_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="11.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loan_amount_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Loan Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loan_amount_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Loan Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="processing_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Fee (₹ or %)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1% or 25000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="foreclosure_charges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foreclosure Charges</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2% after 6 months" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="moratorium_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moratorium Period</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Course + 12 months" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Operational Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">3</span>
          Operational Details
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="processing_time_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Time (days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="disbursement_time_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disbursement Time (days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="14" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="approval_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approval Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="85.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormDescription>Lower numbers appear first</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Key Features */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">4</span>
            Key Features
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addKeyFeature}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
        <div className="space-y-2">
          {(form.watch('key_features') || []).map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => updateKeyFeature(index, e.target.value)}
                placeholder="e.g., No collateral required for loans up to ₹40L"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeKeyFeature(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(form.watch('key_features') || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No features added yet. Click "Add Feature" to start.</p>
          )}
        </div>
      </div>

      {/* Eligible Expenses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">5</span>
          Eligible Expenses
        </h3>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((expense) => {
            const isSelected = (form.watch('eligible_expenses') || []).includes(expense);
            return (
              <Badge
                key={expense}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  const current = form.getValues('eligible_expenses') || [];
                  if (isSelected) {
                    form.setValue('eligible_expenses', current.filter(e => e !== expense));
                  } else {
                    form.setValue('eligible_expenses', [...current, expense]);
                  }
                }}
              >
                {expense}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Required Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">6</span>
          Required Documents
        </h3>
        <div className="flex flex-wrap gap-2">
          {documentTypes.map((doc) => {
            const isSelected = (form.watch('required_documents') || []).includes(doc);
            return (
              <Badge
                key={doc}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  const current = form.getValues('required_documents') || [];
                  if (isSelected) {
                    form.setValue('required_documents', current.filter(d => d !== doc));
                  } else {
                    form.setValue('required_documents', [...current, doc]);
                  }
                }}
              >
                {doc}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">7</span>
          Status & Preferences
        </h3>
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Enable this lender for partner selections
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
