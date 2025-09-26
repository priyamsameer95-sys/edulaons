import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, GraduationCap, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UniversityCombobox } from "@/components/ui/university-combobox";

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  student_name: string;
  student_phone: string;
  student_email: string;
  country: string;
  university: string;
  intake: Date | undefined;
  loan_type: 'secured' | 'unsecured' | '';
  amount_requested: string;
}

interface FormErrors {
  student_name?: string;
  student_phone?: string;
  student_email?: string;
  country?: string;
  university?: string;
  intake?: string;
  loan_type?: string;
  amount_requested?: string;
}

export const NewLeadModal = ({ open, onOpenChange, onSuccess }: NewLeadModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    student_name: '',
    student_phone: '',
    student_email: '',
    country: '',
    university: '',
    intake: undefined,
    loan_type: '',
    amount_requested: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();

  const countries = [
    'United States',
    'Canada', 
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Netherlands',
    'Singapore',
    'Ireland',
    'New Zealand'
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Student name validation
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Full name is required';
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = 'Name must be at least 2 characters';
    }

    // Phone validation (Indian 10-digit or E.164 format)
    const phoneRegex = /^(\+[\d]{1,3}[\d\s\-\(\)]{7,14}|[\d]{10})$/;
    if (!formData.student_phone.trim()) {
      newErrors.student_phone = 'Mobile number is required';
    } else if (!phoneRegex.test(formData.student_phone.replace(/\s/g, ''))) {
      newErrors.student_phone = 'Please enter a valid mobile number';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.student_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.student_email)) {
        newErrors.student_email = 'Please enter a valid email address';
      }
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    // University validation
    if (!formData.university.trim()) {
      newErrors.university = 'University name is required';
    }

    // Intake validation
    if (!formData.intake) {
      newErrors.intake = 'Please select an intake date';
    }

    // Loan type validation
    if (!formData.loan_type) {
      newErrors.loan_type = 'Please select a loan type';
    }

    // Amount validation
    const amount = parseFloat(formData.amount_requested);
    if (!formData.amount_requested.trim()) {
      newErrors.amount_requested = 'Loan amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount_requested = 'Please enter a valid amount greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Format intake as ISO string (YYYY-MM format)
      const intakeISO = formData.intake ? format(formData.intake, 'yyyy-MM') : '';

      // Mock API call - replace with actual RPC call
      // const { data, error } = await supabase.rpc('partner_create_lead', {
      //   p_student_name: formData.student_name.trim(),
      //   p_student_phone: formData.student_phone.trim(),
      //   p_student_email: formData.student_email.trim() || null,
      //   p_country: formData.country,
      //   p_university: formData.university.trim(),
      //   p_intake: intakeISO,
      //   p_loan_type: formData.loan_type,
      //   p_amount_req: parseFloat(formData.amount_requested)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful response
      const mockCaseId = `EDU-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      toast({
        title: "Lead Created Successfully",
        description: `New lead created • Case ${mockCaseId}`,
      });

      // Reset form
      setFormData({
        student_name: '',
        student_phone: '',
        student_email: '',
        country: '',
        university: '',
        intake: undefined,
        loan_type: '',
        amount_requested: ''
      });
      setErrors({});

      // Close modal and trigger parent callback
      onOpenChange(false);
      onSuccess();

    } catch (error) {
      toast({
        title: "Error Creating Lead",
        description: "Unable to create new lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information Section */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="student_name" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Enter student's full name"
                  className={errors.student_name ? 'border-destructive' : ''}
                />
                {errors.student_name && (
                  <p className="text-sm text-destructive">{errors.student_name}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="student_phone" className="text-sm font-medium">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="student_phone"
                  value={formData.student_phone}
                  onChange={(e) => handleInputChange('student_phone', e.target.value)}
                  placeholder="10-digit Indian number or +Country Code"
                  className={errors.student_phone ? 'border-destructive' : ''}
                />
                {errors.student_phone && (
                  <p className="text-sm text-destructive">{errors.student_phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="student_email" className="text-sm font-medium">
                  Email Address <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleInputChange('student_email', e.target.value)}
                  placeholder="student@example.com"
                  className={errors.student_email ? 'border-destructive' : ''}
                />
                {errors.student_email && (
                  <p className="text-sm text-destructive">{errors.student_email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Case Information Section */}
          <Card className="border-muted">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                Case Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, country: value }));
                      if (errors.country) {
                        setErrors(prev => ({ ...prev, country: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-sm text-destructive">{errors.country}</p>
                  )}
                </div>

                {/* University */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    University <span className="text-destructive">*</span>
                  </Label>
                  <UniversityCombobox
                    country={formData.country}
                    value={formData.university}
                    onChange={(value) => handleInputChange('university', value)}
                    placeholder="Search or type university name"
                    error={errors.university}
                  />
                  {errors.university && (
                    <p className="text-sm text-destructive">{errors.university}</p>
                  )}
                </div>
              </div>

              {/* Intake Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Intake <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.intake && "text-muted-foreground",
                        errors.intake && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.intake ? format(formData.intake, "MMM yyyy") : "Select intake month"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.intake}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, intake: date }));
                        if (errors.intake) {
                          setErrors(prev => ({ ...prev, intake: undefined }));
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.intake && (
                  <p className="text-sm text-destructive">{errors.intake}</p>
                )}
              </div>

              {/* Loan Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Loan Type <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.loan_type}
                  onValueChange={(value: 'secured' | 'unsecured') => {
                    setFormData(prev => ({ ...prev, loan_type: value }));
                    if (errors.loan_type) {
                      setErrors(prev => ({ ...prev, loan_type: undefined }));
                    }
                  }}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secured" id="secured" />
                    <Label htmlFor="secured" className="font-normal">Secured</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsecured" id="unsecured" />
                    <Label htmlFor="unsecured" className="font-normal">Unsecured</Label>
                  </div>
                </RadioGroup>
                {errors.loan_type && (
                  <p className="text-sm text-destructive">{errors.loan_type}</p>
                )}
              </div>

              {/* Requested Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount_requested" className="text-sm font-medium">
                  Requested Amount (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount_requested"
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => handleInputChange('amount_requested', e.target.value)}
                  placeholder="Enter loan amount in rupees"
                  min="1"
                  step="1000"
                  className={errors.amount_requested ? 'border-destructive' : ''}
                />
                {errors.amount_requested && (
                  <p className="text-sm text-destructive">{errors.amount_requested}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:bg-primary-hover min-w-24"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};