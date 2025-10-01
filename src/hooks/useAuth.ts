import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/utils/logger';

export interface AppUser {
  id: string;
  email: string;
  role: 'partner' | 'admin' | 'super_admin';
  partner_id?: string;
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchAppUser = useCallback(async (userId: string, retryCount = 0): Promise<AppUser | null> => {
    try {
      logger.info(`[useAuth] Fetching app user for ID: ${userId} (attempt ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('[useAuth] Error fetching app user:', error);
        
        // Log authentication error for debugging
        try {
          await supabase.from('auth_error_logs').insert({
            user_id: userId,
            error_type: 'fetch_app_user_failed',
            error_message: error.message,
            context: { retryCount, errorCode: error.code, errorDetails: error.details }
          });
        } catch (err) {
          logger.error('Failed to log auth error:', err);
        }

        // Retry up to 2 times with exponential backoff
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          logger.info(`[useAuth] Retrying fetchAppUser in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchAppUser(userId, retryCount + 1);
        }
        
        return null;
      }

      if (!data) {
        logger.error('[useAuth] No app_users record found for user:', userId);
        
        try {
          await supabase.from('auth_error_logs').insert({
            user_id: userId,
            error_type: 'app_user_not_found',
            error_message: 'No app_users record found',
            context: { retryCount }
          });
        } catch (err) {
          logger.error('Failed to log auth error:', err);
        }
        
        return null;
      }

      logger.info('[useAuth] Successfully fetched app user:', {
        id: data.id,
        role: data.role,
        partner_id: data.partner_id,
        is_active: data.is_active
      });
      
      return data as AppUser;
    } catch (err) {
      logger.error('[useAuth] Exception in fetchAppUser:', err);
      
      try {
        await supabase.from('auth_error_logs').insert({
          user_id: userId,
          error_type: 'fetch_app_user_exception',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          context: { retryCount, stack: err instanceof Error ? err.stack : undefined }
        });
      } catch (e) {
        logger.error('Failed to log auth error:', e);
      }
      
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch app user data without async callback to avoid deadlock
          setTimeout(async () => {
            const appUserData = await fetchAppUser(session.user.id);
            
            // If fetchAppUser fails, don't clear the session - keep user logged in
            if (!appUserData && event !== 'SIGNED_OUT') {
              logger.warn('Failed to fetch app user, keeping session active');
              handleError(new Error('Failed to load profile'), {
                title: 'Connection Issue',
                description: 'Having trouble loading your profile. Please refresh if this persists.'
              });
            }
            
            setAppUser(appUserData);
            setLoading(false);
          }, 0);
        } else {
          setAppUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.info('Initial session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAppUser(session.user.id).then((appUserData) => {
          if (!appUserData) {
            logger.warn('Failed to fetch app user on initial load');
            handleError(new Error('Failed to verify account'), {
              title: 'Connection Issue',
              description: 'Having trouble loading your profile. Please refresh if this persists.'
            });
          }
          
          setAppUser(appUserData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleError, handleSuccess]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleError(error, { title: 'Login Failed' });
        return { error };
      }

      handleSuccess('Welcome back!', 'You have successfully logged in.');

      return { error: null };
    } catch (err) {
      handleError(err, { title: 'Login Failed' });
      return { error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  };

  const ensureValidSession = useCallback(async () => {
    try {
      logger.info('[useAuth] Validating session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('[useAuth] Session validation error:', error);
        return { valid: false, error };
      }
      
      if (!session) {
        logger.error('[useAuth] No active session found');
        return { valid: false, error: { message: 'No active session' } };
      }
      
      // Verify the session has a valid user
      if (!session.user) {
        logger.error('[useAuth] Session exists but no user found');
        return { valid: false, error: { message: 'Invalid session state' } };
      }
      
      logger.info('[useAuth] Session valid:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });
      
      return { valid: true, session };
    } catch (err) {
      logger.error('[useAuth] Exception validating session:', err);
      return { valid: false, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      logger.info('[useAuth] Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('[useAuth] Session refresh error:', error);
        return { success: false, error };
      }
      
      if (!session) {
        logger.error('[useAuth] Session refresh returned no session');
        return { success: false, error: { message: 'Failed to refresh session' } };
      }
      
      logger.info('[useAuth] Session refreshed successfully');
      setSession(session);
      setUser(session.user);
      
      return { success: true, session };
    } catch (err) {
      logger.error('[useAuth] Exception refreshing session:', err);
      return { success: false, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        handleError(error, { title: 'Sign Up Failed' });
        return { error };
      }

      handleSuccess('Check your email', 'Please check your email to confirm your account.');

      return { error: null };
    } catch (err) {
      handleError(err, { title: 'Sign Up Failed' });
      return { error: { message: err instanceof Error ? err.message : 'Unknown error' } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        handleError(error, { title: 'Sign Out Failed' });
        return;
      }

      handleSuccess('Signed out', 'You have been successfully signed out.');
    } catch (err) {
      logger.error('Sign out error:', err);
      handleError(err, { title: 'Sign Out Failed', description: 'An error occurred while signing out.' });
    }
  };

  const isAdmin = useCallback(() => {
    return appUser?.role === 'admin' || appUser?.role === 'super_admin';
  }, [appUser?.role]);

  const isPartner = useCallback(() => {
    return appUser?.role === 'partner';
  }, [appUser?.role]);

  // Debug helpers for troubleshooting (memoized)
  const getAuthDebugInfo = useCallback(() => ({
    hasUser: !!user,
    hasSession: !!session,
    hasAppUser: !!appUser,
    userRole: appUser?.role,
    partnerId: appUser?.partner_id,
    isActive: appUser?.is_active,
    loading
  }), [user, session, appUser, loading]);

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
    refetchAppUser: () => user ? fetchAppUser(user.id) : null,
    getAuthDebugInfo, // For debugging
    ensureValidSession, // Validate current session
    refreshSession, // Force session refresh
  };
}