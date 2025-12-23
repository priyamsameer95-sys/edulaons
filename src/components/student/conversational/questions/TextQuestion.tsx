import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  validation?: (value: string) => string | null;
  autoFocus?: boolean;
  prefix?: string;
  maxLength?: number;
}

const TextQuestion = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your answer here...',
  type = 'text',
  validation,
  autoFocus = true,
  prefix,
  maxLength,
}: TextQuestionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (validation) {
      const validationError = validation(value);
      if (validationError) {
        setError(validationError);
        setTouched(true);
        return;
      }
    }
    setError(null);
    onSubmit();
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (touched && validation) {
      const validationError = validation(newValue);
      setError(validationError);
    }
  };

  const isValid = value.trim() && (!validation || !validation(value));

  return (
    <div className="space-y-4">
      <div className="relative">
        {prefix && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 text-xl sm:text-2xl",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            "transition-colors duration-200",
            prefix && "pl-12",
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
          disabled={!value.trim()}
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

export default TextQuestion;
