import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';

interface Option {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
}

interface SelectQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  options: Option[];
  columns?: 2 | 3 | 4;
  allowKeyboardNav?: boolean;
}

const SelectQuestion = ({
  value,
  onChange,
  onSubmit,
  options,
  columns = 2,
  allowKeyboardNav = true,
}: SelectQuestionProps) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    // Auto-advance after short delay for visual feedback
    setTimeout(() => onSubmit(), 200);
  }, [onChange, onSubmit]);

  useEffect(() => {
    if (!allowKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Number keys 1-9 for quick selection
      if (/^[1-9]$/.test(key)) {
        const index = parseInt(key) - 1;
        if (index < options.length) {
          e.preventDefault();
          handleSelect(options[index].value);
        }
        return;
      }

      // Arrow navigation
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        handleSelect(options[focusedIndex].value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, focusedIndex, handleSelect, allowKeyboardNav]);

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className="space-y-6">
      <div className={cn('grid gap-3', gridCols[columns])}>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFocused = focusedIndex === index;

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                "hover:border-primary hover:bg-primary/5",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected && "border-primary bg-primary/10",
                !isSelected && "border-border bg-card",
                isFocused && !isSelected && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Number key hint */}
                <span className={cn(
                  "flex-shrink-0 w-6 h-6 rounded text-xs font-medium",
                  "flex items-center justify-center border",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {isSelected ? <Check className="h-4 w-4" /> : index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {option.emoji && (
                      <span className="text-xl">{option.emoji}</span>
                    )}
                    <span className={cn(
                      "font-medium text-base",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">1</kbd>-
        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{Math.min(options.length, 9)}</kbd> or click to select
      </p>
    </div>
  );
};

export default SelectQuestion;
