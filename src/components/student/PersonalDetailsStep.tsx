import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { GENDERS, VALIDATION_PATTERNS, MIN_AGE } from '@/constants/studentApplication';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
}

const PersonalDetailsStep = ({ data, onUpdate, onNext }: PersonalDetailsStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      case 'phone':
        const cleanPhone = value.replace(/\D/g, '').replace(/^91/, '');
        if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
          return 'Enter valid 10-digit phone number';
        }
        return null;
      case 'email':
        if (value && !VALIDATION_PATTERNS.email.test(value)) {
          return 'Enter a valid email address';
        }
        return null;
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        const age = Math.floor((new Date().getTime() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old`;
        return null;
      case 'postalCode':
        if (!VALIDATION_PATTERNS.postalCode.test(value)) {
          return 'Enter valid 6-digit postal code';
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    ['name', 'phone', 'dateOfBirth', 'postalCode'].forEach(field => {
      const error = validateField(field, (data as any)[field]);
      if (error) newErrors[field] = error;
    });
    
    if (data.email) {
      const emailError = validateField('email', data.email);
      if (emailError) newErrors.email = emailError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    required = false,
    placeholder,
    maxLength,
    disabled = false 
  }: { 
    label: string; 
    field: string; 
    type?: string; 
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={field}
        type={type}
        value={(data as any)[field] || ''}
        onChange={(e) => {
          let value = e.target.value;
          if (field === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
          }
          handleChange(field, value);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "h-11",
          errors[field] && "border-destructive focus-visible:ring-destructive"
        )}
        max={field === 'dateOfBirth' ? new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE)).toISOString().split('T')[0] : undefined}
      />
      {errors[field] && (
        <p className="text-xs text-destructive">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Full Name" field="name" required placeholder="Enter your full name" />
        <InputField label="Phone Number" field="phone" type="tel" required placeholder="10-digit mobile" maxLength={10} />
      </div>

      {/* Email & DOB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Email Address" field="email" type="email" placeholder="your@email.com" />
        <InputField label="Date of Birth" field="dateOfBirth" type="date" required />
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Gender <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-3">
          {GENDERS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={data.gender === value ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "flex-1 min-w-[100px]",
                data.gender === value && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onUpdate({ gender: value })}
            >
              {data.gender === value && <Check className="h-4 w-4 mr-2" />}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputField label="City" field="city" required placeholder="Your city" />
        <InputField label="State" field="state" required placeholder="Your state" />
        <InputField label="Postal Code" field="postalCode" required placeholder="6-digit PIN" maxLength={6} />
      </div>

      {/* Credit Score */}
      <div className="space-y-2">
        <Label htmlFor="creditScore" className="text-sm font-medium text-foreground">
          Credit Score <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="creditScore"
          type="number"
          value={data.creditScore?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            onUpdate({ creditScore: value });
          }}
          placeholder="CIBIL score (300-900)"
          className="h-11 max-w-xs"
          min={300}
          max={900}
        />
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full md:w-auto md:min-w-[200px]">
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
