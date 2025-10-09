import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProtectedAccounts = () => {
  const [protectedEmails, setProtectedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProtectedAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('protected_accounts')
        .select('email');

      if (error) throw error;
      
      setProtectedEmails(data?.map(account => account.email) || []);
    } catch (error) {
      console.error('Error fetching protected accounts:', error);
      setProtectedEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProtectedAccounts();
  }, [fetchProtectedAccounts]);

  const isProtectedEmail = useCallback((email: string) => {
    return protectedEmails.includes(email);
  }, [protectedEmails]);

  return {
    protectedEmails,
    loading,
    isProtectedEmail,
    refetch: fetchProtectedAccounts,
  };
};
