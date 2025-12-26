import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  successMessage?: string;
  tooltip?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function CopyButton({
  value,
  className,
  size = 'icon',
  variant = 'ghost',
  successMessage = 'Copied!',
  tooltip = 'Copy to clipboard',
  iconSize = 'sm',
}: CopyButtonProps) {
  const { copy, isCopied } = useCopyToClipboard({ successMessage });
  const copied = isCopied(value);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    copy(value);
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      className={cn('shrink-0', className)}
      onClick={handleClick}
    >
      {copied ? (
        <Check className={cn(iconSizes[iconSize], 'text-success')} />
      ) : (
        <Copy className={cn(iconSizes[iconSize], 'text-muted-foreground')} />
      )}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{copied ? 'Copied!' : tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
