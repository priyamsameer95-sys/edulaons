import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface AppUser {
  id: string;
  email: string;
  role: 'partner' | 'admin' | 'super_admin';
  partner_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

export function useUserManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, partner_code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPartners(data || []);
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching partners:', error);
      return [];
    }
  }, []);

  const createUser = useCallback(async (
    email: string,
    role: 'partner' | 'admin' | 'super_admin',
    partnerId: string | null,
    password: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create',
          email,
          role,
          partner_id: partnerId,
          password,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'User Created',
        description: `User ${email} created successfully`,
      });

      await fetchUsers();
      return { success: true, user: data.user, password };
    } catch (error: any) {
      logger.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchUsers]);

  const updateUser = useCallback(async (
    userId: string,
    updates: {
      role?: 'partner' | 'admin' | 'super_admin';
      partner_id?: string | null;
      is_active?: boolean;
    }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'update',
          user_id: userId,
          ...updates,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'User Updated',
        description: 'User details updated successfully',
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchUsers]);

  const deactivateUser = useCallback(async (userId: string, reason: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'deactivate',
          user_id: userId,
          reason,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'User Deactivated',
        description: 'User account has been deactivated successfully',
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      logger.error('Error deactivating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchUsers]);

  const reactivateUser = useCallback(async (userId: string, reason: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'reactivate',
          user_id: userId,
          reason,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'User Reactivated',
        description: 'User account has been reactivated successfully',
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      logger.error('Error reactivating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate user',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchUsers]);

  return {
    users,
    partners,
    loading,
    fetchUsers,
    fetchPartners,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
  };
}
