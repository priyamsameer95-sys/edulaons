import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap, Search, X, Loader2, Check, IndianRupee } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import type { StudentApplicationData, HighestQualification } from '@/types/student-application';

interface StudyLoanPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
}

interface University {
  id: string;
  name: string;
  city: string;
  country: string;
}

const qualifications: { value: HighestQualification; label: string }[] = [
  { value: '12th', label: '12th / High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
];

const destinations = [
  { value: 'USA', label: 'USA', emoji: '🇺🇸' },
  { value: 'UK', label: 'UK', emoji: '🇬🇧' },
  { value: 'Canada', label: 'Canada', emoji: '🇨🇦' },
  { value: 'Australia', label: 'Australia', emoji: '🇦🇺' },
  { value: 'Germany', label: 'Germany', emoji: '🇩🇪' },
  { value: 'Ireland', label: 'Ireland', emoji: '🇮🇪' },
];

const loanTypes = [
  { value: 'secured', label: 'Secured', description: 'Lower interest with collateral' },
  { value: 'unsecured', label: 'Unsecured', description: 'No collateral needed' },
];

const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];
const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

const StudyLoanPage = ({ data, onUpdate, onNext }: StudyLoanPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // University search state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const qualification = data.highestQualification || 'bachelors';
  const showBachelors = ['bachelors', 'masters', 'phd'].includes(qualification);

  // Fetch selected universities on mount
  useEffect(() => {
    if (data.universities && data.universities.length > 0) {
      const fetchSelected = async () => {
        const { data: unis } = await supabase
          .from('universities')
          .select('id, name, city, country')
          .in('id', data.universities || []);
        if (unis) setSelectedUniversities(unis);
      };
      fetchSelected();
    }
  }, []);

  // Search universities
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    const searchUniversities = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('universities')
          .select('id, name, city, country')
          .ilike('name', `%${debouncedSearch}%`)
          .limit(8);

        if (data.studyDestination) {
          query = query.ilike('country', `%${data.studyDestination}%`);
        }

        const { data: unis } = await query;
        setResults(unis || []);
      } catch (error) {
        console.error('Error searching universities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchUniversities();
  }, [debouncedSearch, data.studyDestination]);

  const handleSelectUniversity = useCallback((university: University) => {
    const selectedIds = data.universities || [];
    if (selectedIds.includes(university.id)) {
      const newIds = selectedIds.filter(id => id !== university.id);
      onUpdate({ universities: newIds });
      setSelectedUniversities(prev => prev.filter(u => u.id !== university.id));
    } else if (selectedIds.length < 3) {
      const newIds = [...selectedIds, university.id];
      onUpdate({ universities: newIds });
      setSelectedUniversities(prev => [...prev, university]);
    }
    setSearch('');
    setResults([]);
  }, [data.universities, onUpdate]);

  const handleRemoveUniversity = (id: string) => {
    const newIds = (data.universities || []).filter(uid => uid !== id);
    onUpdate({ universities: newIds });
    setSelectedUniversities(prev => prev.filter(u => u.id !== id));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.highestQualification) newErrors.qualification = 'Please select qualification';
    if (!data.studyDestination) newErrors.destination = 'Please select destination';
    if (!data.universities || data.universities.length === 0) newErrors.universities = 'Select at least 1 university';
    if (!data.loanType) newErrors.loanType = 'Please select loan type';
    if (!data.loanAmount || data.loanAmount < 100000 || data.loanAmount > 15000000) {
      newErrors.loanAmount = 'Amount must be ₹1L - ₹1.5Cr';
    }
    if (!data.intakeMonth) newErrors.intake = 'Select intake month';
    if (!data.intakeYear) newErrors.intake = 'Select intake year';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    setTouched({ qualification: true, destination: true, universities: true, loanType: true, loanAmount: true, intake: true });
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Study & Loan Details</h2>
        <p className="text-muted-foreground">Tell us about your education plans</p>
      </div>

      {/* Highest Qualification */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Highest Qualification *
        </label>
        <div className="flex flex-wrap gap-2">
          {qualifications.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => onUpdate({ highestQualification: q.value })}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                data.highestQualification === q.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-foreground"
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Academic Scores */}
      <div className="bg-muted/30 rounded-xl p-4">
        <label className="text-sm font-medium text-foreground mb-4 block">Academic Scores (Optional)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">10th %</label>
            <input
              type="number"
              value={data.tenthPercentage ?? ''}
              onChange={(e) => onUpdate({ tenthPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
              min={0}
              max={100}
              placeholder="0-100"
              className="w-full bg-card border-2 border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">12th %</label>
            <input
              type="number"
              value={data.twelfthPercentage ?? ''}
              onChange={(e) => onUpdate({ twelfthPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
              min={0}
              max={100}
              placeholder="0-100"
              className="w-full bg-card border-2 border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {showBachelors && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bachelor's %</label>
                <input
                  type="number"
                  value={data.bachelorsPercentage ?? ''}
                  onChange={(e) => onUpdate({ bachelorsPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0}
                  max={100}
                  placeholder="0-100"
                  className="w-full bg-card border-2 border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">CGPA</label>
                <input
                  type="number"
                  value={data.bachelorsCgpa ?? ''}
                  onChange={(e) => onUpdate({ bachelorsCgpa: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min={0}
                  max={10}
                  step={0.1}
                  placeholder="0-10"
                  className="w-full bg-card border-2 border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Study Destination */}
      <div className="border-t border-border pt-6">
        <label className="text-sm font-medium text-foreground mb-3 block">Where do you want to study? *</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {destinations.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onUpdate({ studyDestination: d.value })}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                data.studyDestination === d.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-2xl">{d.emoji}</span>
              <span className="text-xs font-medium text-foreground">{d.label}</span>
            </button>
          ))}
        </div>
        {errors.destination && touched.destination && <p className="text-destructive text-xs mt-2">{errors.destination}</p>}
      </div>

      {/* Universities */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Universities (Select up to 3) *
        </label>
        
        {/* Selected pills */}
        {selectedUniversities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedUniversities.map((uni) => (
              <div
                key={uni.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
              >
                <span>{uni.name}</span>
                <button onClick={() => handleRemoveUniversity(uni.id)} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              (data.universities || []).length >= 3
                ? "Maximum 3 universities selected"
                : "Search universities..."
            }
            disabled={(data.universities || []).length >= 3}
            className={cn(
              "w-full bg-card border-2 border-border rounded-lg pl-10 pr-4 py-3 text-base",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden bg-card max-h-60 overflow-y-auto">
            {results.map((university) => {
              const isSelected = (data.universities || []).includes(university.id);
              return (
                <button
                  key={university.id}
                  onClick={() => handleSelectUniversity(university)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left",
                    "hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{university.name}</p>
                    <p className="text-xs text-muted-foreground">{university.city}, {university.country}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
        {errors.universities && touched.universities && <p className="text-destructive text-xs mt-2">{errors.universities}</p>}
      </div>

      {/* Loan Type */}
      <div className="border-t border-border pt-6">
        <label className="text-sm font-medium text-foreground mb-3 block">Loan Type *</label>
        <div className="grid grid-cols-2 gap-4">
          {loanTypes.map((lt) => (
            <button
              key={lt.value}
              type="button"
              onClick={() => onUpdate({ loanType: lt.value as 'secured' | 'unsecured' })}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                data.loanType === lt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="font-semibold text-foreground">{lt.label}</span>
              <span className="text-xs text-muted-foreground mt-1">{lt.description}</span>
            </button>
          ))}
        </div>
        {errors.loanType && touched.loanType && <p className="text-destructive text-xs mt-2">{errors.loanType}</p>}
      </div>

      {/* Loan Amount */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Loan Amount *</label>
        <div className="relative mb-4">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <input
            type="text"
            value={(data.loanAmount || 3000000).toLocaleString('en-IN')}
            onChange={(e) => {
              const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 100000;
              onUpdate({ loanAmount: Math.min(Math.max(val, 100000), 15000000) });
            }}
            className="w-full bg-card border-2 border-border rounded-lg pl-12 pr-4 py-3 text-xl font-semibold focus:outline-none focus:border-primary"
          />
        </div>
        <Slider
          value={[data.loanAmount || 3000000]}
          onValueChange={(values) => onUpdate({ loanAmount: values[0] })}
          min={100000}
          max={15000000}
          step={100000}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>₹1 Lakh</span>
          <span>₹1.5 Crore</span>
        </div>
        {/* Quick amounts */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[500000, 1000000, 2500000, 5000000, 7500000, 10000000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onUpdate({ loanAmount: amt })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                data.loanAmount === amt
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {formatIndianCurrency(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Intake */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Intake *</label>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={data.intakeMonth || ''}
            onChange={(e) => onUpdate({ intakeMonth: parseInt(e.target.value, 10) })}
            className="w-full bg-card border-2 border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-primary"
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={data.intakeYear || ''}
            onChange={(e) => onUpdate({ intakeYear: parseInt(e.target.value, 10) })}
            className="w-full bg-card border-2 border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-primary"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {errors.intake && touched.intake && <p className="text-destructive text-xs mt-2">{errors.intake}</p>}
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

export default StudyLoanPage;
