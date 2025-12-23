import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Search, X, Loader2, Check, Wallet, Building2, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import type { StudentApplicationData, HighestQualification } from '@/types/student-application';

interface StudyLoanPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface University {
  id: string;
  name: string;
  city: string;
  country: string;
  global_rank?: number;
}

const qualifications: { value: HighestQualification; label: string }[] = [
  { value: '12th', label: '12th' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: 'Bachelors' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' },
];

const destinations = [
  { value: 'USA', label: 'USA', emoji: '🇺🇸', popular: true },
  { value: 'UK', label: 'UK', emoji: '🇬🇧', popular: true },
  { value: 'Canada', label: 'Canada', emoji: '🇨🇦', popular: true },
  { value: 'Australia', label: 'Australia', emoji: '🇦🇺', popular: true },
  { value: 'Germany', label: 'Germany', emoji: '🇩🇪' },
  { value: 'New Zealand', label: 'NZ', emoji: '🇳🇿' },
  { value: 'Singapore', label: 'SG', emoji: '🇸🇬' },
  { value: 'Hong Kong', label: 'HK', emoji: '🇭🇰' },
  { value: 'Japan', label: 'Japan', emoji: '🇯🇵' },
  { value: 'Switzerland', label: 'Swiss', emoji: '🇨🇭' },
  { value: 'China', label: 'China', emoji: '🇨🇳' },
  { value: 'Other', label: 'Other', emoji: '🌍' },
];

const loanTypes = [
  { value: 'unsecured', label: 'Without Collateral', icon: '🚀', tag: 'Fast approval' },
  { value: 'secured', label: 'With Collateral', icon: '🏠', tag: 'Best rates' },
];

const quickAmounts = [
  { value: 1000000, label: '₹10L' },
  { value: 2500000, label: '₹25L' },
  { value: 5000000, label: '₹50L' },
  { value: 7500000, label: '₹75L' },
  { value: 10000000, label: '₹1Cr' },
];

const formatCurrency = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear + 1, currentYear + 2];

const StudyLoanPage = ({ data, onUpdate, onNext, onPrev }: StudyLoanPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [selectedUnis, setSelectedUnis] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const showBachelors = ['bachelors', 'masters', 'phd'].includes(data.highestQualification || '');

  useEffect(() => {
    if (data.universities?.length) {
      supabase.from('universities').select('id, name, city, country, global_rank').in('id', data.universities)
        .then(({ data: unis }) => { if (unis) setSelectedUnis(unis); });
    }
  }, []);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) { setResults([]); return; }
    setIsLoading(true);
    let query = supabase.from('universities').select('id, name, city, country, global_rank').ilike('name', `%${debouncedSearch}%`).limit(8);
    if (data.studyDestination && data.studyDestination !== 'Other') query = query.ilike('country', `%${data.studyDestination}%`);
    query.then(({ data: unis }) => { setResults(unis || []); setIsLoading(false); });
  }, [debouncedSearch, data.studyDestination]);

  const selectUni = (uni: University) => {
    const ids = data.universities || [];
    if (!ids.includes(uni.id) && ids.length < 3) {
      onUpdate({ universities: [...ids, uni.id] });
      setSelectedUnis(p => [...p, uni]);
    }
    setSearch(''); setResults([]);
  };

  const removeUni = (id: string) => {
    onUpdate({ universities: (data.universities || []).filter(u => u !== id) });
    setSelectedUnis(p => p.filter(u => u.id !== id));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.studyDestination) e.destination = 'Select destination';
    if (!data.loanType) e.loanType = 'Select loan type';
    if (!data.loanAmount || data.loanAmount < 500000) e.amount = 'Min ₹5L required';
    if (!data.intakeMonth || !data.intakeYear) e.intake = 'Select intake';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleContinue = () => { if (validate()) onNext(); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="text-center mb-6">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
          <GraduationCap className="w-4 h-4" /> Step 2 of 3
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">🎓 Your study plans</h1>
        <p className="text-muted-foreground text-sm">We'll match you with the best loan options</p>
      </div>

      <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-5 sm:p-7 space-y-6">
        
        {/* Qualification */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Highest Qualification</label>
          <div className="flex flex-wrap gap-2">
            {qualifications.map(q => (
              <button key={q.value} type="button" onClick={() => onUpdate({ highestQualification: q.value })}
                className={cn("px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                  data.highestQualification === q.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                )}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Scores */}
        <div className="bg-muted/30 rounded-xl p-4">
          <label className="text-sm font-medium text-foreground mb-3 block">Academic Scores (Optional)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">10th %</label>
              <input type="number" value={data.tenthPercentage ?? ''} onChange={e => onUpdate({ tenthPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                min={0} max={100} placeholder="0-100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">12th %</label>
              <input type="number" value={data.twelfthPercentage ?? ''} onChange={e => onUpdate({ twelfthPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                min={0} max={100} placeholder="0-100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            {showBachelors && (<>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bachelor's %</label>
                <input type="number" value={data.bachelorsPercentage ?? ''} onChange={e => onUpdate({ bachelorsPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0} max={100} placeholder="0-100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">CGPA</label>
                <input type="number" value={data.bachelorsCgpa ?? ''} onChange={e => onUpdate({ bachelorsCgpa: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0} max={10} step={0.1} placeholder="0-10" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </>)}
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">🌍 Where do you want to study? *</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {destinations.map(d => (
              <motion.button key={d.value} type="button" onClick={() => { onUpdate({ studyDestination: d.value }); setErrors(p => ({ ...p, destination: '' })); }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className={cn("relative flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all min-h-[64px]",
                  data.studyDestination === d.value ? "border-primary bg-primary/10 shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
                )}>
                {d.popular && data.studyDestination !== d.value && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
                <span className="text-xl">{d.emoji}</span>
                <span className="text-[10px] font-medium text-foreground">{d.label}</span>
                {data.studyDestination === d.value && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          {errors.destination && <p className="text-xs text-destructive">{errors.destination}</p>}
        </div>

        {/* Loan Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">💰 Loan Type *</label>
          <div className="grid grid-cols-2 gap-3">
            {loanTypes.map(t => (
              <motion.button key={t.value} type="button" onClick={() => { onUpdate({ loanType: t.value as 'secured' | 'unsecured' }); setErrors(p => ({ ...p, loanType: '' })); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={cn("relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all",
                  data.loanType === t.value ? "border-primary bg-primary/10 shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
                )}>
                <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t.tag}</span>
                <span className="text-2xl">{t.icon}</span>
                <span className="font-semibold text-foreground text-sm">{t.label}</span>
              </motion.button>
            ))}
          </div>
          {errors.loanType && <p className="text-xs text-destructive">{errors.loanType}</p>}
        </div>

        {/* Loan Amount */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2"><Wallet className="w-4 h-4 text-muted-foreground" /> How much do you need? *</label>
          <div className="text-center py-5 px-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
            <motion.div key={data.loanAmount} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-3xl sm:text-4xl font-bold text-foreground">
              {formatCurrency(data.loanAmount || 2500000)}
            </motion.div>
          </div>
          <Slider value={[data.loanAmount || 2500000]} onValueChange={v => onUpdate({ loanAmount: v[0] })} min={500000} max={15000000} step={100000} className="py-2" />
          <div className="flex justify-between text-xs text-muted-foreground"><span>₹5L</span><span>₹1.5Cr</span></div>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickAmounts.map(a => (
              <button key={a.value} type="button" onClick={() => onUpdate({ loanAmount: a.value })}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  data.loanAmount === a.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}>{a.label}</button>
            ))}
          </div>
          {data.studyDestination && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Most {data.studyDestination} students need ₹40-60L for their course.</p>
            </div>
          )}
        </div>

        {/* Universities */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Universities (optional)</label>
          {selectedUnis.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUnis.map(u => (
                <span key={u.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-sm">
                  <span className="font-medium truncate max-w-[120px]">{u.name}</span>
                  <button onClick={() => removeUni(u.id)} className="w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-destructive flex items-center justify-center"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-background/50 focus-within:border-primary">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search universities..." value={search} onChange={e => setSearch(e.target.value)} disabled={selectedUnis.length >= 3}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50" />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {results.map(u => (
                    <button key={u.id} onClick={() => selectUni(u)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left border-b border-border last:border-b-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.city}, {u.country}</div>
                      </div>
                      {u.global_rank && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">#{u.global_rank}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Intake */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> When do you start? *</label>
          <div className="flex gap-2 mb-2">
            {years.map(y => (
              <button key={y} type="button" onClick={() => onUpdate({ intakeYear: y })}
                className={cn("flex-1 py-2 rounded-xl border-2 font-semibold text-sm transition-all",
                  data.intakeYear === y ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}>{y}</button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {months.map((m, i) => {
              const pop = [0, 4, 7, 8].includes(i);
              return (
                <button key={m} type="button" onClick={() => { onUpdate({ intakeMonth: i + 1 }); setErrors(p => ({ ...p, intake: '' })); }}
                  className={cn("relative py-2 rounded-lg border text-xs font-medium transition-all",
                    data.intakeMonth === i + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                  )}>
                  {pop && data.intakeMonth !== i + 1 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                  {m}
                </button>
              );
            })}
          </div>
          {errors.intake && <p className="text-xs text-destructive">{errors.intake}</p>}
        </div>

        {/* Buttons */}
        <div className="pt-2 flex gap-3">
          <Button variant="outline" onClick={onPrev} className="px-5">Back</Button>
          <Button onClick={handleContinue} className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
            Continue <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="ml-1">→</motion.span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyLoanPage;
