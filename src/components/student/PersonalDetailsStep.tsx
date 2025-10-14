import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { CoachingTooltip } from './CoachingTooltip';
import { GENDERS, QUALIFICATIONS, COACHING_MESSAGES, VALIDATION_PATTERNS, MIN_AGE } from '@/constants/studentApplication';
import { AlertCircle } from 'lucide-react';

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
        // Remove any non-digit characters and leading +91
        const cleanPhone = value.replace(/\D/g, '').replace(/^91/, '');
        if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
          return 'Enter valid 10-digit phone number starting with 6-9';
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
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    ['name', 'phone', 'dateOfBirth', 'postalCode'].forEach(field => {
      const error = validateField(field, (data as any)[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="name">Full Name *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.name} />
          </div>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="As per passport/ID"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="phone">Phone Number *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.phone} />
          </div>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleChange('phone', cleaned);
            }}
            placeholder="10-digit mobile number"
            maxLength={10}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.dob} />
          </div>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE)).toISOString().split('T')[0]}
            className={errors.dateOfBirth ? 'border-destructive' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.dateOfBirth}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="gender">Gender *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.gender} />
          </div>
          <Select value={data.gender || ''} onValueChange={(value) => onUpdate({ gender: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="city">City *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.city} />
          </div>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => onUpdate({ city: e.target.value })}
            required
            placeholder="e.g., Mumbai"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="state">State *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.state} />
          </div>
          <Input
            id="state"
            value={data.state || ''}
            onChange={(e) => onUpdate({ state: e.target.value })}
            required
            placeholder="e.g., Maharashtra"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="postalCode">Postal Code *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.postalCode} />
          </div>
          <Input
            id="postalCode"
            value={data.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="6-digit PIN code"
            maxLength={6}
            className={errors.postalCode ? 'border-destructive' : ''}
          />
          {errors.postalCode && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.postalCode}
            </p>
          )}
        </div>

      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg">Next: Study Details</Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
