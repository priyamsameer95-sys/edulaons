import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconVariant = 'primary' | 'success' | 'warning' | 'purple' | 'rose' | 'orange' | 'indigo';

interface FeatureIconProps {
    icon: LucideIcon;
    variant?: IconVariant;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    iconClassName?: string;
}

const variantStyles: Record<IconVariant, string> = {
    primary: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

const sizeStyles = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
};

const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
};

export function FeatureIcon({
    icon: Icon,
    variant = 'primary',
    size = 'md',
    className,
    iconClassName
}: FeatureIconProps) {
    return (
        <div className={cn(
            "flex items-center justify-center border transition-transform hover:scale-105 duration-200",
            variantStyles[variant],
            sizeStyles[size],
            className
        )}>
            <Icon className={cn(iconSizes[size], iconClassName)} strokeWidth={2.5} />
        </div>
    );
}
