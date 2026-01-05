import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentApplicationData, HighestQualification, CourseType } from '@/types/student-application';

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


const courseTypes: { value: CourseType; label: string }[] = [
  { value: 'masters_stem', label: 'Masters STEM' },
  { value: 'bachelors_stem', label: 'Bachelors STEM' },
  { value: 'mba_management', label: 'MBA' },
  { value: 'others', label: 'Others' },
];

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <GraduationCap className="w-4 h-4" /> Step 2 of 3
        </div>
        <h1 className="text-2xl font-bold text-foreground">Your Study Plans</h1>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-lg p-5 sm:p-6 space-y-6">
        
        {/* Row 1: Qualification & Destination */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Qualification *</label>
            <Select 
              value={data.highestQualification} 
              onValueChange={(v) => { 
                onUpdate({ highestQualification: v as HighestQualification }); 
                setErrors(p => ({ ...p, qualification: '' }));
              }}
            >
              <SelectTrigger className={cn("h-11 text-sm", errors.qualification && "border-destructive")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {qualifications.map(q => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Destination *</label>
            <Select 
              value={data.studyDestination} 
              onValueChange={(v) => { 
                onUpdate({ studyDestination: v }); 
                setErrors(p => ({ ...p, destination: '' }));
              }}
            >
              <SelectTrigger className={cn("h-11 text-sm", errors.destination && "border-destructive")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Row 2: Loan Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Loan Amount *</label>
          <div className="flex flex-wrap gap-2">
            {amountRanges.map(range => (
              <button
                key={range.value}
                type="button"
                onClick={() => { onUpdate({ loanAmount: range.min }); setErrors(p => ({ ...p, amount: '' })); }}
                className={cn(
                  "px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                  data.loanAmount === range.min
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-foreground",
                  errors.amount && !data.loanAmount && "border-destructive"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          {data.studyDestination && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5" /> Most {data.studyDestination} students need ₹40-60L
            </p>
          )}
        </div>

        {/* Row 3: Universities */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Universities * <span className="text-muted-foreground font-normal">(max 3)</span>
          </label>
          
          {/* Selected universities as chips */}
          {selectedUnis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedUnis.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs">
                  <span className="font-medium truncate max-w-[150px]">{u.name}</span>
                  <button 
                    type="button"
                    onClick={() => removeUni(u.id)} 
                    className="w-4 h-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
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
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 bg-background text-left",
                  uniDropdownOpen ? "border-primary" : "border-border",
                  errors.universities && !data.universities?.length && "border-destructive"
                )}
              >
                <span className="text-sm text-muted-foreground">
                  {isLoadingUnis ? 'Loading...' : 'Click to select university'}
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", uniDropdownOpen && "rotate-180")} />
              </button>
              
              {uniDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      placeholder="Search universities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background outline-none focus:border-primary"
                      autoFocus
                    />
                  </div>
                  
                  {/* University list */}
                  <div className="overflow-y-auto max-h-48">
                    {universities.filter(u => !selectedUnis.some(s => s.id === u.id)).map(uni => (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => {
                          selectUni(uni);
                          if (selectedUnis.length >= 2) setUniDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 text-left border-b border-border/50 last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{uni.name}</div>
                          <div className="text-xs text-muted-foreground">{uni.city}, {uni.country}</div>
                        </div>
                        {uni.global_rank && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                            #{uni.global_rank}
                          </span>
                        )}
                      </button>
                    ))}
                    {universities.length === 0 && !isLoadingUnis && (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No universities found' : 'Select a destination first'}
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Course Type *</label>
          <div className="flex flex-wrap gap-2">
            {courseTypes.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => { onUpdate({ courseType: ct.value }); setErrors(p => ({ ...p, courseType: '' })); }}
                className={cn(
                  "px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                  data.courseType === ct.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-foreground",
                  errors.courseType && !data.courseType && "border-destructive"
                )}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 5: Intake Month */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Expected Start Date</label>
          <div className="flex flex-wrap gap-2">
            {intakeMonths.map(m => {
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
                    "flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all min-w-[60px]",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40",
                    errors.intake && !data.intakeMonth && !isPlanningLater && "border-destructive"
                  )}
                >
                  <span className="font-medium text-foreground text-sm">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.year}</span>
                </button>
              );
            })}
            {/* Planning for later option */}
            <button
              type="button"
              onClick={() => {
                onUpdate({ intakeMonth: 0, intakeYear: 0 });
                setErrors(p => ({ ...p, intake: '' }));
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-lg border-2 transition-all",
                isPlanningLater
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
                errors.intake && !data.intakeMonth && !isPlanningLater && "border-destructive"
              )}
            >
              <span className="text-sm font-medium text-foreground">📅 Not sure yet</span>
            </button>
          </div>
        </div>

      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <Button variant="outline" onClick={onPrev} size="sm" className="rounded-full">← Back</Button>
        <Button onClick={handleContinue} size="sm" className="rounded-full px-6">Continue →</Button>
      </div>
    </motion.div>
  );
};

export default StudyLoanPage;
