import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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
    const exists = localStorage.getItem(STORAGE_KEY_SESSION_EXISTS);
    if (exists === 'true') return true;
    
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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isPartner: () => boolean;
  refetchAppUser: () => Promise<void>;
  getAuthDebugInfo: () => object;
  ensureValidSession: () => Promise<{ valid: boolean; session?: Session; error?: { message: string } }>;
  refreshSession: () => Promise<boolean>;
  hasStoredSession: boolean;
  sessionState: SessionState;
  storageBlocked: boolean;
  getCachedPartnerCode: () => string | null;
  setCachedPartnerCode: (code: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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
  const initializedRef = useRef(false);
  const initCompletedRef = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      logger.warn('[AuthProvider] localStorage blocked');
    }
  }, []);

  const fetchAppUser = useCallback(async (userId: string): Promise<AppUser | null> => {
    try {
      logger.info(`[AuthProvider] Fetching app user for ID: ${userId}`);
      
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (appUserError) {
        logger.error('[AuthProvider] Error fetching app user:', appUserError);
        return null;
      }

      if (!appUserData) {
        logger.error('[AuthProvider] No app_users record found for user:', userId);
        return null;
      }

      // Fetch user's primary role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (roleError) {
        logger.error('[AuthProvider] Error fetching user role:', roleError);
      }

      const data = {
        ...appUserData,
        role: roleData || appUserData.role || 'student'
      };

      logger.info('[AuthProvider] Successfully fetched app user:', {
        id: data.id,
        role: data.role,
        partner_id: data.partner_id,
        is_active: data.is_active
      });
      
      return data as AppUser;
    } catch (error) {
      logger.error('[AuthProvider] Exception fetching app user:', error);
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
        logger.warn('[AuthProvider] Session refresh failed:', error?.message);
        isRefreshingRef.current = false;
        return false;
      }

      if (mountedRef.current) {
        setSession(data.session);
        setUser(data.session.user);
        setSessionState('active');
        setStoredSessionFlag(true);
      }

      logger.debug('[AuthProvider] Session refreshed successfully');
      isRefreshingRef.current = false;
      return true;
    } catch (error) {
      logger.error('[AuthProvider] Exception during session refresh:', error);
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
      refreshSession();
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        refreshSession();
      }
    }, delay);

    logger.debug(`[AuthProvider] Scheduled token refresh in ${Math.round(delay / 1000)}s`);
  }, [refreshSession]);

  // Activity-based refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      
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
      logger.info('[AuthProvider] First login detected for student');
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ first_login_at: new Date().toISOString() })
        .eq('id', userId)
        .is('first_login_at', null);
      
      if (updateError) {
        logger.error('[AuthProvider] Error updating first_login_at:', updateError);
      }
    }
  }, []);

  // Refs to access current state in callbacks
  const appUserRef = useRef(appUser);
  appUserRef.current = appUser;

  // Initialize session - runs ONLY ONCE on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    mountedRef.current = true;
    initCompletedRef.current = false;

    logger.info('[AuthProvider] Initializing auth (singleton)');

    // Safety timeout - warn only, do NOT force session expired
    authTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !initCompletedRef.current) {
        logger.warn('[AuthProvider] Auth initialization slow (>5s) - still waiting...');
      }
    }, 5000);

    const initializeSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('[AuthProvider] Error getting session:', sessionError);
          setSessionState('expired');
          setStoredSessionFlag(false);
          setLoading(false);
          return;
        }

        if (!sessionData.session) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            setSessionState('expired');
            setStoredSessionFlag(false);
            setLoading(false);
            return;
          }
          const { data: freshData } = await supabase.auth.getSession();
          if (freshData.session) {
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
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setSessionState('active');
          setStoredSessionFlag(true);
          setLoading(false);

          if (sessionData.session.expires_at) {
            scheduleTokenRefresh(sessionData.session.expires_at);
          }

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
        logger.error('[AuthProvider] Exception during initialization:', error);
        if (mountedRef.current) {
          setSessionState('expired');
          setStoredSessionFlag(false);
          setLoading(false);
        }
      } finally {
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
      logger.debug('[AuthProvider] Auth state change:', event);

      if (!mountedRef.current) return;

      if (event === 'INITIAL_SESSION') {
        logger.debug('[AuthProvider] Skipping INITIAL_SESSION (handled by initializeSession)');
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

        if (newSession.expires_at) {
          scheduleTokenRefresh(newSession.expires_at);
        }

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
  }, []);

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
      logger.error('[AuthProvider] Sign out error:', error);
    }
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

  const getCachedPartnerCode = useCallback(() => getCachedPartnerCodeStatic(), []);
  const setCachedPartnerCode = useCallback((code: string | null) => setCachedPartnerCodeStatic(code), []);

  const value: AuthContextValue = {
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
    hasStoredSession,
    sessionState,
    storageBlocked,
    getCachedPartnerCode,
    setCachedPartnerCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
