import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { CoachingTooltip } from './CoachingTooltip';
import { FloatingLabelInput } from './FloatingLabelInput';
import { GENDERS, COACHING_MESSAGES, VALIDATION_PATTERNS, MIN_AGE } from '@/constants/studentApplication';
import { User, UserCircle2, CheckCircle2, Mail } from 'lucide-react';

interface PersonalDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
}

const PersonalDetailsStep = ({ data, onUpdate, onNext }: PersonalDetailsStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if phone was pre-filled from eligibility (verified via OTP)
  const isPhoneVerified = Boolean(data.phone && data.phone.length === 10 && data.phoneVerified !== false);
  const isNamePrefilled = Boolean(data.name && data.name.trim().length >= 2);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      case 'phone':
        // Remove any non-digit characters and leading +91
        const cleanPhone = value.replace(/\D/g, '').replace(/^91/, '');
        if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
          return 'Enter valid 10-digit phone number starting with 6-9';
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
    
    // Validate all required fields
    const newErrors: Record<string, string> = {};
    ['name', 'phone', 'dateOfBirth', 'postalCode'].forEach(field => {
      const error = validateField(field, (data as any)[field]);
      if (error) newErrors[field] = error;
    });
    
    // Validate email if provided
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

  const completedFields = ['name', 'phone', 'email', 'dateOfBirth', 'gender', 'city', 'state', 'postalCode']
    .filter(field => data[field as keyof typeof data]).length;
  const totalFields = 8;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Progress indicator */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 stagger-fade-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Profile Completion</span>
          <span className="text-sm text-muted-foreground">{completedFields}/{totalFields} fields</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedFields / totalFields) * 100}%` }}
          />
        </div>
      </div>

      {/* Pre-filled data notice */}
      {(isNamePrefilled || isPhoneVerified) && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Some fields are pre-filled from your eligibility check
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-fade-2">
        <div className="space-y-1">
          <FloatingLabelInput
            label="Full Name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder=" "
            error={errors.name}
            isValid={!errors.name && !!data.name}
            helperText="As per passport/ID"
            required
          />
          {isNamePrefilled && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Pre-filled
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <FloatingLabelInput
            label="Phone Number"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleChange('phone', cleaned);
            }}
            placeholder=" "
            maxLength={10}
            error={errors.phone}
            isValid={!errors.phone && !!data.phone && data.phone.length === 10}
            helperText="10-digit mobile number"
            required
            disabled={isPhoneVerified}
          />
          {isPhoneVerified && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Phone Verified
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <FloatingLabelInput
            label="Email Address"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder=" "
            error={errors.email}
            isValid={!errors.email && !!data.email && VALIDATION_PATTERNS.email.test(data.email)}
            helperText="For loan updates & communication"
          />
        </div>

        <FloatingLabelInput
          label="Date of Birth"
          type="date"
          value={data.dateOfBirth || ''}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE)).toISOString().split('T')[0]}
          error={errors.dateOfBirth}
          isValid={!errors.dateOfBirth && !!data.dateOfBirth}
          helperText={`Must be at least ${MIN_AGE} years old`}
          required
        />

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="gender">Gender *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.gender} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={data.gender === value ? 'default' : 'outline'}
                className="h-12 flex items-center justify-center gap-2"
                onClick={() => onUpdate({ gender: value })}
              >
                {value === 'male' && <User className="h-4 w-4" />}
                {value === 'female' && <UserCircle2 className="h-4 w-4" />}
                {value === 'other' && <UserCircle2 className="h-4 w-4" />}
                {label}
              </Button>
            ))}
          </div>
        </div>

        <FloatingLabelInput
          label="City"
          value={data.city || ''}
          onChange={(e) => onUpdate({ city: e.target.value })}
          placeholder=" "
          isValid={!!data.city}
          helperText="Your current city"
          required
        />

        <FloatingLabelInput
          label="State"
          value={data.state || ''}
          onChange={(e) => onUpdate({ state: e.target.value })}
          placeholder=" "
          isValid={!!data.state}
          helperText="Your state/province"
          required
        />

        <FloatingLabelInput
          label="Postal Code"
          value={data.postalCode || ''}
          onChange={(e) => handleChange('postalCode', e.target.value)}
          placeholder=" "
          maxLength={6}
          error={errors.postalCode}
          isValid={!errors.postalCode && !!data.postalCode && data.postalCode.length === 6}
          helperText="6-digit PIN code"
          required
        />

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="creditScore">Credit Score (Optional)</Label>
            <CoachingTooltip content="Your CIBIL credit score between 300-900. This is optional but can improve your eligibility assessment." />
          </div>
          <FloatingLabelInput
            label="Credit Score"
            type="number"
            value={data.creditScore?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined;
              onUpdate({ creditScore: value });
            }}
            placeholder=" "
            helperText="CIBIL score (300-900)"
            isValid={!!data.creditScore && data.creditScore >= 300 && data.creditScore <= 900}
          />
          {data.creditScore && data.creditScore >= 300 && data.creditScore <= 900 && (
            <p className="text-sm text-muted-foreground">
              {data.creditScore >= 750 ? '✓ Excellent credit score' :
               data.creditScore >= 700 ? '✓ Good credit score' :
               data.creditScore >= 650 ? 'Average credit score' :
               'Below average credit score'}
            </p>
          )}
        </div>

      </div>

      <div className="flex justify-end stagger-fade-3">
        <Button type="submit" size="lg" className="min-w-[200px] hover-lift">
          Next: Academic Background →
        </Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
