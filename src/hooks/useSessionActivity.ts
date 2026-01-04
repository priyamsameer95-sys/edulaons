import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes for "active" status

/**
 * Hook to track user activity and provide session activity status.
 * This is used to determine if the user is actively using the app.
 */
export function useSessionActivity() {
  const { session, refreshSession } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Use passive listeners for better scroll performance
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  const isActive = useCallback(() => {
    return Date.now() - lastActivityRef.current < IDLE_THRESHOLD_MS;
  }, []);

  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  const extendSession = useCallback(async () => {
    if (session) {
      return await refreshSession();
    }
    return false;
  }, [session, refreshSession]);

  return {
    isActive,
    getIdleTime,
    extendSession,
    lastActivity: lastActivityRef.current,
  };
}
