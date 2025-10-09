/**
 * Retry utility with exponential backoff
 * Handles transient failures gracefully
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error;
      }

      // Log retry attempt
      logger.warn(`[Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
    return true;
  }

  // Supabase connection errors
  if (error?.code === 'PGRST301' || error?.code === 'PGRST302') {
    return true;
  }

  // 5xx server errors are retryable
  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }

  // Rate limiting (429) should be retried
  if (error?.status === 429) {
    return true;
  }

  return false;
}

/**
 * Categorize errors for better user messaging
 */
export function categorizeError(error: any): {
  type: 'auth' | 'network' | 'permission' | 'data' | 'unknown';
  message: string;
  isRetryable: boolean;
} {
  // Authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('session')) {
    return {
      type: 'auth',
      message: 'Your session has expired. Please log in again.',
      isRetryable: false,
    };
  }

  // Network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      type: 'network',
      message: 'Connection issue. Please check your internet and try again.',
      isRetryable: true,
    };
  }

  // Permission/RLS errors
  if (error?.code === '42501' || error?.message?.includes('permission') || error?.message?.includes('policy')) {
    return {
      type: 'permission',
      message: 'Unable to access your data. Please contact support.',
      isRetryable: false,
    };
  }

  // Data not found
  if (error?.code === 'PGRST116' || error?.message?.includes('not found')) {
    return {
      type: 'data',
      message: 'Data not found.',
      isRetryable: false,
    };
  }

  return {
    type: 'unknown',
    message: error?.message || 'An unexpected error occurred.',
    isRetryable: isRetryableError(error),
  };
}
