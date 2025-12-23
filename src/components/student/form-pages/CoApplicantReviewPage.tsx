import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wallet, User, Phone, Mail, Briefcase, MapPin, Loader2, Shield, Sparkles, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { StudentApplicationData, Relationship, EmploymentType } from '@/types/student-application';

interface CoApplicantReviewPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  onPrev: () => void;
}

const relationships: { value: Relationship; label: string; icon: string }[] = [
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👦' },
  { value: 'spouse', label: 'Spouse', icon: '💑' },
  { value: 'sibling', label: 'Sibling', icon: '👫' },
  { value: 'guardian', label: 'Guardian', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '👤' },
];

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'business_owner', label: 'Business' },
];

const incomeQuick = [25000, 50000, 75000, 100000, 150000, 200000];

const formatIncome = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;
const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)} L` : `₹${v.toLocaleString('en-IN')}`;

const destinations = [
  { value: 'USA', emoji: '🇺🇸' }, { value: 'UK', emoji: '🇬🇧' }, { value: 'Canada', emoji: '🇨🇦' },
  { value: 'Australia', emoji: '🇦🇺' }, { value: 'Germany', emoji: '🇩🇪' }, { value: 'New Zealand', emoji: '🇳🇿' },
  { value: 'Singapore', emoji: '🇸🇬' }, { value: 'Hong Kong', emoji: '🇭🇰' }, { value: 'Japan', emoji: '🇯🇵' },
  { value: 'Switzerland', emoji: '🇨🇭' }, { value: 'China', emoji: '🇨🇳' }, { value: 'Other', emoji: '🌍' },
];

const CoApplicantReviewPage = ({ data, onUpdate, onSubmit, isSubmitting, onPrev }: CoApplicantReviewPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReview, setShowReview] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.coApplicantName?.trim()) e.name = 'Name required';
    if (!data.coApplicantRelationship) e.rel = 'Select relationship';
    if (!data.coApplicantPhone || !/^[6-9]\d{9}$/.test(data.coApplicantPhone)) e.phone = 'Valid phone required';
    if (!data.coApplicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.coApplicantEmail)) e.email = 'Valid email required';
    if (!data.coApplicantMonthlySalary || data.coApplicantMonthlySalary < 10000) e.salary = 'Min ₹10K required';
    if (!data.coApplicantEmploymentType) e.emp = 'Select employment';
    if (!data.coApplicantPinCode || !/^\d{6}$/.test(data.coApplicantPinCode)) e.pin = 'Valid PIN required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleReview = () => { if (validate()) setShowReview(true); };
  const handleSubmit = () => { if (agreed) onSubmit(); };

  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const destEmoji = destinations.find(d => d.value === data.studyDestination)?.emoji || '🌍';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <AnimatePresence mode="wait">
        {!showReview ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Users className="w-4 h-4" /> Final Step
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">👨‍👩‍👦 Co-applicant details</h1>
              <p className="text-muted-foreground text-sm">Strengthens your loan approval</p>
            </div>

            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-5 sm:p-7 space-y-5">
              {/* Relationship */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relationship *</label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map(r => (
                    <button key={r.value} type="button" onClick={() => { onUpdate({ coApplicantRelationship: r.value }); setErrors(p => ({ ...p, rel: '' })); }}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                        data.coApplicantRelationship === r.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                      )}>
                      <span>{r.icon}</span>{r.label}
                    </button>
                  ))}
                </div>
                {errors.rel && <p className="text-xs text-destructive">{errors.rel}</p>}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Full Name *</label>
                <input type="text" value={data.coApplicantName || ''} onChange={e => onUpdate({ coApplicantName: e.target.value })} placeholder="Enter their name"
                  className={cn("w-full px-4 py-3 rounded-xl border-2 bg-background/50 outline-none transition-all", errors.name ? "border-destructive/50" : "border-border focus:border-primary")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Phone *</label>
                  <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl border-2 bg-background/50", errors.phone ? "border-destructive/50" : "border-border focus-within:border-primary")}>
                    <span className="text-sm text-muted-foreground">+91</span>
                    <input type="tel" value={data.coApplicantPhone || ''} onChange={e => onUpdate({ coApplicantPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210"
                      className="flex-1 bg-transparent outline-none text-foreground" />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Email *</label>
                  <input type="email" value={data.coApplicantEmail || ''} onChange={e => onUpdate({ coApplicantEmail: e.target.value })} placeholder="email@example.com"
                    className={cn("w-full px-4 py-3 rounded-xl border-2 bg-background/50 outline-none", errors.email ? "border-destructive/50" : "border-border focus:border-primary")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              {/* Employment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> Employment *</label>
                <div className="flex gap-2">
                  {employmentTypes.map(e => (
                    <button key={e.value} type="button" onClick={() => { onUpdate({ coApplicantEmploymentType: e.value }); setErrors(p => ({ ...p, emp: '' })); }}
                      className={cn("flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                        data.coApplicantEmploymentType === e.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      )}>{e.label}</button>
                  ))}
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2"><Wallet className="w-4 h-4 text-muted-foreground" /> Monthly Income *</label>
                <div className="text-center py-4 px-4 rounded-xl bg-gradient-to-br from-green-500/5 via-green-500/10 to-green-500/5 border border-green-500/20">
                  <motion.div key={data.coApplicantMonthlySalary} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-2xl font-bold text-foreground">
                    {formatIncome(data.coApplicantMonthlySalary || 50000)}/month
                  </motion.div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {incomeQuick.map(v => (
                    <button key={v} type="button" onClick={() => { onUpdate({ coApplicantMonthlySalary: v }); setErrors(p => ({ ...p, salary: '' })); }}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        data.coApplicantMonthlySalary === v ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}>{formatIncome(v)}</button>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Sparkles className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 dark:text-green-300">Higher income = better rates & faster approval</p>
                </div>
              </div>

              {/* PIN */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> PIN Code *</label>
                <input type="text" inputMode="numeric" maxLength={6} value={data.coApplicantPinCode || ''} onChange={e => onUpdate({ coApplicantPinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit PIN" className={cn("w-full px-4 py-3 rounded-xl border-2 bg-background/50 outline-none", errors.pin ? "border-destructive/50" : "border-border focus:border-primary")} />
                {errors.pin && <p className="text-xs text-destructive">{errors.pin}</p>}
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-3">
                <Button variant="outline" onClick={onPrev} className="px-5">Back</Button>
                <Button onClick={handleReview} className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
                  Review Application <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" /> Almost there!
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">✨ Review & Submit</h1>
            </div>

            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                    {data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '👤'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{data.name}</h2>
                    <p className="text-sm text-muted-foreground">+91 {data.phone}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-0.5">Destination</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">{destEmoji} {data.studyDestination}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-0.5">Loan Amount</p>
                    <p className="font-semibold text-foreground">{formatCurrency(data.loanAmount || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-0.5">Loan Type</p>
                    <p className="font-semibold text-foreground">{data.loanType === 'unsecured' ? '🚀 Unsecured' : '🏠 Secured'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-0.5">Intake</p>
                    <p className="font-semibold text-foreground">{months[data.intakeMonth || 0]} {data.intakeYear}</p>
                  </div>
                </div>

                {/* Co-applicant */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                  <p className="text-xs text-muted-foreground mb-1.5">Co-Applicant</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{data.coApplicantName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{data.coApplicantRelationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatIncome(data.coApplicantMonthlySalary || 0)}/mo</p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 rounded border-border" />
                  <span className="text-sm text-muted-foreground">
                    I confirm all info is accurate and agree to the <a href="#" className="text-primary hover:underline">Terms</a> & <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>

                {/* Submit */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReview(false)} className="px-5">Edit</Button>
                  <Button onClick={handleSubmit} disabled={!agreed || isSubmitting}
                    className={cn("flex-1 h-12 text-base font-semibold rounded-xl transition-all",
                      agreed ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-green-700" : "bg-muted text-muted-foreground"
                    )}>
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</> : '🚀 Submit Application'}
                  </Button>
                </div>

                {/* Trust */}
                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" />Bank-grade security</span>
                  <span>📞 24/7 support</span>
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
