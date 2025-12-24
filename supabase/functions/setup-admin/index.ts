import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-setup-key',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, role = 'admin' } = await req.json();

    console.log('Setup admin request received for:', email);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists in app_users
    const { data: existingAppUser } = await supabaseAdmin
      .from('app_users')
      .select('id, email, role')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingAppUser) {
      console.log('User exists in app_users, updating role to:', role);
      
      // Update role to admin
      const { error: updateError } = await supabaseAdmin
        .from('app_users')
        .update({ role: role, updated_at: new Date().toISOString() })
        .eq('id', existingAppUser.id);
      
      if (updateError) {
        console.error('Failed to update role:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update role', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Reset password for existing auth user
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAppUser.id,
        { password: password }
      );
      
      if (passwordError) {
        console.warn('Password update warning:', passwordError.message);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'User role updated to admin',
          user: { ...existingAppUser, role: role }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in Supabase Auth with email confirmed
    console.log('Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user', details: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('Auth user created with ID:', userId);

    // Create app_users record
    console.log('Creating app_users record...');
    const { error: appUserError } = await supabaseAdmin
      .from('app_users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        role: role,
        is_active: true,
      });

    if (appUserError) {
      console.error('app_users creation error:', appUserError);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to create app user', details: appUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant role via user_roles table if it exists
    console.log('Granting role via user_roles...');
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
      });

    if (roleError) {
      console.warn('Role grant warning (table may not exist):', roleError.message);
      // Not fatal - app_users.role is the primary source
    }

    console.log('Admin user created successfully:', email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: userId,
          email: email.toLowerCase(),
          role: role,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Setup admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
