import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseCopyToClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  timeout?: number;
}

interface UseCopyToClipboardReturn {
  copy: (value: string) => Promise<boolean>;
  copiedValue: string | null;
  isCopied: (value: string) => boolean;
  reset: () => void;
}

export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}): UseCopyToClipboardReturn {
  const {
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy',
    timeout = 2000,
  } = options;

  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copy = useCallback(async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      toast.success(successMessage);
      
      setTimeout(() => {
        setCopiedValue(null);
      }, timeout);
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error(errorMessage);
      return false;
    }
  }, [successMessage, errorMessage, timeout]);

  const isCopied = useCallback((value: string): boolean => {
    return copiedValue === value;
  }, [copiedValue]);

  const reset = useCallback(() => {
    setCopiedValue(null);
  }, []);

  return { copy, copiedValue, isCopied, reset };
}
