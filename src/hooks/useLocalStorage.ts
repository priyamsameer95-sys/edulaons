import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

/**
 * Type-safe localStorage hook with automatic JSON parsing
 * Handles errors gracefully and provides clear API
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error('[useLocalStorage] Parse error:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error('[useLocalStorage] Save error:', error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error('[useLocalStorage] Remove error:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
