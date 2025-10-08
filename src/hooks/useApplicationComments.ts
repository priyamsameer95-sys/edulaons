import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApplicationComment {
  id: string;
  lead_id: string;
  user_id: string | null;
  user_role: string | null;
  user_name: string | null;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export function useApplicationComments(leadId: string) {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('application_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (commentText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: appUser } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single();

      const { error: insertError } = await supabase
        .from('application_comments')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          user_role: appUser?.role || null,
          user_name: user.email?.split('@')[0] || 'User',
          comment_text: commentText,
          is_internal: false
        });

      if (insertError) throw insertError;

      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully"
      });

      await fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add comment',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchComments();
    }
  }, [leadId]);

  // Real-time subscription
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`application_comments_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'application_comments',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    comments,
    loading,
    error,
    addComment,
    refetch: fetchComments
  };
}
