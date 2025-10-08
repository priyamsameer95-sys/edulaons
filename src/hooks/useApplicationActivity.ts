import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  actor_id: string | null;
  actor_role: string | null;
  actor_name: string | null;
  description: string;
  metadata: any;
  created_at: string;
}

export function useApplicationActivity(leadId: string) {
  const [activities, setActivities] = useState<ApplicationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('application_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchActivities();
    }
  }, [leadId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`application_activities_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'application_activities',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
}
