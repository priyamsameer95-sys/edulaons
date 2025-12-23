import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, User } from 'lucide-react';
import type { StudentApplicationData } from '@/types/student-application';

interface PersonalDetailsPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const PersonalDetailsPage = ({ data, onUpdate, onNext }: PersonalDetailsPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.name?.trim()) newErrors.name = 'Name is required';
    if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) {
      newErrors.phone = 'Valid 10-digit phone starting with 6-9';
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!data.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!data.gender) newErrors.gender = 'Please select gender';
    if (!data.postalCode || !/^\d{6}$/.test(data.postalCode)) {
      newErrors.postalCode = 'Valid 6-digit PIN required';
    }
    if (!data.city?.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    // Mark all as touched
    setTouched({ name: true, phone: true, dateOfBirth: true, gender: true, postalCode: true, city: true });
    if (validate()) {
      onNext();
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Personal Details</h2>
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      {/* Name and Phone row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={nameRef}
              type="text"
              value={data.name || ''}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onBlur={() => handleBlur('name')}
              placeholder="As on official documents"
              className={cn(
                "w-full bg-card border-2 rounded-lg pl-10 pr-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                "transition-colors duration-200",
                errors.name && touched.name ? "border-destructive" : "border-border"
              )}
            />
          </div>
          {errors.name && touched.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => onUpdate({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={() => handleBlur('phone')}
              placeholder="10-digit number"
              className={cn(
                "w-full bg-card border-2 rounded-lg pl-12 pr-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                "transition-colors duration-200",
                errors.phone && touched.phone ? "border-destructive" : "border-border"
              )}
            />
          </div>
          {errors.phone && touched.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Email and DOB row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Email (Optional)</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => onUpdate({ email: e.target.value })}
            onBlur={() => handleBlur('email')}
            placeholder="email@example.com"
            className={cn(
              "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              "transition-colors duration-200",
              errors.email && touched.email ? "border-destructive" : "border-border"
            )}
          />
          {errors.email && touched.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Date of Birth *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              value={data.dateOfBirth || ''}
              onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
              onBlur={() => handleBlur('dateOfBirth')}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
              className={cn(
                "w-full bg-card border-2 rounded-lg pl-10 pr-4 py-3 text-base",
                "focus:outline-none focus:border-primary transition-colors duration-200",
                errors.dateOfBirth && touched.dateOfBirth ? "border-destructive" : "border-border"
              )}
            />
          </div>
          {errors.dateOfBirth && touched.dateOfBirth && <p className="text-destructive text-xs mt-1">{errors.dateOfBirth}</p>}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Gender *</label>
        <div className="flex flex-wrap gap-3">
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ gender: opt.value })}
              className={cn(
                "px-6 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                data.gender === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.gender && touched.gender && <p className="text-destructive text-xs mt-2">{errors.gender}</p>}
      </div>

      {/* Location: PIN, City, State */}
      <div className="border-t border-border pt-6">
        <label className="text-sm font-medium text-foreground mb-4 block flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Location
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">PIN Code *</label>
            <input
              type="text"
              inputMode="numeric"
              value={data.postalCode || ''}
              onChange={(e) => onUpdate({ postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              onBlur={() => handleBlur('postalCode')}
              placeholder="6-digit PIN"
              className={cn(
                "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                "transition-colors duration-200",
                errors.postalCode && touched.postalCode ? "border-destructive" : "border-border"
              )}
            />
            {errors.postalCode && touched.postalCode && <p className="text-destructive text-xs mt-1">{errors.postalCode}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">City *</label>
            <input
              type="text"
              value={data.city || ''}
              onChange={(e) => onUpdate({ city: e.target.value })}
              onBlur={() => handleBlur('city')}
              placeholder="City"
              className={cn(
                "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                "transition-colors duration-200",
                errors.city && touched.city ? "border-destructive" : "border-border"
              )}
            />
            {errors.city && touched.city && <p className="text-destructive text-xs mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">State</label>
            <input
              type="text"
              value={data.state || ''}
              onChange={(e) => onUpdate({ state: e.target.value })}
              placeholder="State"
              className={cn(
                "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                "transition-colors duration-200 border-border"
              )}
            />
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="pt-6">
        <button
          onClick={handleContinue}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-base transition-all duration-200",
            "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default PersonalDetailsPage;
