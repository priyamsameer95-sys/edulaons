import { useState, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { HighestQualification } from '@/types/student-application';

interface AcademicScoresQuestionProps {
  qualification: HighestQualification;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  bachelorsPercentage?: number;
  bachelorsCgpa?: number;
  onChange: (field: string, value: number | undefined) => void;
  onSubmit: () => void;
}

const AcademicScoresQuestion = ({
  qualification,
  tenthPercentage,
  twelfthPercentage,
  bachelorsPercentage,
  bachelorsCgpa,
  onChange,
  onSubmit,
}: AcademicScoresQuestionProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePercentage = (value: number | undefined): string | null => {
    if (value === undefined) return null;
    if (value < 0 || value > 100) return 'Must be 0-100';
    return null;
  };

  const validateCgpa = (value: number | undefined): string | null => {
    if (value === undefined) return null;
    if (value < 0 || value > 10) return 'Must be 0-10';
    return null;
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    const tenthError = validatePercentage(tenthPercentage);
    if (tenthError) newErrors.tenthPercentage = tenthError;
    
    const twelfthError = validatePercentage(twelfthPercentage);
    if (twelfthError) newErrors.twelfthPercentage = twelfthError;
    
    if (['bachelors', 'masters', 'phd'].includes(qualification)) {
      const bachelorsPctError = validatePercentage(bachelorsPercentage);
      if (bachelorsPctError) newErrors.bachelorsPercentage = bachelorsPctError;
      
      const cgpaError = validateCgpa(bachelorsCgpa);
      if (cgpaError) newErrors.bachelorsCgpa = cgpaError;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onChange(field, numValue);
  };

  const showBachelors = ['bachelors', 'masters', 'phd'].includes(qualification);

  const ScoreInput = ({ 
    label, 
    field, 
    value, 
    max = 100,
    suffix = '%'
  }: { 
    label: string; 
    field: string; 
    value?: number;
    max?: number;
    suffix?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => handleChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
          min={0}
          max={max}
          step={max === 10 ? 0.1 : 1}
          placeholder={`0-${max}`}
          className={cn(
            "w-full bg-muted/50 border-2 border-border rounded-lg px-4 py-3 text-lg",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            "transition-colors duration-200",
            errors[field] && "border-destructive focus:border-destructive"
          )}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {suffix}
        </span>
      </div>
      {errors[field] && (
        <p className="text-destructive text-xs">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ScoreInput 
          label="10th Percentage" 
          field="tenthPercentage" 
          value={tenthPercentage} 
        />
        <ScoreInput 
          label="12th Percentage" 
          field="twelfthPercentage" 
          value={twelfthPercentage} 
        />
        {showBachelors && (
          <>
            <ScoreInput 
              label="Bachelor's Percentage" 
              field="bachelorsPercentage" 
              value={bachelorsPercentage} 
            />
            <ScoreInput 
              label="Bachelor's CGPA" 
              field="bachelorsCgpa" 
              value={bachelorsCgpa}
              max={10}
              suffix="/10"
            />
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Fill in the scores you have. Leave blank if not applicable.
      </p>

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

export default AcademicScoresQuestion;
