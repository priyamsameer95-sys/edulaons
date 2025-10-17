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
  let requestUserRole: any = null;

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    requestUser = user;

    // Get user's role from user_roles table using has_role function
    const { data: isSuperAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: requestUser.id, _role: 'super_admin' });
    
    const { data: isAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: requestUser.id, _role: 'admin' });

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Insufficient permissions');
    }
    
    requestUserRole = isSuperAdmin ? 'super_admin' : 'admin';

    const { action, email, password, role, partner_id, user_id, is_active, reason } = await req.json();

    console.log(`[manage-user] Action: ${action} by ${requestUser.email} (${requestUserRole})`);

    if (action === 'create') {
      // Check if user exists in auth.users
      const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users.find(u => u.email === email);

      // Check if user exists in app_users
      const { data: existingAppUser } = await supabaseClient
        .from('app_users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      // Handle different scenarios
      if (existingAuthUser && existingAppUser) {
        // User exists in both - genuine duplicate
        await logAudit(supabaseClient, 'create', requestUser.id, null, email, null, { role }, null, false, 'User already exists in both auth and database', req);
        throw new Error('User with this email already exists');
      }

      if (!existingAuthUser && existingAppUser) {
        // Orphaned record - clean it up first
        console.log(`[manage-user] Cleaning orphaned app_users record for ${email}`);
        
        // Delete from user_roles
        await supabaseClient
          .from('user_roles')
          .delete()
          .eq('user_id', existingAppUser.id);
        
        // Delete from app_users
        await supabaseClient
          .from('app_users')
          .delete()
          .eq('id', existingAppUser.id);
        
        console.log(`[manage-user] Orphaned record cleaned, proceeding with user creation`);
      }

      // If we reach here, either:
      // - User doesn't exist at all (proceed)
      // - Orphaned record was cleaned (proceed)

      // Only super_admin can create admin users
      if ((role === 'admin' || role === 'super_admin') && requestUserRole !== 'super_admin') {
        throw new Error('Only super admins can create admin users');
      }

      // Create auth user (no email verification required)
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (createError) throw createError;

      // Upsert app_users record (handles case where trigger might have already created it)
      const { error: upsertError } = await supabaseClient
        .from('app_users')
        .upsert({
          id: newUser.user.id,
          email,
          role: role, // Use the actual requested role
          partner_id: role === 'partner' ? partner_id : null,
          is_active: true,
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('[manage-user] Upsert error:', upsertError);
        // Rollback: delete auth user
        await supabaseClient.auth.admin.deleteUser(newUser.user.id);
        throw upsertError;
      }

      console.log(`[manage-user] App user record created/updated for ${email}`);

      // Grant role using the secure grant_user_role function
      const { error: roleError } = await supabaseClient
        .rpc('grant_user_role', {
          _user_id: newUser.user.id,
          _role: role,
          _granted_by: requestUser.id
        });

      if (roleError) {
        // Rollback: delete app_users and auth user
        await supabaseClient.from('app_users').delete().eq('id', newUser.user.id);
        await supabaseClient.auth.admin.deleteUser(newUser.user.id);
        throw roleError;
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
      // Get target user's current role
      const { data: targetUserRole } = await supabaseClient
        .rpc('get_user_role', { _user_id: user_id });

      const { data: targetUser } = await supabaseClient
        .from('app_users')
        .select('email, partner_id, is_active')
        .eq('id', user_id)
        .single();

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Only super_admin can modify admin users
      if (targetUserRole === 'admin' || targetUserRole === 'super_admin') {
        if (requestUserRole !== 'super_admin') {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, { role: targetUserRole }, { role }, reason, false, 'Only super admins can modify admin users', req);
          throw new Error('Only super admins can modify admin users');
        }
        
        // Check if account is protected
        const { data: protectedAccount } = await supabaseClient
          .from('protected_accounts')
          .select('email')
          .eq('email', targetUser.email)
          .maybeSingle();
        
        if (protectedAccount) {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, { role: targetUserRole }, { role }, reason, false, 'Cannot modify protected account', req);
          throw new Error('Cannot modify protected account');
        }
      }

      const oldValues = { role: targetUserRole, partner_id: targetUser.partner_id, is_active: targetUser.is_active };
      
      // Update role if provided
      if (role !== undefined && role !== targetUserRole) {
        // Revoke old role
        await supabaseClient.rpc('revoke_user_role', {
          _user_id: user_id,
          _role: targetUserRole,
          _revoked_by: requestUser.id
        });

        // Grant new role
        const { error: roleError } = await supabaseClient.rpc('grant_user_role', {
          _user_id: user_id,
          _role: role,
          _granted_by: requestUser.id
        });

        if (roleError) {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, oldValues, { role }, reason, false, roleError.message, req);
          throw roleError;
        }
      }

      // Update app_users fields
      const updates: any = {};
      if (partner_id !== undefined) updates.partner_id = partner_id;
      if (is_active !== undefined) updates.is_active = is_active;
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();

        const { error: updateError } = await supabaseClient
          .from('app_users')
          .update(updates)
          .eq('id', user_id);

        if (updateError) {
          await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, oldValues, updates, reason, false, updateError.message, req);
          throw updateError;
        }
      }

      console.log(`[manage-user] Updated user: ${user_id}`);
      
      // Log successful update
      await logAudit(supabaseClient, 'update', requestUser.id, user_id, targetUser.email, oldValues, { role, ...updates }, reason, true, null, req);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'deactivate') {
      // Only super_admin can deactivate
      if (requestUserRole !== 'super_admin') {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, 'unknown', null, null, reason, false, 'Only super admins can deactivate users', req);
        throw new Error('Only super admins can deactivate users');
      }

      // Check if trying to deactivate self
      if (user_id === requestUser.id) {
        await logAudit(supabaseClient, 'deactivate', requestUser.id, user_id, requestUser.email, null, null, reason, false, 'Cannot deactivate your own account', req);
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

      // Revoke all active roles
      const { data: userRole } = await supabaseClient
        .rpc('get_user_role', { _user_id: user_id });

      if (userRole) {
        await supabaseClient.rpc('revoke_user_role', {
          _user_id: user_id,
          _role: userRole,
          _revoked_by: requestUser.id
        });
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
      if (requestUserRole !== 'super_admin') {
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

      // Need to re-grant a role (default to the old role or student)
      // This is a simplification - in production you might want to store the old role
      const roleToGrant = 'student'; // Default role on reactivation

      await supabaseClient.rpc('grant_user_role', {
        _user_id: user_id,
        _role: roleToGrant,
        _granted_by: requestUser.id
      });

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
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});