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

  const fetchAppUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching app user:', error);
        return null;
      }

      return data as AppUser;
    } catch (err) {
      console.error('Error in fetchAppUser:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch app user data
          setTimeout(async () => {
            const appUserData = await fetchAppUser(session.user.id);
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
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAppUser(session.user.id).then((appUserData) => {
          setAppUser(appUserData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Handle hardcoded admin login
      if (email === 'priyam.sameer@cashkaro.com' && password === '8238452277') {
        // Try to sign in, if user doesn't exist in auth, create it
        let authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // If user doesn't exist in auth, create it
        if (authResult.error && authResult.error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`
            }
          });

          if (signUpError) {
            toast({
              title: "Admin Setup Failed",
              description: signUpError.message,
              variant: "destructive",
            });
            return { error: { message: signUpError.message } };
          }

          // Now sign in with the created account
          authResult = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }

        if (authResult.error) {
          toast({
            title: "Admin Login Failed",
            description: authResult.error.message,
            variant: "destructive",
          });
          return { error: { message: authResult.error.message } };
        }

        // Ensure app_users entry exists for admin
        if (authResult.data.user) {
          const { error: updateError } = await supabase
            .from('app_users')
            .upsert({
              id: authResult.data.user.id,
              email: authResult.data.user.email,
              role: 'super_admin',
              partner_id: null,
              is_active: true
            });

          if (updateError) {
            console.error('Error updating app_users for admin:', updateError);
          }

          toast({
            title: "Admin Access Granted",
            description: "Welcome to the admin dashboard!",
          });
        }

        return { error: null };
      }

      // Regular user login
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