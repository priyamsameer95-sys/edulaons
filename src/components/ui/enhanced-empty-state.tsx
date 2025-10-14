import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedEmptyStateProps {
  variant?: 'welcome' | 'no-data' | 'error' | 'success';
  icon?: LucideIcon;
  title: string;
  description: string;
  supportingText?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'outline' | 'ghost';
  };
  features?: Array<{
    icon: LucideIcon;
    text: string;
  }>;
  className?: string;
}

export const EnhancedEmptyState = ({
  variant = 'no-data',
  icon: Icon,
  title,
  description,
  supportingText,
  primaryAction,
  secondaryAction,
  features,
  className,
}: EnhancedEmptyStateProps) => {
  const variantStyles = {
    welcome: 'bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50',
    'no-data': 'bg-muted/20',
    error: 'bg-destructive-light/30',
    success: 'bg-success-light/30',
  };

  const iconColors = {
    welcome: 'text-primary',
    'no-data': 'text-muted-foreground',
    error: 'text-destructive',
    success: 'text-success',
  };

  return (
    <div className={cn(
      'rounded-lg p-12 animate-fade-in',
      variantStyles[variant],
      className
    )}>
      <div className="max-w-2xl mx-auto text-center space-y-6">
        {/* Icon */}
        {Icon && (
          <div className="flex justify-center">
            <div className={cn(
              'rounded-full p-6 animate-scale-in',
              variant === 'welcome' ? 'bg-primary/10' :
              variant === 'error' ? 'bg-destructive/10' :
              variant === 'success' ? 'bg-success/10' :
              'bg-muted/30'
            )}>
              <Icon className={cn('h-16 w-16', iconColors[variant])} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {description}
          </p>
          {supportingText && (
            <p className="text-sm text-muted-foreground/80">
              {supportingText}
            </p>
          )}
        </div>

        {/* Features List */}
        {features && features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mt-8">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50 shadow-sm',
                    `stagger-fade-${Math.min(index + 1, 4)}`
                  )}
                >
                  <div className="rounded-full p-2 bg-primary/10">
                    <FeatureIcon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground text-left">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                size="lg"
                className="min-w-[200px] hover-lift"
              >
                {primaryAction.icon && <primaryAction.icon className="h-5 w-5 mr-2" />}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
                size="lg"
                className="min-w-[200px]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
