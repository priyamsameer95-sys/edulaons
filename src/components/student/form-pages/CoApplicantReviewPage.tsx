import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, Shield, Sparkles, ChevronRight, Phone, Mail, User, Briefcase, IndianRupee, ArrowLeft, ArrowRight, Check, Edit2, MapPin, GraduationCap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FloatingLabelInput } from '@/components/ui/input';
import { FeatureIcon } from '@/components/ui/feature-icon';
import { formatCompactCurrency, formatIncome } from '@/utils/formatters';
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



const CoApplicantReviewPage = ({ data, onUpdate, onSubmit, isSubmitting, onPrev }: CoApplicantReviewPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReview, setShowReview] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValid = (field: string) => touched[field] && !errors[field];

  const handleReview = () => {
    setTouched({ name: true, phone: true, email: true });
    if (validate()) setShowReview(true);
  };

  const handleSubmit = async () => {
    if (agreed) {
      try {
        await onSubmit();
      } catch (error) {
        // Error already handled by parent (useStudentApplication shows toast)
        console.error('Submission error:', error);
      }
    }
  };

  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full pb-8">
      <AnimatePresence mode="wait">
        {!showReview ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Users className="w-3 h-3" /> Step 3 of 3
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Co-applicant Details</h1>
              <p className="text-muted-foreground mt-2">A co-applicant strengthens your loan approval</p>
            </div>

            <Card className="rounded-2xl border-white/20 shadow-xl shadow-blue-900/5 p-6 sm:p-8 space-y-8 bg-white/80 backdrop-blur-sm">

              {/* Row 1: Relationship */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relationship with Student *</label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map(r => (
                    <motion.button
                      key={r.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onUpdate({ coApplicantRelationship: r.value }); setErrors(p => ({ ...p, rel: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-sm",
                        data.coApplicantRelationship === r.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          : "border-input bg-background hover:bg-muted text-foreground",
                        errors.rel && !data.coApplicantRelationship && "border-destructive"
                      )}
                    >
                      {r.label}
                    </motion.button>
                  ))}
                </div>
                {errors.rel && <p className="text-xs text-destructive">{errors.rel}</p>}
              </div>

              {/* Row 2: Name */}
              <div className="space-y-1">
                <FloatingLabelInput
                  id="coName"
                  label="Co-applicant Full Name"
                  value={data.coApplicantName || ''}
                  onChange={e => { onUpdate({ coApplicantName: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
                  onBlur={() => handleBlur('name')}
                  className={cn(
                    errors.name && touched.name ? "border-destructive focus-visible:ring-destructive" :
                      isValid('name') ? "border-green-500 focus-visible:ring-green-500" : ""
                  )}
                />
                {errors.name && touched.name && <p className="text-xs text-destructive pl-1">{errors.name}</p>}
              </div>

              {/* Row 3: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute left-3 top-4 z-10 flex items-center gap-2 text-muted-foreground border-r pr-2 h-6 pointer-events-none">
                      <span className="text-sm font-medium">🇮🇳 +91</span>
                    </div>
                    <input
                      id="coPhone"
                      type="tel"
                      value={data.coApplicantPhone || ''}
                      onChange={e => { onUpdate({ coApplicantPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setErrors(p => ({ ...p, phone: '' })); }}
                      onBlur={() => handleBlur('phone')}
                      placeholder=" "
                      className={cn(
                        "flex h-14 w-full rounded-md border border-input bg-background pl-24 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/50 peer pt-4 pb-1",
                        errors.phone && touched.phone ? "border-destructive focus-visible:ring-destructive" :
                          isValid('phone') ? "border-green-500 focus-visible:ring-green-500" : ""
                      )}
                    />
                    <label
                      htmlFor="coPhone"
                      className="absolute left-24 top-1 z-10 origin-[0] -translate-y-0 transform text-xs text-muted-foreground duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
                    >
                      Phone Number
                    </label>
                  </div>
                  {errors.phone && touched.phone && <p className="text-xs text-destructive pl-1">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <FloatingLabelInput
                    id="coEmail"
                    type="email"
                    label="Email Address"
                    value={data.coApplicantEmail || ''}
                    onChange={e => { onUpdate({ coApplicantEmail: e.target.value }); setErrors(p => ({ ...p, email: '' })); }}
                    onBlur={() => handleBlur('email')}
                    className={cn(
                      errors.email && touched.email ? "border-destructive focus-visible:ring-destructive" :
                        isValid('email') ? "border-green-500 focus-visible:ring-green-500" : ""
                    )}
                  />
                  {errors.email && touched.email && <p className="text-xs text-destructive pl-1">{errors.email}</p>}
                </div>
              </div>

              {/* Row 4: Employment Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Employment Type *</label>
                <div className="flex flex-wrap gap-2">
                  {employmentTypes.map(e => (
                    <motion.button
                      key={e.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onUpdate({ coApplicantEmploymentType: e.value }); setErrors(p => ({ ...p, emp: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-sm",
                        data.coApplicantEmploymentType === e.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          : "border-input bg-background hover:bg-muted text-foreground",
                        errors.emp && !data.coApplicantEmploymentType && "border-destructive"
                      )}
                    >
                      {e.label}
                    </motion.button>
                  ))}
                </div>
                {errors.emp && <p className="text-xs text-destructive">{errors.emp}</p>}
              </div>

              {/* Row 5: Monthly Income */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monthly Income *</label>
                <div className="flex flex-wrap gap-2">
                  {incomeOptions.map(opt => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onUpdate({ coApplicantMonthlySalary: opt.value }); setErrors(p => ({ ...p, salary: '' })); }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-sm",
                        data.coApplicantMonthlySalary === opt.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          : "border-input bg-background hover:bg-muted text-foreground",
                        errors.salary && !data.coApplicantMonthlySalary && "border-destructive"
                      )}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Higher income increases approval chances
                </p>
                {errors.salary && <p className="text-xs text-destructive">{errors.salary}</p>}
              </div>

            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 px-2">
              <Button
                variant="ghost"
                onClick={onPrev}
                size="lg"
                className="rounded-full h-14 px-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
              <Button
                onClick={handleReview}
                size="lg"
                className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/25 border-t border-white/20"
              >
                Review Application <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" /> Almost done!
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Review Application</h1>
              <p className="text-muted-foreground mt-2">Please verify your details before submitting.</p>
            </div>

            <Card className="rounded-2xl border-white/20 shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm overflow-hidden">
              {/* Student Info Header */}
              <div className="bg-muted/30 p-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary ring-4 ring-white">
                    {data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{data.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +91 {data.phone}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-black/5 flex items-start gap-3">
                    <FeatureIcon icon={MapPin} variant="rose" size="md" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Destination</p>
                      <p className="font-semibold text-foreground">{data.studyDestination}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-black/5 flex items-start gap-3">
                    <FeatureIcon icon={IndianRupee} variant="success" size="md" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Loan Amount</p>
                      <p className="font-semibold text-foreground">{formatCompactCurrency(data.loanAmount || 0)}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-black/5 flex items-start gap-3">
                    <FeatureIcon icon={GraduationCap} variant="primary" size="md" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Course</p>
                      <p className="font-semibold text-foreground capitalize">{data.courseType?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-black/5 flex items-start gap-3">
                    <FeatureIcon icon={Calendar} variant="warning" size="md" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Intake</p>
                      <p className="font-semibold text-foreground">
                        {data.intakeMonth === 0 ? 'Not sure yet' : `${months[data.intakeMonth || 0]} ${data.intakeYear}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Co-applicant Summary */}
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Co-Applicant Details
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{data.coApplicantName}</p>
                      <p className="text-sm text-muted-foreground capitalize mt-0.5">{data.coApplicantRelationship} • {data.coApplicantEmploymentType?.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="font-bold text-primary text-lg">{formatIncome(data.coApplicantMonthlySalary || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-input shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    I confirm that all the information provided is accurate and I agree to the{' '}
                    <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a> &{' '}
                    <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>.
                  </span>
                </label>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReview(false)}
                    size="lg"
                    className="rounded-full px-6 h-14"
                  >
                    Edit Details
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!agreed || isSubmitting}
                    size="lg"
                    className={cn(
                      "flex-1 rounded-full h-14 text-base font-semibold shadow-lg shadow-emerald-500/20",
                      agreed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                    )}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting Application...</>
                    ) : (
                      <>Submit Application <Sparkles className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CoApplicantReviewPage;
