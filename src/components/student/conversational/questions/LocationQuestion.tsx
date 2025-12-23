import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check, MapPin } from 'lucide-react';

interface LocationQuestionProps {
  city: string;
  state: string;
  postalCode: string;
  onChange: (field: 'city' | 'state' | 'postalCode', value: string) => void;
  onSubmit: () => void;
}

const LocationQuestion = ({
  city,
  state,
  postalCode,
  onChange,
  onSubmit,
}: LocationQuestionProps) => {
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTimeout(() => postalCodeRef.current?.focus(), 100);
  }, []);

  const validatePostalCode = (code: string): string | null => {
    if (!code) return 'PIN code is required';
    if (!/^\d{6}$/.test(code)) return 'Please enter a valid 6-digit PIN code';
    return null;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    const postalError = validatePostalCode(postalCode);
    if (postalError) {
      setError(postalError);
      setTouched(true);
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      setTouched(true);
      return;
    }
    setError(null);
    onSubmit();
  };

  const handlePostalCodeChange = (value: string) => {
    // Only allow digits and max 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    onChange('postalCode', cleaned);
    if (touched) {
      setError(validatePostalCode(cleaned));
    }
  };

  const isValid = postalCode.length === 6 && city.trim();

  return (
    <div className="space-y-6">
      {/* Postal Code */}
      <div className="relative">
        <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <input
          ref={postalCodeRef}
          type="text"
          inputMode="numeric"
          value={postalCode}
          onChange={(e) => handlePostalCodeChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, cityRef)}
          onBlur={() => setTouched(true)}
          placeholder="Enter PIN code"
          className={cn(
            "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 pl-10 text-xl sm:text-2xl",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            "transition-colors duration-200",
            error && touched && "border-destructive focus:border-destructive"
          )}
        />
      </div>

      {/* City and State in a row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            ref={cityRef}
            type="text"
            value={city}
            onChange={(e) => onChange('city', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, stateRef)}
            placeholder="City"
            className={cn(
              "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 text-lg sm:text-xl",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              "transition-colors duration-200"
            )}
          />
        </div>
        <div>
          <input
            ref={stateRef}
            type="text"
            value={state}
            onChange={(e) => onChange('state', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder="State"
            className={cn(
              "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 text-lg sm:text-xl",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
              "transition-colors duration-200"
            )}
          />
        </div>
      </div>

      {error && touched && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {isValid && (
        <div className="flex items-center gap-2 text-success">
          <Check className="h-5 w-5" />
          <span className="text-sm">Location confirmed</span>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!postalCode || !city.trim()}
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

export default LocationQuestion;
