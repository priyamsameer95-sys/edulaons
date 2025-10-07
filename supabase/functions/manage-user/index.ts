import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestUser) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin or super_admin
    const { data: appUser } = await supabaseClient
      .from('app_users')
      .select('role')
      .eq('id', requestUser.id)
      .single();

    if (!appUser || !['admin', 'super_admin'].includes(appUser.role)) {
      throw new Error('Insufficient permissions');
    }

    const { action, email, password, role, partner_id, user_id, is_active } = await req.json();

    console.log(`[manage-user] Action: ${action} by ${requestUser.email}`);

    if (action === 'create') {
      // Only super_admin can create admin users
      if ((role === 'admin' || role === 'super_admin') && appUser.role !== 'super_admin') {
        throw new Error('Only super admins can create admin users');
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) throw createError;

      // Create app_users record
      const { error: insertError } = await supabaseClient
        .from('app_users')
        .insert({
          id: newUser.user.id,
          email,
          role,
          partner_id: role === 'partner' ? partner_id : null,
          is_active: true,
        });

      if (insertError) {
        // Rollback: delete auth user
        await supabaseClient.auth.admin.deleteUser(newUser.user.id);
        throw insertError;
      }

      console.log(`[manage-user] Created user: ${email} with role: ${role}`);

      return new Response(
        JSON.stringify({ success: true, user: { id: newUser.user.id, email, role } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Check if updating admin users (only super_admin can)
      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('role, email')
        .eq('id', user_id)
        .single();

      if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
        if (appUser.role !== 'super_admin') {
          throw new Error('Only super admins can modify admin users');
        }
        // Prevent modifying the protected super admin
        if (targetUser.email === 'priyam.sameer@cashkaro.com') {
          throw new Error('Cannot modify protected super admin account');
        }
      }

      const updates: any = {};
      if (role !== undefined) updates.role = role;
      if (partner_id !== undefined) updates.partner_id = partner_id;
      if (is_active !== undefined) updates.is_active = is_active;
      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabaseClient
        .from('app_users')
        .update(updates)
        .eq('id', user_id);

      if (updateError) throw updateError;

      console.log(`[manage-user] Updated user: ${user_id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Only super_admin can delete
      if (appUser.role !== 'super_admin') {
        throw new Error('Only super admins can delete users');
      }

      // Check if trying to delete self or protected account
      if (user_id === requestUser.id) {
        throw new Error('Cannot delete your own account');
      }

      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('email')
        .eq('id', user_id)
        .single();

      if (targetUser?.email === 'priyam.sameer@cashkaro.com') {
        throw new Error('Cannot delete protected super admin account');
      }

      // Delete app_users record first (will cascade)
      const { error: deleteAppUserError } = await supabaseClient
        .from('app_users')
        .delete()
        .eq('id', user_id);

      if (deleteAppUserError) throw deleteAppUserError;

      // Delete auth user
      const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user_id);
      if (deleteAuthError) throw deleteAuthError;

      console.log(`[manage-user] Deleted user: ${user_id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('[manage-user] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
