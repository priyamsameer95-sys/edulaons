/**
 * Autosave Hook
 * 
 * Per Knowledge Base:
 * - Autosave for student forms
 * - Visual indicator for save status
 * - Debounced saves to prevent excessive writes
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface AutosaveOptions<T> {
  /** Key for sessionStorage */
  storageKey: string;
  /** Optional async save function (e.g., to database) */
  onSave?: (data: T) => Promise<void>;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
}

interface AutosaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useAutosave<T>(
  data: T,
  options: AutosaveOptions<T>
) {
  const { storageKey, onSave, debounceMs = 1000, enabled = true } = options;
  
  const [state, setState] = useState<AutosaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDataRef = useRef<string>('');
  const mountedRef = useRef(true);

  // Clear timeout on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced save effect
  useEffect(() => {
    if (!enabled) return;
    
    const currentData = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentData === lastDataRef.current) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      lastDataRef.current = currentData;
      
      try {
        setState(prev => ({ ...prev, isSaving: true, error: null }));
        
        // Save to sessionStorage
        sessionStorage.setItem(storageKey, currentData);
        
        // Call optional save function
        if (onSave) {
          await onSave(data);
        }
        
        if (mountedRef.current) {
          setState({
            isSaving: false,
            lastSaved: new Date(),
            error: null,
          });
        }
      } catch (err) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isSaving: false,
            error: err instanceof Error ? err.message : 'Failed to save',
          }));
        }
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, onSave, debounceMs, enabled]);

  // Load saved data from sessionStorage
  const loadSavedData = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (err) {
      console.error('Failed to load saved data:', err);
    }
    return null;
  }, [storageKey]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    lastDataRef.current = '';
    setState({
      isSaving: false,
      lastSaved: null,
      error: null,
    });
  }, [storageKey]);

  // Force save immediately
  const saveNow = useCallback(async () => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));
      
      const currentData = JSON.stringify(data);
      sessionStorage.setItem(storageKey, currentData);
      lastDataRef.current = currentData;
      
      if (onSave) {
        await onSave(data);
      }
      
      if (mountedRef.current) {
        setState({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error: err instanceof Error ? err.message : 'Failed to save',
        }));
      }
    }
  }, [data, storageKey, onSave, enabled]);

  return {
    ...state,
    loadSavedData,
    clearSavedData,
    saveNow,
  };
}

export default useAutosave;
