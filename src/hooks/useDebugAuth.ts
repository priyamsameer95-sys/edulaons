import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface AuthDebugInfo {
  timestamp: string;
  authState: {
    hasUser: boolean;
    hasSession: boolean;
    hasAppUser: boolean;
    userRole?: string;
    partnerId?: string;
    isActive?: boolean;
    loading: boolean;
  };
  supabaseConnection: {
    canConnect: boolean;
    error?: string;
  };
  permissions: {
    canInsertStudents: boolean;
    canInsertCoApplicants: boolean;
    canInsertLeads: boolean;
    error?: string;
  };
}

/**
 * Debug hook for troubleshooting authentication and permission issues
 * This should only be used during development or for debugging
 */
export function useDebugAuth() {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDiagnostics = async () => {
    setIsDebugging(true);
    
    try {
      const authState = auth.getAuthDebugInfo?.() || {
        hasUser: !!auth.user,
        hasSession: !!auth.session,
        hasAppUser: !!auth.appUser,
        userRole: auth.appUser?.role,
        partnerId: auth.appUser?.partner_id,
        isActive: auth.appUser?.is_active,
        loading: auth.loading
      };

      // Test Supabase connection
      const supabaseConnection = { canConnect: true, error: undefined };
      try {
        await supabase.from('app_users').select('count').limit(1);
      } catch (error) {
        supabaseConnection.canConnect = false;
        supabaseConnection.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Test permissions
      const permissions = {
        canInsertStudents: false,
        canInsertCoApplicants: false,
        canInsertLeads: false,
        error: undefined
      };

      if (auth.user) {
        try {
          // Test if user can insert into students table
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              name: '__TEST_RECORD__',
              email: '__test@example.com__',
              phone: '__TEST_PHONE__'
            })
            .select()
            .single();

          permissions.canInsertStudents = !studentError;
          
          if (studentError && !studentError.message.includes('__TEST_RECORD__')) {
            permissions.error = studentError.message;
          }
        } catch (error) {
          permissions.error = error instanceof Error ? error.message : 'Test failed';
        }
      }

      const result: AuthDebugInfo = {
        timestamp: new Date().toISOString(),
        authState,
        supabaseConnection,
        permissions
      };

      setDebugInfo(result);
      console.log('🔍 [AuthDebug] Diagnostics completed:', result);
      
      return result;
    } catch (error) {
      console.error('🔍 [AuthDebug] Diagnostics failed:', error);
      return null;
    } finally {
      setIsDebugging(false);
    }
  };

  const logAuthState = () => {
    console.log('🔍 [AuthDebug] Current auth state:', {
      user: auth.user ? { id: auth.user.id, email: auth.user.email } : null,
      session: auth.session ? { expires_at: auth.session.expires_at } : null,
      appUser: auth.appUser,
      loading: auth.loading
    });
  };

  useEffect(() => {
    // Automatically run diagnostics when auth state changes in development
    if (process.env.NODE_ENV === 'development' && auth.appUser) {
      logAuthState();
    }
  }, [auth.appUser, auth.user, auth.session]);

  return {
    debugInfo,
    isDebugging,
    runDiagnostics,
    logAuthState,
    clearDebugInfo: () => setDebugInfo(null)
  };
}