import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (appUserError || !appUser || !['admin', 'super_admin'].includes(appUser.role)) {
      console.error('Authorization error:', appUserError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { leadId, newLenderId, oldLenderId, changeReason, assignmentNotes } = await req.json();

    if (!leadId || !newLenderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: leadId, newLenderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating lead lender:', { leadId, newLenderId, oldLenderId });

    // Update the lead's lender
    const { error: updateError } = await supabaseAdmin
      .from('leads_new')
      .update({ 
        lender_id: newLenderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw updateError;
    }

    // Log the assignment change in history
    const { error: historyError } = await supabaseAdmin
      .from('lender_assignment_history')
      .insert({
        lead_id: leadId,
        old_lender_id: oldLenderId,
        new_lender_id: newLenderId,
        changed_by: user.id,
        change_reason: changeReason,
        assignment_notes: assignmentNotes,
      });

    if (historyError) {
      console.error('Error logging assignment history:', historyError);
      // Don't throw here - the main update succeeded
    }

    console.log('Lender assignment updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lender assigned successfully',
        leadId,
        newLenderId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in update-lead-lender function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
