import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log audit trail
async function logAudit(supabase: any, action: string, performedBy: string, targetUserId: string | null, targetUserEmail: string, oldValues: any, newValues: any, reason: string | null, success: boolean, errorMessage: string | null, req: Request) {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  await supabase.from('user_management_logs').insert({
    action,
    performed_by: performedBy,
    target_user_id: targetUserId,
    target_user_email: targetUserEmail,
    old_values: oldValues,
    new_values: newValues,
    reason,
    ip_address: ipAddress,
    user_agent: userAgent,
    success,
    error_message: errorMessage,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let requestUser: any = null;
  let appUser: any = null;

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    requestUser = user;

    // Verify user is admin or super_admin
    const { data: userData } = await supabaseClient
      .from('app_users')
      .select('role, email')
      .eq('id', requestUser.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new Error('Insufficient permissions');
    }
    appUser = userData;

    const { action, email, password, role, partner_id, user_id, is_active, reason } = await req.json();

    console.log(`[manage-user] Action: ${action} by ${appUser.email}`);

    if (action === 'create') {
      // Validate email
      const { data: existingUser } = await supabaseClient
        .from('app_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        await logAudit(supabaseClient, 'create', requestUser.id, null, email, null, { role }, null, false, 'Email already exists', req);
        throw new Error('User with this email already exists');
      }
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
      
      // Log successful creation
      await logAudit(supabaseClient, 'create', requestUser.id, newUser.user.id, email, null, { role, partner_id, is_active: true }, reason, true, null, req);

      return new Response(
        JSON.stringify({ success: true, user: { id: newUser.user.id, email, role } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Check if updating admin users (only super_admin can)
      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('role, email, partner_id, is_active')
        .eq('id', user_id)
        .single();

      if (!targetUser) {
        throw new Error('User not found');
      }

      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        if (appUser.role !== 'super_admin') {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, targetUser, { role, partner_id, is_active }, reason, false, 'Only super admins can modify admin users', req);
          throw new Error('Only super admins can modify admin users');
        }
        // Check if account is protected
        const { data: protectedAccount } = await supabaseClient
          .from('protected_accounts')
          .select('email')
          .eq('email', targetUser.email)
          .maybeSingle();
        
        if (protectedAccount) {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, targetUser, { role, partner_id, is_active }, reason, false, 'Cannot modify protected account', req);
          throw new Error('Cannot modify protected account');
        }
      }

      const oldValues = { role: targetUser.role, partner_id: targetUser.partner_id, is_active: targetUser.is_active };
      const updates: any = {};
      if (role !== undefined) updates.role = role;
      if (partner_id !== undefined) updates.partner_id = partner_id;
      if (is_active !== undefined) updates.is_active = is_active;
      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabaseClient
        .from('app_users')
        .update(updates)
        .eq('id', user_id);

      if (updateError) {
        await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, oldValues, updates, reason, false, updateError.message, req);
        throw updateError;
      }

      console.log(`[manage-user] Updated user: ${user_id}`);
      
      // Log successful update
      await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, oldValues, updates, reason, true, null, req);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'deactivate') {
      // Only super_admin can deactivate
      if (appUser.role !== 'super_admin') {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, 'unknown', null, null, reason, false, 'Only super admins can deactivate users', req);
        throw new Error('Only super admins can deactivate users');
      }

      // Check if trying to deactivate self or protected account
      if (user_id === requestUser.id) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, appUser.email, null, null, reason, false, 'Cannot deactivate your own account', req);
        throw new Error('Cannot deactivate your own account');
      }

      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('email, is_active')
        .eq('id', user_id)
        .single();

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Check if account is protected
      const { data: protectedAccount } = await supabaseClient
        .from('protected_accounts')
        .select('email')
        .eq('email', targetUser.email)
        .maybeSingle();

      if (protectedAccount) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, targetUser.email, null, null, reason, false, 'Cannot deactivate protected account', req);
        throw new Error('Cannot deactivate protected account');
      }

      if (!targetUser.is_active) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, targetUser.email, null, null, reason, false, 'User is already inactive', req);
        throw new Error('User is already inactive');
      }

      if (!reason || reason.trim().length < 5) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, targetUser.email, null, null, reason, false, 'Deactivation reason is required (minimum 5 characters)', req);
        throw new Error('Deactivation reason is required (minimum 5 characters)');
      }

      // Soft delete: set is_active to false
      const { error: deactivateError } = await supabaseClient
        .from('app_users')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: requestUser.id,
          deactivation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user_id);

      if (deactivateError) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, targetUser.email, { is_active: true }, { is_active: false }, reason, false, deactivateError.message, req);
        throw deactivateError;
      }

      console.log(`[manage-user] Deactivated user: ${user_id} (${targetUser.email})`);
      
      // Log successful deactivation
      await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, targetUser.email, { is_active: true }, { is_active: false, deactivated_at: new Date().toISOString(), deactivated_by: requestUser.id, deactivation_reason: reason }, reason, true, null, req);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reactivate') {
      // Only super_admin can reactivate
      if (appUser.role !== 'super_admin') {
        await logAudit(supabaseClient, 'reactivate', requestUser.id, user_id, 'unknown', null, null, reason, false, 'Only super admins can reactivate users', req);
        throw new Error('Only super admins can reactivate users');
      }

      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('email, is_active')
        .eq('id', user_id)
        .single();

      if (!targetUser) {
        throw new Error('User not found');
      }

      if (targetUser.is_active) {
        await logAudit(supabaseClient, 'reactivate', requestUser.id, user_id, targetUser.email, null, null, reason, false, 'User is already active', req);
        throw new Error('User is already active');
      }

      if (!reason || reason.trim().length < 5) {
        await logAudit(supabaseClient, 'reactivate', requestUser.id, user_id, targetUser.email, null, null, reason, false, 'Reactivation reason is required (minimum 5 characters)', req);
        throw new Error('Reactivation reason is required (minimum 5 characters)');
      }

      // Reactivate: set is_active to true and clear deactivation fields
      const { error: reactivateError } = await supabaseClient
        .from('app_users')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivated_by: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user_id);

      if (reactivateError) {
        await logAudit(supabaseClient, 'reactivate', requestUser.id, user_id, targetUser.email, { is_active: false }, { is_active: true }, reason, false, reactivateError.message, req);
        throw reactivateError;
      }

      console.log(`[manage-user] Reactivated user: ${user_id} (${targetUser.email})`);
      
      // Log successful reactivation
      await logAudit(supabaseClient, 'reactivate', requestUser.id, user_id, targetUser.email, { is_active: false }, { is_active: true }, reason, true, null, req);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('[manage-user] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Log failed action if we have enough context
    if (requestUser && appUser) {
      const { action, user_id, email } = await req.json().catch(() => ({ action: 'unknown', user_id: null, email: 'unknown' }));
      await logAudit(supabaseClient, action, requestUser.id, user_id, email, null, null, null, false, errorMessage, req);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
