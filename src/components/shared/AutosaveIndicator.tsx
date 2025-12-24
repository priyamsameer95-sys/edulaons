/**
 * Autosave Indicator Component
 * 
 * Per Knowledge Base:
 * - Visual indicator for autosave status
 * - Consistent across student forms
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, CloudOff, Loader2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutosaveIndicatorProps {
  /** Whether currently saving */
  isSaving: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Error message if save failed */
  error: string | null;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
}

const formatLastSaved = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  
  if (diffSecs < 5) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  error,
  size = 'sm',
  className,
}) => {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            "flex items-center gap-1.5 text-destructive",
            textSize,
            className
          )}
        >
          <CloudOff className={iconSize} />
          <span>Save failed</span>
        </motion.div>
      ) : isSaving ? (
        <motion.div
          key="saving"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            "flex items-center gap-1.5 text-muted-foreground",
            textSize,
            className
          )}
        >
          <Loader2 className={cn(iconSize, "animate-spin")} />
          <span>Saving...</span>
        </motion.div>
      ) : lastSaved ? (
        <motion.div
          key="saved"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            "flex items-center gap-1.5 text-success",
            textSize,
            className
          )}
        >
          <CheckCircle2 className={iconSize} />
          <span>Saved {formatLastSaved(lastSaved)}</span>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            "flex items-center gap-1.5 text-muted-foreground",
            textSize,
            className
          )}
        >
          <Cloud className={iconSize} />
          <span>Autosave on</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutosaveIndicator;
