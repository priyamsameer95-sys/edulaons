import { useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type AppRole = 'admin' | 'partner' | 'student' | 'super_admin' | 'kam';

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  partner_id?: string | null;
  first_login_at?: string | null;
}

type SessionState = 'unknown' | 'validating' | 'active' | 'expired';

const STORAGE_KEY_SESSION_EXISTS = 'auth_session_exists';
const STORAGE_KEY_PARTNER_CODE = 'auth_partner_code';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Sync check if session likely exists in storage (0ms latency)
function hasStoredSessionSync(): boolean {
  try {
    // Check our custom flag first
    const exists = localStorage.getItem(STORAGE_KEY_SESSION_EXISTS);
    if (exists === 'true') return true;
    
    // Also check for Supabase's own session storage as fallback
    const supabaseKey = Object.keys(localStorage).find(k => 
      k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (supabaseKey && localStorage.getItem(supabaseKey)) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

function setStoredSessionFlag(exists: boolean): void {
  try {
    if (exists) {
      localStorage.setItem(STORAGE_KEY_SESSION_EXISTS, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION_EXISTS);
    }
  } catch {
    // Storage blocked - ignore
  }
}

function getCachedPartnerCodeStatic(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PARTNER_CODE);
  } catch {
    return null;
  }
}

function setCachedPartnerCodeStatic(code: string | null): void {
  try {
    if (code) {
      localStorage.setItem(STORAGE_KEY_PARTNER_CODE, code);
    } else {
      localStorage.removeItem(STORAGE_KEY_PARTNER_CODE);
    }
  } catch {
    // Storage blocked - ignore
  }
}

export function useAuth() {
  // Optimistic: check storage sync before any async work
  const [hasStoredSession] = useState(() => hasStoredSessionSync());
  const [sessionState, setSessionState] = useState<SessionState>(hasStoredSession ? 'validating' : 'unknown');
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageBlocked, setStorageBlocked] = useState(false);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef(false);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false); // Prevent double initialization

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Check if storage is accessible
  useEffect(() => {
    try {
      localStorage.setItem('auth_storage_test', '1');
      localStorage.removeItem('auth_storage_test');
    } catch {
      setStorageBlocked(true);
      logger.warn('[useAuth] localStorage blocked - session will not persist across refreshes');
    }
  }, []);

  const fetchAppUser = useCallback(async (userId: string): Promise<AppUser | null> => {
    try {
      logger.info(`[useAuth] Fetching app user for ID: ${userId}`);
      
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (appUserError) {
        logger.error('[useAuth] Error fetching app user:', appUserError);
        return null;
      }

      if (!appUserData) {
        logger.error('[useAuth] No app_users record found for user:', userId);
        return null;
      }

      // Fetch user's primary role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (roleError) {
        logger.error('[useAuth] Error fetching user role:', roleError);
      }

      const data = {
        ...appUserData,
        role: roleData || appUserData.role || 'student'
      };

      logger.info('[useAuth] Successfully fetched app user:', {
        id: data.id,
        role: data.role,
        partner_id: data.partner_id,
        is_active: data.is_active
      });
      
      return data as AppUser;
    } catch (error) {
      logger.error('[useAuth] Exception fetching app user:', error);
      return null;
    }
  }, []);

  // Silent session refresh
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        logger.warn('[useAuth] Session refresh failed:', error?.message);
        isRefreshingRef.current = false;
        return false;
      }

      if (mountedRef.current) {
        setSession(data.session);
        setUser(data.session.user);
        setSessionState('active');
        setStoredSessionFlag(true);
      }

      logger.debug('[useAuth] Session refreshed successfully');
      isRefreshingRef.current = false;
      return true;
    } catch (error) {
      logger.error('[useAuth] Exception during session refresh:', error);
      isRefreshingRef.current = false;
      return false;
    }
  }, []);

  // Schedule proactive token refresh
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Date.now();
    const expiresAtMs = expiresAt * 1000;
    const refreshAt = expiresAtMs - REFRESH_BUFFER_MS;
    const delay = Math.max(0, refreshAt - now);

    if (delay <= 0) {
      // Token is already near expiry or expired, refresh now
      refreshSession();
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        refreshSession();
      }
    }, delay);

    logger.debug(`[useAuth] Scheduled token refresh in ${Math.round(delay / 1000)}s`);
  }, [refreshSession]);

  // Activity-based refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      
      // Only refresh if user has been active recently
      if (idleTime < IDLE_THRESHOLD_MS && session) {
        refreshSession();
      }
    }, ACTIVITY_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  // Tab visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const now = Date.now();
          const expiresAtMs = expiresAt * 1000;
          const remaining = expiresAtMs - now;
          
          if (remaining < REFRESH_BUFFER_MS) {
            refreshSession();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, refreshSession]);

  // Track first login for students
  const trackFirstLogin = useCallback(async (userId: string, currentAppUser: AppUser) => {
    if (currentAppUser.role === 'student' && !currentAppUser.first_login_at) {
      logger.info('[useAuth] First login detected for student, updating first_login_at');
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ first_login_at: new Date().toISOString() })
        .eq('id', userId)
        .is('first_login_at', null);
      
      if (updateError) {
        logger.error('[useAuth] Error updating first_login_at:', updateError);
      }
    }
  }, []);

  // Refs to access current state in callbacks without re-running effect
  const appUserRef = useRef(appUser);
  appUserRef.current = appUser;

  // Ref for auth timeout so we can clear it when init completes
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if initialization completed to prevent false timeout warnings
  const initCompletedRef = useRef(false);

  // Initialize session - runs ONLY ONCE on mount
  useEffect(() => {
    // Prevent double initialization (React 18 StrictMode / HMR)
    if (initializedRef.current) return;
    initializedRef.current = true;
    mountedRef.current = true;
    initCompletedRef.current = false;

    // Safety timeout - only warn if init truly hasn't completed
    authTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !initCompletedRef.current) {
        logger.warn('[useAuth] Auth initialization timed out after 3s');
        setLoading(false);
        setSessionState(prev => prev === 'validating' || prev === 'unknown' ? 'expired' : prev);
      }
    }, 3000);

    const initializeSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('[useAuth] Error getting session:', sessionError);
          setSessionState('expired');
          setStoredSessionFlag(false);
          setLoading(false);
          return;
        }

        if (!sessionData.session) {
          // No session - try refresh as last resort
          const refreshed = await refreshSession();
          if (!refreshed) {
            setSessionState('expired');
            setStoredSessionFlag(false);
            setLoading(false);
            return;
          }
          // refreshSession updates session/user state, get fresh session
          const { data: freshData } = await supabase.auth.getSession();
          if (freshData.session) {
            // Set loading false IMMEDIATELY, fetch appUser in background
            if (mountedRef.current) {
              setLoading(false);
            }
            fetchAppUser(freshData.session.user.id).then(appUserData => {
              if (mountedRef.current) {
                setAppUser(appUserData);
                if (appUserData) {
                  trackFirstLogin(freshData.session.user.id, appUserData);
                }
              }
            });
          }
        } else {
          // Set session state IMMEDIATELY (don't wait for appUser)
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setSessionState('active');
          setStoredSessionFlag(true);
          setLoading(false); // <-- CRITICAL: Set loading false HERE, not after fetchAppUser

          // Schedule proactive refresh
          if (sessionData.session.expires_at) {
            scheduleTokenRefresh(sessionData.session.expires_at);
          }

          // Fetch app user in BACKGROUND (non-blocking)
          fetchAppUser(sessionData.session.user.id).then(appUserData => {
            if (mountedRef.current) {
              setAppUser(appUserData);
              if (appUserData) {
                trackFirstLogin(sessionData.session.user.id, appUserData);
              }
            }
          });
        }
      } catch (error) {
        logger.error('[useAuth] Exception during initialization:', error);
        if (mountedRef.current) {
          setSessionState('expired');
          setStoredSessionFlag(false);
          setLoading(false);
        }
      } finally {
        // Mark init as completed and clear timeout
        initCompletedRef.current = true;
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
          authTimeoutRef.current = null;
        }
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.debug('[useAuth] Auth state change:', event);

      if (!mountedRef.current) return;

      // Skip INITIAL_SESSION - already handled by initializeSession() above
      if (event === 'INITIAL_SESSION') {
        logger.debug('[useAuth] Skipping INITIAL_SESSION (handled by initializeSession)');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setAppUser(null);
        setSessionState('expired');
        setStoredSessionFlag(false);
        setCachedPartnerCodeStatic(null);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        return;
      }

      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setSessionState('active');
        setStoredSessionFlag(true);

        // Schedule refresh for new session
        if (newSession.expires_at) {
          scheduleTokenRefresh(newSession.expires_at);
        }

        // Fetch app user if not already loaded or user changed (use ref to avoid dependency)
        const currentAppUser = appUserRef.current;
        if (!currentAppUser || currentAppUser.id !== newSession.user.id) {
          const appUserData = await fetchAppUser(newSession.user.id);
          if (mountedRef.current) {
            setAppUser(appUserData);
            if (appUserData) {
              trackFirstLogin(newSession.user.id, appUserData);
            }
          }
        }
      }
    });

    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run ONLY on mount

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('[useAuth] Sign out error:', error);
    }
    // Always clear local state
    setSession(null);
    setUser(null);
    setAppUser(null);
    setSessionState('expired');
    setStoredSessionFlag(false);
    setCachedPartnerCodeStatic(null);
  }, []);

  const isAdmin = useCallback(() => {
    return appUser?.role === 'admin' || appUser?.role === 'super_admin';
  }, [appUser?.role]);

  const isPartner = useCallback(() => {
    return appUser?.role === 'partner';
  }, [appUser?.role]);

  const ensureValidSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return { valid: false, error: error || { message: 'No active session' } };
      }
      return { valid: true, session };
    } catch (err) {
      return { valid: false, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  }, []);

  const getAuthDebugInfo = useCallback(() => ({
    hasUser: !!user,
    hasSession: !!session,
    hasAppUser: !!appUser,
    userRole: appUser?.role,
    partnerId: appUser?.partner_id,
    isActive: appUser?.is_active,
    loading,
    sessionState,
    hasStoredSession
  }), [user, session, appUser, loading, sessionState, hasStoredSession]);

  // Partner code caching helpers
  const getCachedPartnerCode = useCallback(() => getCachedPartnerCodeStatic(), []);
  const setCachedPartnerCode = useCallback((code: string | null) => setCachedPartnerCodeStatic(code), []);

  return {
    user,
    session,
    appUser,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isPartner,
    refetchAppUser: () => user ? fetchAppUser(user.id).then(setAppUser) : Promise.resolve(),
    getAuthDebugInfo,
    ensureValidSession,
    refreshSession,
    // New exports for optimistic loading
    hasStoredSession,
    sessionState,
    storageBlocked,
    // Partner code caching helpers
    getCachedPartnerCode,
    setCachedPartnerCode,
  };
}
