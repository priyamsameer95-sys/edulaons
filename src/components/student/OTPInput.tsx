import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  hasError?: boolean;
}

export const OTPInput = ({
  length = 4,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  className,
  hasError = false,
}: OTPInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shake, setShake] = useState(false);

  // Split value into individual digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Trigger shake animation on error
  useEffect(() => {
    if (hasError) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  const focusInput = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clampedIndex]?.focus();
    setActiveIndex(clampedIndex);
  };

  const handleChange = (index: number, char: string) => {
    // Only allow digits
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    onChange(newDigits.join(''));

    // Move to next input if we entered a digit
    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Clear current input
        handleChange(index, '');
      } else if (index > 0) {
        // Move to previous input and clear it
        focusInput(index - 1);
        handleChange(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      focusInput(Math.min(pastedData.length, length - 1));
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    // Select the input content
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn(
      'flex gap-3 justify-center transition-transform',
      shake && 'animate-shake',
      className
    )}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          className={cn(
            'w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200',
            'bg-background text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            activeIndex === index && !disabled
              ? 'border-primary shadow-lg shadow-primary/20 scale-105'
              : 'border-border hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            digit && !hasError && 'border-primary/50 bg-primary/5',
            hasError && 'border-destructive bg-destructive/5'
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
