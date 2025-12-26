import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipWrapperProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  asChild?: boolean;
}

export function TooltipWrapper({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
  asChild = true,
}: TooltipWrapperProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className={className}>
        {typeof content === 'string' ? (
          <p className="text-xs">{content}</p>
        ) : (
          content
        )}
      </TooltipContent>
    </Tooltip>
  );
}
