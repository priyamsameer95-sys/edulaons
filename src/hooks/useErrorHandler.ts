import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { transformBackendError } from '@/utils/errorMessages';

export interface ErrorHandlerOptions {
  title?: string;
  description?: string;
  showToast?: boolean;
  logToConsole?: boolean;
  onError?: (error: Error | unknown) => void;
}

/**
 * Centralized error handler hook that provides consistent error handling
 * across the application with user-friendly messages
 */
export function useErrorHandler() {
  const { toast } = useToast();

  /**
   * Handle errors with user-friendly messages and optional callbacks
   */
  const handleError = useCallback(
    (error: Error | unknown, options: ErrorHandlerOptions = {}) => {
      const {
        title = 'Something went wrong',
        description,
        showToast = true,
        logToConsole = true,
        onError,
      } = options;

      // Log to console for debugging
      if (logToConsole) {
        console.error('[Error Handler]:', error);
      }

      // Get user-friendly error message
      const errorMessage = description || transformBackendError(error as any);

      // Show toast notification
      if (showToast) {
        toast({
          title,
          description: errorMessage,
          variant: 'destructive',
        });
      }

      // Execute custom error handler if provided
      if (onError) {
        onError(error);
      }

      return errorMessage;
    },
    [toast]
  );

  /**
   * Handle authentication errors specifically
   */
  const handleAuthError = useCallback(
    (error: Error | unknown, options: Omit<ErrorHandlerOptions, 'title'> = {}) => {
      return handleError(error, {
        ...options,
        title: 'Authentication Error',
      });
    },
    [handleError]
  );

  /**
   * Handle database/API errors specifically
   */
  const handleDatabaseError = useCallback(
    (error: Error | unknown, options: Omit<ErrorHandlerOptions, 'title'> = {}) => {
      return handleError(error, {
        ...options,
        title: 'Database Error',
      });
    },
    [handleError]
  );

  /**
   * Handle network errors specifically
   */
  const handleNetworkError = useCallback(
    (error: Error | unknown, options: Omit<ErrorHandlerOptions, 'title'> = {}) => {
      return handleError(error, {
        ...options,
        title: 'Connection Error',
      });
    },
    [handleError]
  );

  /**
   * Handle upload errors specifically
   */
  const handleUploadError = useCallback(
    (error: Error | unknown, options: Omit<ErrorHandlerOptions, 'title'> = {}) => {
      return handleError(error, {
        ...options,
        title: 'Upload Failed',
      });
    },
    [handleError]
  );

  /**
   * Handle validation errors specifically
   */
  const handleValidationError = useCallback(
    (error: Error | unknown, options: Omit<ErrorHandlerOptions, 'title'> = {}) => {
      return handleError(error, {
        ...options,
        title: 'Validation Error',
      });
    },
    [handleError]
  );

  /**
   * Handle success messages
   */
  const handleSuccess = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },
    [toast]
  );

  /**
   * Show a warning message
   */
  const handleWarning = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      });
    },
    [toast]
  );

  return {
    handleError,
    handleAuthError,
    handleDatabaseError,
    handleNetworkError,
    handleUploadError,
    handleValidationError,
    handleSuccess,
    handleWarning,
  };
}
