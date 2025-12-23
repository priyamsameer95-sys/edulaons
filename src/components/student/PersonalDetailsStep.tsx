import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { CoachingTooltip } from './CoachingTooltip';
import { FloatingLabelInput } from './FloatingLabelInput';
import { GENDERS, COACHING_MESSAGES, VALIDATION_PATTERNS, MIN_AGE } from '@/constants/studentApplication';
import { User, UserCircle2, CheckCircle2 } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-filled data notice */}
      {(isNamePrefilled || isPhoneVerified) && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            Some fields are pre-filled from your eligibility check
          </span>
        </div>
      )}

      <div className="space-y-5">
        {/* Row 1: Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
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
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Row 2: Email & DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingLabelInput
            label="Email Address"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder=" "
            error={errors.email}
            isValid={!errors.email && !!data.email && VALIDATION_PATTERNS.email.test(data.email)}
            helperText="For loan updates"
          />

          <FloatingLabelInput
            label="Date of Birth"
            type="date"
            value={data.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE)).toISOString().split('T')[0]}
            error={errors.dateOfBirth}
            isValid={!errors.dateOfBirth && !!data.dateOfBirth}
            helperText={`Must be ${MIN_AGE}+ years`}
            required
          />
        </div>

        {/* Row 3: Gender */}
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
                className="h-11 flex items-center justify-center gap-2"
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

        {/* Row 4: City, State, Postal Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FloatingLabelInput
            label="City"
            value={data.city || ''}
            onChange={(e) => onUpdate({ city: e.target.value })}
            placeholder=" "
            isValid={!!data.city}
            required
          />

          <FloatingLabelInput
            label="State"
            value={data.state || ''}
            onChange={(e) => onUpdate({ state: e.target.value })}
            placeholder=" "
            isValid={!!data.state}
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
            required
          />
        </div>

        {/* Row 5: Credit Score (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="creditScore">Credit Score (Optional)</Label>
            <CoachingTooltip content="Your CIBIL credit score between 300-900. Optional but can improve eligibility." />
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
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" className="min-w-[200px]">
          Next: Academic Background →
        </Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
