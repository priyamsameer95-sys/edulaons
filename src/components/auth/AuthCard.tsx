import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface AuthCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  
  // Styling
  iconGradient?: string; // e.g., 'from-primary to-blue-500'
  iconBgGradient?: string; // e.g., 'from-[#2563EB] to-[#3B82F6]'
  glowColor?: string; // e.g., 'primary/25', 'teal-500/25'
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function AuthCard({
  icon: Icon,
  title,
  description,
  children,
  iconGradient = 'from-primary to-blue-500',
  iconBgGradient = 'from-primary to-primary/80',
  glowColor = 'primary/25',
  className,
  headerClassName,
  contentClassName,
}: AuthCardProps) {
  return (
    <Card className={cn(
      "w-full max-w-md shadow-2xl shadow-black/10 border-0 rounded-3xl relative z-10 bg-background ring-1 ring-border/50",
      className
    )}>
      <CardHeader className={cn("text-center space-y-4 pb-2 pt-8 px-8", headerClassName)}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-2xl blur-xl opacity-40 animate-pulse",
              `bg-gradient-to-br ${iconGradient}`
            )} />
            <div className={cn(
              "relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl",
              `bg-gradient-to-br ${iconBgGradient}`,
              `shadow-${glowColor}`
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground">
              {title}
            </h2>
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn("space-y-5 px-8 pb-8", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
