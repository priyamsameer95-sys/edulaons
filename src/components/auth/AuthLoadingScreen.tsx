import { cn } from '@/lib/utils';
import { LottieAnimation } from '@/components/ui/lottie-animation';

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
      "flex h-screen items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        {/* Using a "Paper Plane" loading animation for a travel/future theme */}
        <LottieAnimation
          animationUrl="https://assets5.lottiefiles.com/packages/lf20_t2rngd5k.json"
          className="w-48 h-48"
        />
        <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
}

