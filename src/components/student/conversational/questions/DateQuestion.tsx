import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check, Calendar } from 'lucide-react';

interface DateQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  minAge?: number;
  maxAge?: number;
}

const DateQuestion = ({
  value,
  onChange,
  onSubmit,
  minAge = 16,
  maxAge = 45,
}: DateQuestionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const validateAge = (dateStr: string): string | null => {
    if (!dateStr) return 'Please enter your date of birth';
    
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) return `You must be at least ${minAge} years old`;
    if (age > maxAge) return `Age cannot exceed ${maxAge} years`;
    
    return null;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const validationError = validateAge(value);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }
    setError(null);
    onSubmit();
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (touched) {
      const validationError = validateAge(newValue);
      setError(validationError);
    }
  };

  const isValid = value && !validateAge(value);

  // Calculate max date (minAge years ago) and min date (maxAge years ago)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          min={minDate}
          max={maxDate}
          className={cn(
            "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 pl-10 text-xl sm:text-2xl",
            "focus:outline-none focus:border-primary transition-colors duration-200",
            "[color-scheme:light] dark:[color-scheme:dark]",
            error && touched && "border-destructive focus:border-destructive"
          )}
        />
        {isValid && (
          <Check className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-success" />
        )}
      </div>

      {error && touched && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!value}
          className={cn(
            "px-6 py-3 rounded-lg font-medium text-base transition-all duration-200",
            "bg-primary text-primary-foreground hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
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

export default DateQuestion;
