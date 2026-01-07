import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchResult {
  total: number;
  processed: number;
  failed: number;
  errors: Array<{ leadId: string; error: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[BatchRerun] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || appUser?.role !== 'admin') {
      console.error('[BatchRerun] User not admin:', userError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[BatchRerun] Admin verified, starting batch re-run...');

    // Parse request body for optional filters
    let filters: { leadIds?: string[]; limit?: number } = {};
    try {
      const body = await req.json();
      filters = body || {};
    } catch {
      // No body provided, use defaults
    }

    const limit = filters.limit || 100; // Default max 100 leads per run

    // Query active leads that need recommendation
    let query = supabase
      .from('leads_new')
      .select('id, study_destination, loan_amount')
      .not('status', 'in', '("disbursed","rejected","withdrawn")')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply specific lead IDs filter if provided
    if (filters.leadIds && filters.leadIds.length > 0) {
      query = query.in('id', filters.leadIds);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('[BatchRerun] Error fetching leads:', leadsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch leads', details: leadsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          result: { total: 0, processed: 0, failed: 0, errors: [] } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BatchRerun] Processing ${leads.length} leads...`);

    const result: BatchResult = {
      total: leads.length,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Process each lead with rate limiting (100ms delay between calls)
    for (const lead of leads) {
      try {
        // Call suggest-lender function for this lead
        const { data, error } = await supabase.functions.invoke('suggest-lender', {
          body: { 
            leadId: lead.id,
            studyDestination: lead.study_destination,
            loanAmount: lead.loan_amount,
          },
        });

        if (error) {
          throw new Error(error.message || 'Function invocation failed');
        }

        console.log(`[BatchRerun] Processed lead ${lead.id}:`, data?.recommendation?.id ? 'success' : 'no recommendation');
        result.processed++;

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[BatchRerun] Failed lead ${lead.id}:`, errorMessage);
        result.failed++;
        result.errors.push({ leadId: lead.id, error: errorMessage });
      }
    }

    console.log('[BatchRerun] Completed:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BatchRerun] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
