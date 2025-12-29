import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLoadingScreenProps {
  message?: string;
  className?: string;
  iconClassName?: string;
}

export function AuthLoadingScreen({ 
  message = 'Loading...', 
  className,
  iconClassName 
}: AuthLoadingScreenProps) {
  return (
    <div className={cn(
      "flex h-screen items-center justify-center bg-background",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={cn("h-8 w-8 animate-spin text-primary", iconClassName)} />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
