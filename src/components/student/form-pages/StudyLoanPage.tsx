import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Search, X, Loader2, Check, Wallet, Building2, Calendar, Sparkles, ShieldCheck, Home, BookOpen, FlaskConical, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import type { StudentApplicationData, HighestQualification, LoanType, CourseType } from '@/types/student-application';

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

// Course type options - simplified selection
const courseTypes: { value: CourseType; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'masters_stem', 
    label: 'Masters STEM', 
    description: 'Science, Technology, Engineering, Mathematics',
    icon: <FlaskConical className="w-5 h-5" />
  },
  { 
    value: 'bachelors_stem', 
    label: 'Bachelors STEM', 
    description: 'Science, Technology, Engineering, Mathematics',
    icon: <GraduationCap className="w-5 h-5" />
  },
  { 
    value: 'mba_management', 
    label: 'MBA/Management', 
    description: 'Business Administration & Management',
    icon: <TrendingUp className="w-5 h-5" />
  },
  { 
    value: 'others', 
    label: 'Others', 
    description: 'Non-STEM Programs (Arts, etc.)',
    icon: <Briefcase className="w-5 h-5" />
  },
];

// UI country values → DB country names mapping
const COUNTRY_TO_DB: Record<string, string> = {
  'USA': 'United States',
  'UK': 'United Kingdom',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Germany': 'Germany',
  'New Zealand': 'New Zealand',
  'Singapore': 'Singapore',
  'Hong Kong': 'Hong Kong SAR',
  'Japan': 'Japan',
  'Switzerland': 'Switzerland',
  'China': 'China',
  'Other': '', // No filter for "Other"
};

const getCountryCandidates = (uiCountry?: string) => {
  if (!uiCountry || uiCountry === 'Other') return [] as string[];

  const candidates = new Set<string>();
  const dbCountry = COUNTRY_TO_DB[uiCountry];

  if (dbCountry) candidates.add(dbCountry);
  candidates.add(uiCountry);

  // Some datasets store abbreviated countries in the same column
  if (uiCountry === 'USA') candidates.add('United States of America');

  return Array.from(candidates).filter(Boolean);
};

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
  { value: 'New Zealand', label: 'New Zealand', emoji: '🇳🇿' },
  { value: 'Singapore', label: 'Singapore', emoji: '🇸🇬' },
  { value: 'Hong Kong', label: 'Hong Kong', emoji: '🇭🇰' },
  { value: 'Japan', label: 'Japan', emoji: '🇯🇵' },
  { value: 'Switzerland', label: 'Switzerland', emoji: '🇨🇭' },
  { value: 'China', label: 'China', emoji: '🇨🇳' },
  { value: 'Other', label: 'Other', emoji: '🌍' },
];

const amountRanges = [
  { value: '7.5-10L', label: '₹7.5 - 10 Lakhs', min: 750000, max: 1000000 },
  { value: '10-25L', label: '₹10 - 25 Lakhs', min: 1000000, max: 2500000 },
  { value: '25-50L', label: '₹25 - 50 Lakhs', min: 2500000, max: 5000000 },
  { value: '50-75L', label: '₹50 - 75 Lakhs', min: 5000000, max: 7500000 },
  { value: '75L-1Cr', label: '₹75 Lakhs - 1 Cr', min: 7500000, max: 10000000 },
  { value: '1Cr+', label: '₹1 Crore+', min: 10000000, max: 15000000 },
];

const loanTypes: { value: LoanType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'unsecured', 
    label: 'Unsecured Loan', 
    icon: <ShieldCheck className="w-5 h-5" />,
    description: 'No collateral needed. Higher interest rates.'
  },
  { 
    value: 'secured', 
    label: 'Secured Loan', 
    icon: <Home className="w-5 h-5" />,
    description: 'Lower rates with property as collateral.'
  },
];

// Generate next 9 months dynamically with real month names
const getNext9MonthsLabel = () => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 9; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    months.push(`${monthName} ${year}`);
  }
  return months.join(', ');
};

const intakeOptions = [
  { value: 'next_9_months', label: 'Next 9 months', icon: '🚀', description: getNext9MonthsLabel() },
  { value: 'plan_later', label: 'I plan for later', icon: '📅', description: 'Future intake' },
];

const StudyLoanPage = ({ data, onUpdate, onNext, onPrev }: StudyLoanPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [selectedUnis, setSelectedUnis] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [universityHint, setUniversityHint] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  const showBachelors = ['bachelors', 'masters', 'phd'].includes(data.highestQualification || '');
  const showMasters = ['masters', 'phd'].includes(data.highestQualification || '');

  // Load previously selected universities
  useEffect(() => {
    if (data.universities?.length) {
      supabase
        .from('universities')
        .select('id, name, city, country, global_rank')
        .in('id', data.universities)
        .then(({ data: unis }) => {
          if (unis) setSelectedUnis(unis);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Country selection should show a list even before the user types
  useEffect(() => {
    const destination = data.studyDestination;
    if (!destination) return;

    // If user is actively searching, don't override search results
    if (search && search.length >= 2) return;

    const load = async () => {
      setIsLoading(true);
      setUniversityHint('');

      const candidates = getCountryCandidates(destination);

      // Prefer country-scoped suggestions
      let q = supabase
        .from('universities')
        .select('id, name, city, country, global_rank')
        .order('global_rank', { ascending: true })
        .order('name', { ascending: true })
        .limit(8);

      if (candidates.length) q = q.in('country', candidates);

      const { data: scoped } = await q;

      if (scoped && scoped.length > 0) {
        setResults(scoped);
        setIsLoading(false);
        return;
      }

      // Fallback: show global suggestions if country tags are missing
      const { data: fallback } = await supabase
        .from('universities')
        .select('id, name, city, country, global_rank')
        .order('global_rank', { ascending: true })
        .order('name', { ascending: true })
        .limit(8);

      setResults(fallback || []);
      if (candidates.length) {
        setUniversityHint("We don't have country tags for many universities yet — showing top universities instead.");
      }
      setIsLoading(false);
    };

    load();
  }, [data.studyDestination, search]);

  // University search with country candidates + fallback
  useEffect(() => {
    const run = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return;
      }

      setUniversityHint('');
      setIsLoading(true);

      const candidates = getCountryCandidates(data.studyDestination);

      let q = supabase
        .from('universities')
        .select('id, name, city, country, global_rank')
        .ilike('name', `%${debouncedSearch}%`)
        .limit(8);

      if (candidates.length) q = q.in('country', candidates);

      const { data: scoped } = await q;

      // Fallback if country filter yields nothing (common when country is missing)
      if (candidates.length && (!scoped || scoped.length === 0)) {
        const { data: fallback } = await supabase
          .from('universities')
          .select('id, name, city, country, global_rank')
          .ilike('name', `%${debouncedSearch}%`)
          .limit(8);

        setResults(fallback || []);
        setUniversityHint("Showing results without country filter (country tags missing for many entries)." );
        setIsLoading(false);
        return;
      }

      setResults(scoped || []);
      setIsLoading(false);
    };

    run();
  }, [debouncedSearch, data.studyDestination]);

  const selectUni = (uni: University) => {
    const ids = data.universities || [];
    if (!ids.includes(uni.id) && ids.length < 3) {
      onUpdate({ universities: [...ids, uni.id] });
      setSelectedUnis(p => [...p, uni]);
      setErrors(p => ({ ...p, universities: '' }));
    }
    setSearch(''); 
    setResults([]);
  };

  const removeUni = (id: string) => {
    onUpdate({ universities: (data.universities || []).filter(u => u !== id) });
    setSelectedUnis(p => p.filter(u => u.id !== id));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    
    if (!data.highestQualification) e.qualification = 'Select your highest qualification';
    if (!data.studyDestination) e.destination = 'Select destination';
    if (!data.loanAmount || data.loanAmount < 750000) e.amount = 'Select loan amount range';
    if (!data.loanType) e.loanType = 'Select loan type';
    if (!data.universities?.length) e.universities = 'Please select at least one university';
    if (!data.courseType) e.courseType = 'Select your course type';
    if (!data.intakeMonth || !data.intakeYear) {
      e.intake = 'Select when you plan to start';
    } else {
      // Validate intake is in the future
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (data.intakeYear < currentYear || 
          (data.intakeYear === currentYear && data.intakeMonth < currentMonth)) {
        e.intake = 'Intake date must be in the future';
      }
    }
    
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
          <label className="text-sm font-medium text-foreground">Highest Qualification *</label>
          <div className="flex flex-wrap gap-2">
            {qualifications.map(q => (
              <button 
                key={q.value} 
                type="button" 
                onClick={() => { 
                  onUpdate({ highestQualification: q.value }); 
                  setErrors(p => ({ ...p, qualification: '' })); 
                }}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                  data.highestQualification === q.value 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border hover:border-primary/50 text-muted-foreground",
                  errors.qualification && !data.highestQualification && "border-destructive"
                )}>
                {q.label}
              </button>
            ))}
          </div>
          {errors.qualification && <p className="text-xs text-destructive">{errors.qualification}</p>}
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
                <label className="text-xs text-muted-foreground mb-1 block">Bachelor's CGPA</label>
                <input type="number" value={data.bachelorsCgpa ?? ''} onChange={e => onUpdate({ bachelorsCgpa: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0} max={10} step={0.1} placeholder="0-10" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </>)}
            {showMasters && (<>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Master's %</label>
                <input type="number" value={data.mastersPercentage ?? ''} onChange={e => onUpdate({ mastersPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0} max={100} placeholder="0-100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Master's CGPA</label>
                <input type="number" value={data.mastersCgpa ?? ''} onChange={e => onUpdate({ mastersCgpa: e.target.value ? parseFloat(e.target.value) : undefined })}
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

        {/* Loan Type Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">💰 What type of loan? *</label>
          <div className="grid grid-cols-2 gap-3">
            {loanTypes.map(lt => (
              <motion.button
                key={lt.value}
                type="button"
                onClick={() => { 
                  onUpdate({ loanType: lt.value }); 
                  setErrors(p => ({ ...p, loanType: '' })); 
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                  data.loanType === lt.value
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                    : "border-border hover:border-primary/40",
                  errors.loanType && !data.loanType && "border-destructive"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  data.loanType === lt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {lt.icon}
                </div>
                <span className="font-semibold text-foreground text-sm">{lt.label}</span>
                <span className="text-xs text-muted-foreground text-center">{lt.description}</span>
                {data.loanType === lt.value && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          {errors.loanType && <p className="text-xs text-destructive">{errors.loanType}</p>}
        </div>

        {/* Loan Amount Range */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" /> How much do you need? *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {amountRanges.map(range => {
              const isSelected = data.loanAmount === range.min;
              return (
                <motion.button
                  key={range.value}
                  type="button"
                  onClick={() => { 
                    onUpdate({ loanAmount: range.min }); 
                    setErrors(p => ({ ...p, amount: '' })); 
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all min-h-[72px]",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="font-semibold text-foreground text-sm text-center">{range.label}</span>
                </motion.button>
              );
            })}
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {data.studyDestination && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Most {data.studyDestination} students need ₹40-60L for their course.</p>
            </div>
          )}
        </div>

        {/* Universities */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Universities *</label>
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
            <div className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border-2 bg-background/50 focus-within:border-primary",
              errors.universities ? "border-destructive" : "border-border"
            )}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search universities..." value={search} onChange={e => setSearch(e.target.value)} disabled={selectedUnis.length >= 3}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50" />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {errors.universities && <p className="text-xs text-destructive mt-1">{errors.universities}</p>}
            {universityHint && !errors.universities && (
              <p className="text-xs text-muted-foreground mt-1">{universityHint}</p>
            )}
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

        {/* Course Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" /> What are you planning to study? *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {courseTypes.map(ct => (
              <motion.button
                key={ct.value}
                type="button"
                onClick={() => { 
                  onUpdate({ courseType: ct.value }); 
                  setErrors(p => ({ ...p, courseType: '' })); 
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  data.courseType === ct.value
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                    : "border-border hover:border-primary/40",
                  errors.courseType && !data.courseType && "border-destructive"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  data.courseType === ct.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {ct.icon}
                </div>
                <span className="font-semibold text-foreground text-sm text-center">{ct.label}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{ct.description}</span>
                {data.courseType === ct.value && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          {errors.courseType && <p className="text-xs text-destructive">{errors.courseType}</p>}
        </div>

        {/* Intake - Individual Month Tabs */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> When do you plan to start? *
          </label>
          {(() => {
            // Generate next 12 months
            const months = [];
            const now = new Date();
            for (let i = 1; i <= 12; i++) {
              const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
              months.push({
                month: futureDate.getMonth() + 1,
                year: futureDate.getFullYear(),
                label: futureDate.toLocaleString('en-US', { month: 'short' }),
              });
            }
            return (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {months.map(m => {
                  const isSelected = data.intakeMonth === m.month && data.intakeYear === m.year;
                  return (
                    <button
                      key={`${m.month}-${m.year}`}
                      type="button"
                      onClick={() => {
                        onUpdate({ intakeMonth: m.month, intakeYear: m.year });
                        setErrors(p => ({ ...p, intake: '' }));
                      }}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg border-2 transition-all text-center min-w-[70px]",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/40 bg-card"
                      )}
                    >
                      <span className="font-semibold text-foreground text-sm">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.year}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
          {errors.intake && <p className="text-xs text-destructive">{errors.intake}</p>}
        </div>

      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onPrev} className="rounded-full">← Back</Button>
        <Button onClick={handleContinue} className="rounded-full px-8">Continue →</Button>
      </div>
    </motion.div>
  );
};

export default StudyLoanPage;
