import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check, IndianRupee } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AmountQuestionProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
  min?: number;
  max?: number;
  step?: number;
  formatLabel?: (value: number) => string;
}

const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const AmountQuestion = ({
  value,
  onChange,
  onSubmit,
  min = 100000,
  max = 15000000,
  step = 100000,
  formatLabel = formatIndianCurrency,
}: AmountQuestionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (value >= min && value <= max) {
      onSubmit();
    }
  };

  const handleInputChange = (inputValue: string) => {
    const numValue = parseInt(inputValue.replace(/,/g, ''), 10) || 0;
    onChange(Math.min(Math.max(numValue, min), max));
  };

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const isValid = value >= min && value <= max;

  return (
    <div className="space-y-8">
      {/* Amount display */}
      <div className="relative">
        <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value.toLocaleString('en-IN')}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 pl-12 text-3xl sm:text-4xl font-semibold",
            "focus:outline-none focus:border-primary transition-colors duration-200"
          )}
        />
        {isValid && (
          <Check className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-success" />
        )}
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{formatLabel(min)}</span>
          <span>{formatLabel(max)}</span>
        </div>
      </div>

      {/* Quick amount buttons */}
      <div className="flex flex-wrap gap-2">
        {[500000, 1000000, 2500000, 5000000, 7500000, 10000000].map((amt) => (
          <button
            key={amt}
            onClick={() => onChange(amt)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              value === amt 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {formatLabel(amt)}
          </button>
        ))}
      </div>

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

export default AmountQuestion;
