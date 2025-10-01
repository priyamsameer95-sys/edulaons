import { useState, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

/**
 * Generic Supabase query hook with built-in error handling and loading states
 */
export function useSupabaseQuery<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const execute = useCallback(async (
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await queryFn();

      if (error) {
        logger.error('[useSupabaseQuery] Query error:', error);
        setError(error);
        return { data: null, error };
      }

      setData(data);
      return { data, error: null };
    } catch (err) {
      logger.error('[useSupabaseQuery] Exception:', err);
      const error = {
        message: err instanceof Error ? err.message : 'Unknown error',
        details: '',
        hint: '',
        code: 'UNKNOWN',
      } as PostgrestError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
