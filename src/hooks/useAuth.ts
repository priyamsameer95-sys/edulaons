import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const fetchAppUser = async (userId: string, retryCount = 0): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching app user:', error);
        
        // Log authentication error for debugging
        try {
          await supabase.from('auth_error_logs').insert({
            user_id: userId,
            error_type: 'fetch_app_user_failed',
            error_message: error.message,
            context: { retryCount }
          });
        } catch (err) {
          console.error('Failed to log auth error:', err);
        }

        // Retry once on failure
        if (retryCount < 1) {
          console.log('Retrying fetchAppUser...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchAppUser(userId, retryCount + 1);
        }
        
        return null;
      }

      if (!data) {
        console.error('No app_users record found for user:', userId);
        
        try {
          await supabase.from('auth_error_logs').insert({
            user_id: userId,
            error_type: 'app_user_not_found',
            error_message: 'No app_users record found',
            context: { retryCount }
          });
        } catch (err) {
          console.error('Failed to log auth error:', err);
        }
        
        return null;
      }

      console.log('Successfully fetched app user:', data);
      return data as AppUser;
    } catch (err) {
      console.error('Error in fetchAppUser:', err);
      
      try {
        await supabase.from('auth_error_logs').insert({
          user_id: userId,
          error_type: 'fetch_app_user_exception',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          context: { retryCount }
        });
      } catch (e) {
        console.error('Failed to log auth error:', e);
      }
      
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch app user data without async callback to avoid deadlock
          setTimeout(async () => {
            const appUserData = await fetchAppUser(session.user.id);
            
            // If fetchAppUser fails, don't clear the session - keep user logged in
            if (!appUserData && event !== 'SIGNED_OUT') {
              console.warn('Failed to fetch app user, keeping session active');
              toast({
                title: "Connection Issue",
                description: "Having trouble loading your profile. Please refresh if this persists.",
                variant: "destructive",
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
      console.log('Initial session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAppUser(session.user.id).then((appUserData) => {
          if (!appUserData) {
            console.warn('Failed to fetch app user on initial load');
            toast({
              title: "Connection Issue",
              description: "Having trouble loading your profile. Please refresh if this persists.",
              variant: "destructive",
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
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

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
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "Please check your email to confirm your account.",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (err) {
      console.error('Sign out error:', err);
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const isAdmin = () => {
    return appUser?.role === 'admin' || appUser?.role === 'super_admin';
  };

  const isPartner = () => {
    return appUser?.role === 'partner';
  };

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
  };
}