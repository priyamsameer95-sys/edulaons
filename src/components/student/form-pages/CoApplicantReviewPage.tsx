import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Check, User, Phone, Mail, Briefcase, MapPin, IndianRupee } from 'lucide-react';
import type { StudentApplicationData, Relationship, EmploymentType } from '@/types/student-application';

interface CoApplicantReviewPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
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

const formatCurrency = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const CoApplicantReviewPage = ({ data, onUpdate, onSubmit, isSubmitting }: CoApplicantReviewPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.coApplicantName?.trim()) newErrors.coApplicantName = 'Name is required';
    if (!data.coApplicantRelationship) newErrors.relationship = 'Select relationship';
    if (!data.coApplicantPhone || !/^[6-9]\d{9}$/.test(data.coApplicantPhone)) {
      newErrors.coApplicantPhone = 'Valid 10-digit phone required';
    }
    if (!data.coApplicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.coApplicantEmail)) {
      newErrors.coApplicantEmail = 'Valid email required';
    }
    if (!data.coApplicantMonthlySalary || data.coApplicantMonthlySalary < 10000) {
      newErrors.coApplicantMonthlySalary = 'Salary must be at least ₹10,000';
    }
    if (!data.coApplicantEmploymentType) newErrors.employmentType = 'Select employment type';
    if (!data.coApplicantPinCode || !/^\d{6}$/.test(data.coApplicantPinCode)) {
      newErrors.coApplicantPinCode = 'Valid 6-digit PIN required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setTouched({
      coApplicantName: true,
      relationship: true,
      coApplicantPhone: true,
      coApplicantEmail: true,
      coApplicantMonthlySalary: true,
      employmentType: true,
      coApplicantPinCode: true,
    });
    if (validate()) {
      onSubmit();
    }
  };

  const isCoApplicantComplete = 
    data.coApplicantName && 
    data.coApplicantRelationship && 
    data.coApplicantPhone?.length === 10 && 
    data.coApplicantEmail?.includes('@') && 
    (data.coApplicantMonthlySalary || 0) >= 10000 && 
    data.coApplicantEmploymentType && 
    data.coApplicantPinCode?.length === 6;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Co-Applicant Details</h2>
        <p className="text-muted-foreground">A co-applicant strengthens your application</p>
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
          <User className="h-4 w-4" /> Full Name *
        </label>
        <input
          ref={nameRef}
          type="text"
          value={data.coApplicantName || ''}
          onChange={(e) => onUpdate({ coApplicantName: e.target.value })}
          placeholder="Enter co-applicant's name"
          className={cn(
            "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            errors.coApplicantName && touched.coApplicantName ? "border-destructive" : "border-border"
          )}
        />
        {errors.coApplicantName && touched.coApplicantName && (
          <p className="text-destructive text-xs mt-1">{errors.coApplicantName}</p>
        )}
      </div>

      {/* Relationship */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Relationship *</label>
        <div className="flex flex-wrap gap-2">
          {relationships.map((rel) => (
            <button
              key={rel.value}
              type="button"
              onClick={() => onUpdate({ coApplicantRelationship: rel.value })}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                data.coApplicantRelationship === rel.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-foreground"
              )}
            >
              {rel.label}
            </button>
          ))}
        </div>
        {errors.relationship && touched.relationship && (
          <p className="text-destructive text-xs mt-2">{errors.relationship}</p>
        )}
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
            <Phone className="h-4 w-4" /> Phone *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
            <input
              type="tel"
              value={data.coApplicantPhone || ''}
              onChange={(e) => onUpdate({ coApplicantPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit number"
              className={cn(
                "w-full bg-card border-2 rounded-lg pl-12 pr-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                errors.coApplicantPhone && touched.coApplicantPhone ? "border-destructive" : "border-border"
              )}
            />
          </div>
          {errors.coApplicantPhone && touched.coApplicantPhone && (
            <p className="text-destructive text-xs mt-1">{errors.coApplicantPhone}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email *
          </label>
          <input
            type="email"
            value={data.coApplicantEmail || ''}
            onChange={(e) => onUpdate({ coApplicantEmail: e.target.value })}
            placeholder="email@example.com"
            className={cn(
              "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              errors.coApplicantEmail && touched.coApplicantEmail ? "border-destructive" : "border-border"
            )}
          />
          {errors.coApplicantEmail && touched.coApplicantEmail && (
            <p className="text-destructive text-xs mt-1">{errors.coApplicantEmail}</p>
          )}
        </div>
      </div>

      {/* Employment Type */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Employment Type *
        </label>
        <div className="flex flex-wrap gap-2">
          {employmentTypes.map((emp) => (
            <button
              key={emp.value}
              type="button"
              onClick={() => onUpdate({ coApplicantEmploymentType: emp.value })}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                data.coApplicantEmploymentType === emp.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-foreground"
              )}
            >
              {emp.label}
            </button>
          ))}
        </div>
        {errors.employmentType && touched.employmentType && (
          <p className="text-destructive text-xs mt-2">{errors.employmentType}</p>
        )}
      </div>

      {/* Salary and PIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Monthly Salary *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <input
              type="text"
              value={data.coApplicantMonthlySalary ? data.coApplicantMonthlySalary.toLocaleString('en-IN') : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                onUpdate({ coApplicantMonthlySalary: val });
              }}
              placeholder="Monthly income"
              className={cn(
                "w-full bg-card border-2 rounded-lg pl-8 pr-4 py-3 text-base",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
                errors.coApplicantMonthlySalary && touched.coApplicantMonthlySalary ? "border-destructive" : "border-border"
              )}
            />
          </div>
          {errors.coApplicantMonthlySalary && touched.coApplicantMonthlySalary && (
            <p className="text-destructive text-xs mt-1">{errors.coApplicantMonthlySalary}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
            <MapPin className="h-4 w-4" /> PIN Code *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={data.coApplicantPinCode || ''}
            onChange={(e) => onUpdate({ coApplicantPinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="6-digit PIN"
            className={cn(
              "w-full bg-card border-2 rounded-lg px-4 py-3 text-base",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              errors.coApplicantPinCode && touched.coApplicantPinCode ? "border-destructive" : "border-border"
            )}
          />
          {errors.coApplicantPinCode && touched.coApplicantPinCode && (
            <p className="text-destructive text-xs mt-1">{errors.coApplicantPinCode}</p>
          )}
        </div>
      </div>

      {isCoApplicantComplete && (
        <div className="flex items-center gap-2 text-success">
          <Check className="h-5 w-5" />
          <span className="text-sm">Co-applicant details complete</span>
        </div>
      )}

      {/* Review Summary */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Review Your Application</h3>
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Applicant:</span>
              <span className="font-medium text-foreground ml-2">{data.name || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium text-foreground ml-2">+91 {data.phone || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-medium text-foreground ml-2">{data.studyDestination || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Loan Amount:</span>
              <span className="font-medium text-foreground ml-2">
                {data.loanAmount ? formatCurrency(data.loanAmount) : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Loan Type:</span>
              <span className="font-medium text-foreground ml-2 capitalize">{data.loanType || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Intake:</span>
              <span className="font-medium text-foreground ml-2">
                {data.intakeMonth && data.intakeYear 
                  ? `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][data.intakeMonth]} ${data.intakeYear}`
                  : '-'}
              </span>
            </div>
          </div>
          {data.coApplicantName && (
            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Co-Applicant:</span>
                <span className="font-medium text-foreground ml-2">
                  {data.coApplicantName} ({data.coApplicantRelationship})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200",
            "bg-primary text-primary-foreground hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </div>
  );
};

export default CoApplicantReviewPage;
