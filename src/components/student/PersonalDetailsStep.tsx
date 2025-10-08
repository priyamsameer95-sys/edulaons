import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStudentApplicationContext } from '@/contexts/StudentApplicationContext';
import { CoachingTooltip } from './CoachingTooltip';
import { GENDERS, QUALIFICATIONS, COACHING_MESSAGES, MIN_AGE } from '@/constants/studentApplication';
import { AlertCircle } from 'lucide-react';

const PersonalDetailsStep = () => {
  const {
    applicationData,
    updateApplicationData,
    nextStep,
    validationErrors,
  } = useStudentApplicationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await nextStep();
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
            value={applicationData.name || ''}
            onChange={(e) => updateApplicationData({ name: e.target.value })}
            placeholder="As per passport/ID"
            className={validationErrors.name ? 'border-destructive' : ''}
          />
          {validationErrors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.name}
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
            value={applicationData.phone || ''}
            onChange={(e) => updateApplicationData({ phone: e.target.value })}
            placeholder="10-digit mobile number"
            maxLength={10}
            className={validationErrors.phone ? 'border-destructive' : ''}
          />
          {validationErrors.phone && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.phone}
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
            value={applicationData.dateOfBirth || ''}
            onChange={(e) => updateApplicationData({ dateOfBirth: e.target.value })}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE)).toISOString().split('T')[0]}
            className={validationErrors.dateOfBirth ? 'border-destructive' : ''}
          />
          {validationErrors.dateOfBirth && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.dateOfBirth}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="gender">Gender *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.gender} />
          </div>
          <Select value={applicationData.gender || ''} onValueChange={(value) => updateApplicationData({ gender: value })} required>
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
            value={applicationData.city || ''}
            onChange={(e) => updateApplicationData({ city: e.target.value })}
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
            value={applicationData.state || ''}
            onChange={(e) => updateApplicationData({ state: e.target.value })}
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
            value={applicationData.postalCode || ''}
            onChange={(e) => updateApplicationData({ postalCode: e.target.value })}
            placeholder="6-digit PIN code"
            maxLength={6}
            className={validationErrors.postalCode ? 'border-destructive' : ''}
          />
          {validationErrors.postalCode && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.postalCode}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="qualification">Highest Qualification *</Label>
            <CoachingTooltip content={COACHING_MESSAGES.qualification} />
          </div>
          <Select value={applicationData.qualification || ''} onValueChange={(value) => updateApplicationData({ qualification: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              {QUALIFICATIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg">Next: Study Details</Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
