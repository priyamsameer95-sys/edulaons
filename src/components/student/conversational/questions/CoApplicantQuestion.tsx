import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { Relationship, EmploymentType } from '@/types/student-application';

interface CoApplicantQuestionProps {
  name: string;
  relationship: Relationship;
  phone: string;
  email: string;
  monthlySalary: number;
  employmentType: EmploymentType;
  pinCode: string;
  onChange: (field: string, value: string | number) => void;
  onSubmit: () => void;
}

const relationships: { value: Relationship; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'business_owner', label: 'Business Owner' },
];

const formatSalary = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const CoApplicantQuestion = ({
  name,
  relationship,
  phone,
  email,
  monthlySalary,
  employmentType,
  pinCode,
  onChange,
  onSubmit,
}: CoApplicantQuestionProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!relationship) newErrors.relationship = 'Please select relationship';
    if (!phone || phone.length !== 10) newErrors.phone = 'Valid 10-digit phone required';
    if (!email || !email.includes('@')) newErrors.email = 'Valid email required';
    if (!monthlySalary || monthlySalary < 10000) newErrors.monthlySalary = 'Salary must be at least ₹10,000';
    if (!employmentType) newErrors.employmentType = 'Please select employment type';
    if (!pinCode || pinCode.length !== 6) newErrors.pinCode = 'Valid 6-digit PIN required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to next field or submit
    }
  };

  const isValid = name && relationship && phone.length === 10 && email.includes('@') && 
                  monthlySalary >= 10000 && employmentType && pinCode.length === 6;

  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => onChange('coApplicantName', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter co-applicant's name"
          className={cn(
            "w-full bg-muted/50 border-2 border-border rounded-lg px-4 py-3 text-lg",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            errors.name && "border-destructive"
          )}
        />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Relationship */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Relationship</label>
        <div className="flex flex-wrap gap-2">
          {relationships.map((rel) => (
            <button
              key={rel.value}
              onClick={() => onChange('coApplicantRelationship', rel.value)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                relationship === rel.value 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {rel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phone and Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onChange('coApplicantPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              className={cn(
                "w-full bg-muted/50 border-2 border-border rounded-lg pl-12 pr-4 py-3 text-lg",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                errors.phone && "border-destructive"
              )}
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange('coApplicantEmail', e.target.value)}
            placeholder="email@example.com"
            className={cn(
              "w-full bg-muted/50 border-2 border-border rounded-lg px-4 py-3 text-lg",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              errors.email && "border-destructive"
            )}
          />
        </div>
      </div>

      {/* Employment Type */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Employment Type</label>
        <div className="flex flex-wrap gap-2">
          {employmentTypes.map((emp) => (
            <button
              key={emp.value}
              onClick={() => onChange('coApplicantEmploymentType', emp.value)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                employmentType === emp.value 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {emp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Salary and PIN row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Monthly Salary</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <input
              type="text"
              value={monthlySalary ? monthlySalary.toLocaleString('en-IN') : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                onChange('coApplicantMonthlySalary', val);
              }}
              placeholder="Monthly income"
              className={cn(
                "w-full bg-muted/50 border-2 border-border rounded-lg pl-8 pr-4 py-3 text-lg",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                errors.monthlySalary && "border-destructive"
              )}
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">PIN Code</label>
          <input
            type="text"
            inputMode="numeric"
            value={pinCode}
            onChange={(e) => onChange('coApplicantPinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit PIN"
            className={cn(
              "w-full bg-muted/50 border-2 border-border rounded-lg px-4 py-3 text-lg",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              errors.pinCode && "border-destructive"
            )}
          />
        </div>
      </div>

      {isValid && (
        <div className="flex items-center gap-2 text-success">
          <Check className="h-5 w-5" />
          <span className="text-sm">Co-applicant details complete</span>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSubmit}
          className={cn(
            "px-6 py-3 rounded-lg font-medium text-base transition-all duration-200",
            "bg-primary text-primary-foreground hover:opacity-90",
            "flex items-center gap-2"
          )}
        >
          OK
          <span className="text-primary-foreground/70 text-sm flex items-center gap-1">
            press Enter ↵
          </span>
        </button>
      </div>
    </div>
  );
};

export default CoApplicantQuestion;
