import { useState, useCallback } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  student_name: string;
  student_phone: string;
  student_pin_code: string;
  country: string;
  co_applicant_relationship: string;
  co_applicant_monthly_salary: string;
}

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  student_pin_code?: string;
  country?: string;
  co_applicant_relationship?: string;
  co_applicant_monthly_salary?: string;
}

const COUNTRIES = [
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "Ireland", label: "Ireland" },
  { value: "New Zealand", label: "New Zealand" },
];

const RELATIONSHIPS = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const initialFormData: FormData = {
  student_name: "",
  student_phone: "",
  student_pin_code: "",
  country: "",
  co_applicant_relationship: "",
  co_applicant_monthly_salary: "",
};

export const QuickLeadModal = ({ open, onClose, onSuccess }: QuickLeadModalProps) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Student name
    if (!formData.student_name.trim()) {
      newErrors.student_name = "Required";
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = "Min 2 characters";
    }

    // Phone
    const cleanPhone = formData.student_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.student_phone = "Required";
    } else if (cleanPhone.length !== 10) {
      newErrors.student_phone = "Must be 10 digits";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.student_phone = "Invalid number";
    }

    // PIN code
    if (!formData.student_pin_code.trim()) {
      newErrors.student_pin_code = "Required";
    } else if (!/^\d{6}$/.test(formData.student_pin_code.trim())) {
      newErrors.student_pin_code = "Must be 6 digits";
    }

    // Country
    if (!formData.country) {
      newErrors.country = "Required";
    }

    // Relationship
    if (!formData.co_applicant_relationship) {
      newErrors.co_applicant_relationship = "Required";
    }

    // Salary
    const salary = parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, ''));
    if (!formData.co_applicant_monthly_salary) {
      newErrors.co_applicant_monthly_salary = "Required";
    } else if (isNaN(salary) || salary < 10000) {
      newErrors.co_applicant_monthly_salary = "Min ₹10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-lead-quick', {
        body: {
          student_name: formData.student_name.trim(),
          student_phone: formData.student_phone.replace(/\D/g, ''),
          student_pin_code: formData.student_pin_code.trim(),
          country: formData.country,
          co_applicant_relationship: formData.co_applicant_relationship,
          co_applicant_monthly_salary: parseFloat(formData.co_applicant_monthly_salary.replace(/,/g, '')),
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create lead');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create lead');
      }

      setCreatedCaseId(data.lead.case_id);
      setShowSuccess(true);
      toast.success('Lead created successfully!');

      // Reset form and close after delay
      setTimeout(() => {
        setFormData(initialFormData);
        setShowSuccess(false);
        setCreatedCaseId(null);
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setErrors({});
      setShowSuccess(false);
      onClose();
    }
  };

  // Format salary with commas
  const formatSalary = (value: string): string => {
    const num = value.replace(/,/g, '').replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('en-IN');
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Lead Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Case ID: {createdCaseId}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Student will receive notification to complete details
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">⚡</span>
            Quick Lead
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Student Name */}
          <div className="space-y-1.5">
            <Label htmlFor="student_name" className="text-xs">
              Student Name *
            </Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => handleInputChange('student_name', e.target.value)}
              placeholder="Full name"
              className={errors.student_name ? 'border-destructive' : ''}
            />
            {errors.student_name && (
              <p className="text-xs text-destructive">{errors.student_name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="student_phone" className="text-xs">
              Phone *
            </Label>
            <Input
              id="student_phone"
              value={formData.student_phone}
              onChange={(e) => handleInputChange('student_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digits"
              className={errors.student_phone ? 'border-destructive' : ''}
            />
            {errors.student_phone && (
              <p className="text-xs text-destructive">{errors.student_phone}</p>
            )}
          </div>

          {/* PIN Code */}
          <div className="space-y-1.5">
            <Label htmlFor="student_pin_code" className="text-xs">
              PIN Code *
            </Label>
            <Input
              id="student_pin_code"
              value={formData.student_pin_code}
              onChange={(e) => handleInputChange('student_pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digits"
              className={errors.student_pin_code ? 'border-destructive' : ''}
            />
            {errors.student_pin_code && (
              <p className="text-xs text-destructive">{errors.student_pin_code}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs">
              Study Destination *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleInputChange('country', value)}
            >
              <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>

          {/* Co-Applicant Relationship */}
          <div className="space-y-1.5">
            <Label htmlFor="relationship" className="text-xs">
              Co-Applicant Type *
            </Label>
            <Select
              value={formData.co_applicant_relationship}
              onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
            >
              <SelectTrigger className={errors.co_applicant_relationship ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.co_applicant_relationship && (
              <p className="text-xs text-destructive">{errors.co_applicant_relationship}</p>
            )}
          </div>

          {/* Salary */}
          <div className="space-y-1.5">
            <Label htmlFor="salary" className="text-xs">
              Monthly Salary *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="salary"
                value={formData.co_applicant_monthly_salary}
                onChange={(e) => handleInputChange('co_applicant_monthly_salary', formatSalary(e.target.value))}
                placeholder="50,000"
                className={`pl-7 ${errors.co_applicant_monthly_salary ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.co_applicant_monthly_salary && (
              <p className="text-xs text-destructive">{errors.co_applicant_monthly_salary}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Lead'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
