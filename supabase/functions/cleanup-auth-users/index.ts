import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  emails: string[];
  dry_run?: boolean;
}

interface DeleteResult {
  email: string;
  status: 'deleted' | 'failed' | 'protected' | 'not_found';
  user_id?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify caller is Super Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user is Super Admin
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (appUserError || !appUser || appUser.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Super Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { emails, dry_run = false }: DeleteRequest = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Invalid request: emails array is required');
    }

    // Protected accounts that cannot be deleted
    const protectedEmails = ['priyam.sameer@cashkaro.com'];
    
    console.log(`[Cleanup Auth Users] Starting cleanup for ${emails.length} emails (dry_run: ${dry_run})`);

    const results: DeleteResult[] = [];
    let deletedCount = 0;
    let failedCount = 0;
    let protectedCount = 0;

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();

      // Check if email is protected
      if (protectedEmails.includes(trimmedEmail)) {
        console.log(`[Cleanup Auth Users] PROTECTED: ${trimmedEmail} - skipping`);
        results.push({
          email: trimmedEmail,
          status: 'protected',
        });
        protectedCount++;
        continue;
      }

      try {
        // Find user by email
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }

        const userToDelete = users.users.find(u => u.email?.toLowerCase() === trimmedEmail);

        if (!userToDelete) {
          console.log(`[Cleanup Auth Users] NOT FOUND: ${trimmedEmail}`);
          results.push({
            email: trimmedEmail,
            status: 'not_found',
            error: 'User not found',
          });
          failedCount++;
          continue;
        }

        if (dry_run) {
          console.log(`[Cleanup Auth Users] DRY RUN: Would delete ${trimmedEmail} (ID: ${userToDelete.id})`);
          results.push({
            email: trimmedEmail,
            status: 'deleted',
            user_id: userToDelete.id,
          });
          deletedCount++;
        } else {
          // Actually delete the user
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);

          if (deleteError) {
            throw deleteError;
          }

          console.log(`[Cleanup Auth Users] DELETED: ${trimmedEmail} (ID: ${userToDelete.id})`);
          results.push({
            email: trimmedEmail,
            status: 'deleted',
            user_id: userToDelete.id,
          });
          deletedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Cleanup Auth Users] FAILED: ${trimmedEmail} - ${errorMessage}`);
        results.push({
          email: trimmedEmail,
          status: 'failed',
          error: errorMessage,
        });
        failedCount++;
      }
    }

    const response = {
      success: true,
      dry_run,
      total_processed: emails.length,
      deleted: deletedCount,
      failed: failedCount,
      protected: protectedCount,
      details: results,
      protected_accounts: protectedEmails,
    };

    console.log(`[Cleanup Auth Users] Complete: ${deletedCount} deleted, ${failedCount} failed, ${protectedCount} protected`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Cleanup Auth Users] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
