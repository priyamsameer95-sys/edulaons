import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface IntakeQuestionProps {
  month: number | undefined;
  year: number | undefined;
  onChange: (field: 'month' | 'year', value: number) => void;
  onSubmit: () => void;
}

const months = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

const IntakeQuestion = ({
  month,
  year,
  onChange,
  onSubmit,
}: IntakeQuestionProps) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const handleSubmit = () => {
    if (month && year) {
      onSubmit();
    }
  };

  const isValid = month && year;

  return (
    <div className="space-y-6">
      {/* Year selection */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Year</p>
        <div className="flex gap-3">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onChange('year', y)}
              className={cn(
                "flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all",
                year === y 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Month selection */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Month</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {months.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange('month', m.value)}
              className={cn(
                "py-3 rounded-lg border-2 text-sm font-medium transition-all",
                month === m.value 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isValid && (
        <div className="flex items-center gap-2 text-success">
          <Check className="h-5 w-5" />
          <span className="text-sm">
            Starting {months.find(m => m.value === month)?.label} {year}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
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

export default IntakeQuestion;
