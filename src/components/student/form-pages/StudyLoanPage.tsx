import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, ChevronDown, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'UK', label: '🇬🇧 UK' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'New Zealand', label: '🇳🇿 New Zealand' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'Other', label: '🌍 Other' },
];

const amountRanges = [
  { value: '10-25L', label: '₹10 - 25L', min: 1000000 },
  { value: '25-50L', label: '₹25 - 50L', min: 2500000 },
  { value: '50-75L', label: '₹50 - 75L', min: 5000000 },
  { value: '75L-1Cr', label: '₹75L - 1Cr', min: 7500000 },
  { value: '1Cr+', label: '₹1Cr+', min: 10000000 },
];


import { CourseTypeSelector } from '@/components/shared/CourseTypeSelector';

// UI country values → DB country names mapping
const COUNTRY_TO_DB: Record<string, string[]> = {
  'USA': ['United States', 'USA', 'United States of America'],
  'UK': ['United Kingdom', 'UK'],
  'Canada': ['Canada'],
  'Australia': ['Australia'],
  'Germany': ['Germany'],
  'New Zealand': ['New Zealand'],
  'Singapore': ['Singapore'],
  'Other': [],
};

const StudyLoanPage = ({ data, onUpdate, onNext, onPrev }: StudyLoanPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUnis, setSelectedUnis] = useState<University[]>([]);
  const [isLoadingUnis, setIsLoadingUnis] = useState(false);
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, []);

  // Load universities when destination changes or dropdown opens
  useEffect(() => {
    if (!uniDropdownOpen) return;

    const loadUniversities = async () => {
      setIsLoadingUnis(true);

      const countryFilters = data.studyDestination ? COUNTRY_TO_DB[data.studyDestination] || [] : [];

      let query = supabase
        .from('universities')
        .select('id, name, city, country, global_rank')
        .order('global_rank', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
        .limit(50);

      if (countryFilters.length > 0) {
        query = query.in('country', countryFilters);
      }

      if (searchQuery.length >= 2) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data: unis } = await query;

      // If country filter returns nothing, try without it
      if ((!unis || unis.length === 0) && countryFilters.length > 0) {
        let fallbackQuery = supabase
          .from('universities')
          .select('id, name, city, country, global_rank')
          .order('global_rank', { ascending: true, nullsFirst: false })
          .order('name', { ascending: true })
          .limit(50);

        if (searchQuery.length >= 2) {
          fallbackQuery = fallbackQuery.ilike('name', `%${searchQuery}%`);
        }

        const { data: fallbackUnis } = await fallbackQuery;
        setUniversities(fallbackUnis || []);
      } else {
        setUniversities(unis || []);
      }

      setIsLoadingUnis(false);
    };

    loadUniversities();
  }, [data.studyDestination, uniDropdownOpen, searchQuery]);

  const selectUni = (uni: University) => {
    const ids = data.universities || [];
    if (!ids.includes(uni.id) && ids.length < 3) {
      onUpdate({ universities: [...ids, uni.id] });
      setSelectedUnis(p => [...p, uni]);
      setErrors(p => ({ ...p, universities: '' }));
    }
  };

  const removeUni = (id: string) => {
    onUpdate({ universities: (data.universities || []).filter(u => u !== id) });
    setSelectedUnis(p => p.filter(u => u.id !== id));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.highestQualification) e.qualification = 'Required';
    if (!data.studyDestination) e.destination = 'Required';
    if (!data.loanAmount) e.amount = 'Required';

    if (!data.universities?.length) e.universities = 'Select at least one';
    if (!data.courseType) e.courseType = 'Required';
    // Allow "Not sure yet" (0, 0) or a valid month/year
    const hasIntake = (data.intakeMonth === 0 && data.intakeYear === 0) || (data.intakeMonth && data.intakeYear);
    if (!hasIntake) e.intake = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleContinue = () => { if (validate()) onNext(); };

  // Generate next 6 months starting from current month
  const intakeMonths = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    intakeMonths.push({
      month: futureDate.getMonth() + 1,
      year: futureDate.getFullYear(),
      label: futureDate.toLocaleString('en-US', { month: 'short' }),
    });
  }

  const isPlanningLater = data.intakeMonth === 0 && data.intakeYear === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full pb-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
          <GraduationCap className="w-3 h-3" /> Step 2 of 3
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Study Plans</h1>
      </div>

      <Card className="rounded-2xl border-white/20 shadow-xl shadow-blue-900/5 p-6 sm:p-8 space-y-8 bg-white/80 backdrop-blur-sm">

        {/* Row 1: Qualification & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Highest Qualification *</label>
            <Select
              value={data.highestQualification}
              onValueChange={(v) => {
                onUpdate({ highestQualification: v as HighestQualification });
                setErrors(p => ({ ...p, qualification: '' }));
              }}
            >
              <SelectTrigger className={cn("h-14 bg-background", errors.qualification && "border-destructive")}>
                <SelectValue placeholder="Select Qualification" />
              </SelectTrigger>
              <SelectContent>
                {qualifications.map(q => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.qualification && <p className="text-xs text-destructive">{errors.qualification}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Study Destination *</label>
            <Select
              value={data.studyDestination}
              onValueChange={(v) => {
                onUpdate({ studyDestination: v });
                setErrors(p => ({ ...p, destination: '' }));
              }}
            >
              <SelectTrigger className={cn("h-14 bg-background", errors.destination && "border-destructive")}>
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination && <p className="text-xs text-destructive">{errors.destination}</p>}
          </div>
        </div>


        {/* Row 2: Loan Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Loan Amount Required *</label>
          <div className="flex flex-wrap gap-2">
            {amountRanges.map(range => (
              <motion.button
                key={range.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onUpdate({ loanAmount: range.min }); setErrors(p => ({ ...p, amount: '' })); }}
                className={cn(
                  "px-4 py-3 rounded-lg border text-sm font-medium transition-all shadow-sm",
                  data.loanAmount === range.min
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                    : "border-input bg-background hover:bg-muted text-foreground",
                  errors.amount && !data.loanAmount && "border-destructive"
                )}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
          {data.studyDestination && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Typical amount for {data.studyDestination} is ₹40-60L
            </p>
          )}
        </div>

        {/* Row 3: Universities */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Target Universities * <span className="text-muted-foreground font-normal">(max 3)</span>
          </label>

          {/* Selected universities as chips */}
          {selectedUnis.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedUnis.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-blue-50 border border-blue-100 text-sm text-blue-700 shadow-sm">
                  <span className="font-medium truncate max-w-[200px]">{u.name}</span>
                  <button
                    type="button"
                    onClick={() => removeUni(u.id)}
                    className="w-5 h-5 rounded-full hover:bg-blue-100 flex items-center justify-center transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown for selecting universities */}
          {selectedUnis.length < 3 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-lg border bg-background text-left transition-all hover:bg-muted/30",
                  uniDropdownOpen ? "border-primary ring-2 ring-primary/10" : "border-input",
                  errors.universities && !data.universities?.length && "border-destructive"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className={cn("text-sm", isLoadingUnis ? "text-muted-foreground" : "text-foreground")}>
                    {isLoadingUnis ? 'Loading...' : 'Search & Select University'}
                  </span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", uniDropdownOpen && "rotate-180")} />
              </button>

              {uniDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-2xl max-h-80 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Search input */}
                  <div className="p-3 border-b border-border bg-muted/30">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 text-sm bg-background shadow-inner"
                      autoFocus
                    />
                  </div>

                  {/* University list */}
                  <div className="overflow-y-auto max-h-60 scrollbar-thin">
                    {universities.filter(u => !selectedUnis.some(s => s.id === u.id)).map(uni => (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => {
                          selectUni(uni);
                          if (selectedUnis.length >= 2) setUniDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left border-b border-border/50 last:border-b-0 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{uni.name}</div>
                          <div className="text-xs text-muted-foreground">{uni.city}, {uni.country}</div>
                        </div>
                        {uni.global_rank && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                            #{uni.global_rank}
                          </span>
                        )}
                      </button>
                    ))}
                    {universities.length === 0 && !isLoadingUnis && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-muted-foreground bg-muted/50 py-2 rounded-lg">
                          {searchQuery ? 'No universities found' : 'Select a destination first'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {errors.universities && <p className="text-xs text-destructive">{errors.universities}</p>}
        </div>

        {/* Row 4: Course Type */}
        <CourseTypeSelector
          value={data.courseType}
          onChange={(value) => {
            onUpdate({ courseType: value });
            setErrors(p => ({ ...p, courseType: '' }));
          }}
          error={!!errors.courseType}
          required
        />

        {/* Row 5: Intake Month */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Expected Start Date *</label>
          <div className="flex flex-wrap gap-2">
            {intakeMonths.map(m => {
              const isSelected = data.intakeMonth === m.month && data.intakeYear === m.year;
              return (
                <motion.button
                  key={`${m.month}-${m.year}`}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onUpdate({ intakeMonth: m.month, intakeYear: m.year });
                    setErrors(p => ({ ...p, intake: '' }));
                  }}
                  className={cn(
                    "flex flex-col items-center px-4 py-2 rounded-lg border transition-all min-w-[70px] shadow-sm",
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                      : "border-input bg-background hover:bg-muted text-foreground",
                    errors.intake && !data.intakeMonth && !isPlanningLater && "border-destructive"
                  )}
                >
                  <span className="font-bold text-sm">{m.label}</span>
                  <span className="text-xs opacity-70">{m.year}</span>
                </motion.button>
              );
            })}
            {/* Planning for later option */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onUpdate({ intakeMonth: 0, intakeYear: 0 });
                setErrors(p => ({ ...p, intake: '' }));
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg border transition-all shadow-sm",
                isPlanningLater
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                  : "border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground",
                errors.intake && !data.intakeMonth && !isPlanningLater && "border-destructive"
              )}
            >
              <span className="text-sm font-medium">📅 Not sure yet</span>
            </motion.button>
          </div>
          {errors.intake && <p className="text-xs text-destructive">{errors.intake}</p>}
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
          onClick={handleContinue}
          size="lg"
          className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/25 border-t border-white/20"
        >
          Continue <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default StudyLoanPage;
