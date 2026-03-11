import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
  className?: string;
  iconClassName?: string;
}

export function AuthLoadingScreen({
  message = 'Loading...',
  className,
}: AuthLoadingScreenProps) {
  return (
    <div className={cn(
      "flex h-screen items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo spinner — no external CDN dependency */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
}
