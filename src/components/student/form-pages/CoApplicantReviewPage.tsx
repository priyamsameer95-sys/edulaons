import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCompactCurrency } from '@/utils/formatters';
import type { StudentApplicationData, Relationship, EmploymentType } from '@/types/student-application';

interface CoApplicantReviewPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  onPrev: () => void;
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
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'business_owner', label: 'Business Owner' },
];

const incomeOptions = [
  { value: 25000, label: '₹25K' },
  { value: 50000, label: '₹50K' },
  { value: 75000, label: '₹75K' },
  { value: 100000, label: '₹1L' },
  { value: 150000, label: '₹1.5L' },
  { value: 200000, label: '₹2L+' },
];

const formatIncome = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

const CoApplicantReviewPage = ({ data, onUpdate, onSubmit, isSubmitting, onPrev }: CoApplicantReviewPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReview, setShowReview] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.coApplicantName?.trim()) e.name = 'Required';
    if (!data.coApplicantRelationship) e.rel = 'Required';
    if (!data.coApplicantPhone || !/^[6-9]\d{9}$/.test(data.coApplicantPhone)) e.phone = 'Valid 10-digit number';
    if (!data.coApplicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.coApplicantEmail)) e.email = 'Valid email';
    if (!data.coApplicantMonthlySalary || data.coApplicantMonthlySalary < 10000) e.salary = 'Required';
    if (!data.coApplicantEmploymentType) e.emp = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleReview = () => { if (validate()) setShowReview(true); };
  const handleSubmit = () => { if (agreed) onSubmit(); };

  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <AnimatePresence mode="wait">
        {!showReview ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                <Users className="w-4 h-4" /> Step 3 of 3
              </div>
              <h1 className="text-2xl font-bold text-foreground">Co-applicant Details</h1>
              <p className="text-sm text-muted-foreground mt-1">A co-applicant strengthens your loan approval</p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg p-5 sm:p-6 space-y-6">
              
              {/* Row 1: Relationship */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relationship *</label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map(r => (
                    <button 
                      key={r.value} 
                      type="button" 
                      onClick={() => { onUpdate({ coApplicantRelationship: r.value }); setErrors(p => ({ ...p, rel: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        data.coApplicantRelationship === r.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/40 text-foreground",
                        errors.rel && !data.coApplicantRelationship && "border-destructive"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input 
                  type="text" 
                  value={data.coApplicantName || ''} 
                  onChange={e => { onUpdate({ coApplicantName: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
                  placeholder="Co-applicant's full name as per passport"
                  className={cn(
                    "w-full h-11 px-4 rounded-lg border-2 bg-background text-sm outline-none transition-all",
                    errors.name ? "border-destructive" : "border-border focus:border-primary"
                  )} 
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Row 3: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <div className={cn(
                    "flex items-center h-11 px-4 rounded-lg border-2 bg-background",
                    errors.phone ? "border-destructive" : "border-border focus-within:border-primary"
                  )}>
                    <span className="text-sm text-muted-foreground mr-2">+91</span>
                    <input 
                      type="tel" 
                      value={data.coApplicantPhone || ''} 
                      onChange={e => { onUpdate({ coApplicantPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setErrors(p => ({ ...p, phone: '' })); }}
                      placeholder="9876543210"
                      className="flex-1 bg-transparent outline-none text-sm text-foreground" 
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email *</label>
                  <input 
                    type="email" 
                    value={data.coApplicantEmail || ''} 
                    onChange={e => { onUpdate({ coApplicantEmail: e.target.value }); setErrors(p => ({ ...p, email: '' })); }}
                    placeholder="email@example.com"
                    className={cn(
                      "w-full h-11 px-4 rounded-lg border-2 bg-background text-sm outline-none transition-all",
                      errors.email ? "border-destructive" : "border-border focus:border-primary"
                    )} 
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              {/* Row 4: Employment Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Employment Type *</label>
                <div className="flex flex-wrap gap-2">
                  {employmentTypes.map(e => (
                    <button 
                      key={e.value} 
                      type="button" 
                      onClick={() => { onUpdate({ coApplicantEmploymentType: e.value }); setErrors(p => ({ ...p, emp: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        data.coApplicantEmploymentType === e.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/40 text-foreground",
                        errors.emp && !data.coApplicantEmploymentType && "border-destructive"
                      )}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Monthly Income */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monthly Income *</label>
                <div className="flex flex-wrap gap-2">
                  {incomeOptions.map(opt => (
                    <button 
                      key={opt.value} 
                      type="button" 
                      onClick={() => { onUpdate({ coApplicantMonthlySalary: opt.value }); setErrors(p => ({ ...p, salary: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        data.coApplicantMonthlySalary === opt.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/40 text-foreground",
                        errors.salary && !data.coApplicantMonthlySalary && "border-destructive"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5" /> Higher income improves approval chances
                </p>
              </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-5">
              <Button variant="outline" onClick={onPrev} size="sm" className="rounded-full">← Back</Button>
              <Button onClick={handleReview} size="sm" className="rounded-full px-6">
                Review & Submit <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4" /> Almost done!
              </div>
              <h1 className="text-2xl font-bold text-foreground">Review Your Application</h1>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              {/* Student Info Header */}
              <div className="bg-muted/30 p-5 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{data.name}</h2>
                    <p className="text-sm text-muted-foreground">+91 {data.phone}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium text-foreground">{data.studyDestination}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="font-medium text-foreground">{formatCompactCurrency(data.loanAmount || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium text-foreground capitalize">{data.courseType?.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Intake</p>
                    <p className="font-medium text-foreground">
                      {data.intakeMonth === 0 ? 'Not sure yet' : `${months[data.intakeMonth || 0]} ${data.intakeYear}`}
                    </p>
                  </div>
                </div>

                {/* Co-applicant Summary */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Co-Applicant</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{data.coApplicantName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{data.coApplicantRelationship} • {data.coApplicantEmploymentType?.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{formatIncome(data.coApplicantMonthlySalary || 0)}/mo</p>
                    </div>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={e => setAgreed(e.target.checked)} 
                    className="mt-0.5 w-4 h-4 rounded border-border accent-primary" 
                  />
                  <span className="text-sm text-muted-foreground">
                    I confirm all information is accurate and agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms</a> &{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowReview(false)} size="sm" className="rounded-full">
                    ← Edit
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!agreed || isSubmitting}
                    size="sm"
                    className={cn(
                      "flex-1 rounded-full",
                      agreed ? "bg-green-600 hover:bg-green-700" : ""
                    )}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CoApplicantReviewPage;
