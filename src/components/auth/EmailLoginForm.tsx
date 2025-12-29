import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface EmailLoginFormProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  
  // Customization
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  submitText?: string;
  loadingText?: string;
  showSubmitIcon?: boolean;
  SubmitIcon?: LucideIcon;
  
  // Styling
  accentColor?: string; // e.g., 'primary', 'teal-600', 'slate-900'
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function EmailLoginForm({
  email,
  password,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  
  // Defaults
  emailLabel = 'Email',
  emailPlaceholder = 'you@example.com',
  passwordLabel = 'Password',
  passwordPlaceholder = 'Enter your password',
  submitText = 'Sign In',
  loadingText = 'Signing in...',
  showSubmitIcon = true,
  SubmitIcon = ArrowRight,
  
  // Styling
  accentColor = 'primary',
  className,
  inputClassName,
  buttonClassName,
}: EmailLoginFormProps) {
  // Dynamic accent color classes
  const getAccentClasses = (type: 'icon' | 'focus' | 'button') => {
    const colorMap: Record<string, Record<string, string>> = {
      'primary': {
        icon: 'text-primary',
        focus: 'focus:ring-primary/30 focus:border-primary',
        button: 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary',
      },
      'teal-600': {
        icon: 'text-teal-600',
        focus: 'focus:ring-teal-500/30 focus:border-teal-500',
        button: 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600',
      },
      'slate-900': {
        icon: 'text-muted-foreground',
        focus: 'focus:ring-primary/30 focus:border-primary',
        button: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900',
      },
    };
    
    return colorMap[accentColor]?.[type] || colorMap['primary'][type];
  };

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label 
          htmlFor="email" 
          className="text-sm font-semibold flex items-center gap-2 text-foreground"
        >
          <Mail className={cn("h-4 w-4", getAccentClasses('icon'))} />
          {emailLabel}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={onEmailChange}
          required
          autoComplete="email"
          className={cn(
            "h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 transition-all placeholder:text-muted-foreground/70",
            getAccentClasses('focus'),
            inputClassName
          )}
        />
      </div>
      
      <div className="space-y-2">
        <Label 
          htmlFor="password" 
          className="text-sm font-semibold flex items-center gap-2 text-foreground"
        >
          <Lock className={cn("h-4 w-4", getAccentClasses('icon'))} />
          {passwordLabel}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={passwordPlaceholder}
          value={password}
          onChange={onPasswordChange}
          required
          autoComplete="current-password"
          className={cn(
            "h-12 rounded-xl bg-muted/50 border-border focus:bg-background focus:ring-2 transition-all placeholder:text-muted-foreground/70",
            getAccentClasses('focus'),
            inputClassName
          )}
        />
      </div>

      <div className="pt-3">
        <LoadingButton
          type="submit"
          className={cn(
            "w-full h-12 font-semibold text-base rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg",
            getAccentClasses('button'),
            buttonClassName
          )}
          loading={isLoading}
          loadingText={loadingText}
        >
          {submitText}
          {showSubmitIcon && SubmitIcon && <SubmitIcon className="w-4 h-4 ml-2" />}
        </LoadingButton>
      </div>
    </form>
  );
}
