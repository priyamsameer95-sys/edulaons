/**
 * Create Lead Edge Function - Refactored for better maintainability
 * Handles student loan application submissions
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateRequiredFields, separateUniversities } from './validation.ts';
import {
  validateUniversities,
  checkDuplicateApplication,
  createStudent,
  createCoApplicant,
  getDefaultLender,
  createLead,
  createTestRecords,
  createUniversityAssociations,
} from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [create-lead] Starting application submission');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: You must be logged in');
    }
    console.log('✅ User authenticated:', user.id);

    // Verify user permissions
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('id, role, partner_id, is_active')
      .eq('id', user.id)
      .single();

    if (appUserError || !appUser) {
      throw new Error('User account not found');
    }

    if (!appUser.is_active) {
      throw new Error('Your account is inactive. Please contact support.');
    }
    console.log('✅ User permissions verified:', appUser.role);

    // Parse and validate request
    const body = await req.json();
    validateRequiredFields(body);
    console.log('✅ Request validated');

    // Validate universities
    if (body.universities && body.universities.length > 0) {
      console.log('🎓 Validating universities...');
      await validateUniversities(supabaseAdmin, body.universities, body.country);
      
      const { uuids, custom } = separateUniversities(body.universities);
      console.log(`✅ Found ${uuids.length} DB universities, ${custom.length} custom entries`);
      
      if (custom.length > 0) {
        console.log('📝 Custom universities:', custom);
      }
    }

    // Check for duplicates
    console.log('🔍 Checking for duplicate applications...');
    await checkDuplicateApplication(
      supabaseAdmin,
      body.student_email?.trim() || '',
      body.student_phone,
      body.intake_month,
      body.intake_year,
      body.country
    );
    console.log('✅ No duplicate found');

    // Create student
    console.log('👨‍🎓 Creating student record...');
    const student = await createStudent(supabaseAdmin, body);
    console.log('✅ Student created:', student.id);

    // Create co-applicant
    console.log('👥 Creating co-applicant record...');
    const coApplicant = await createCoApplicant(supabaseAdmin, body);
    console.log('✅ Co-applicant created:', coApplicant.id);

    // Get lender
    console.log('🏦 Getting lender...');
    const lender = await getDefaultLender(supabaseAdmin);
    console.log('✅ Lender found:', lender.name);

    // Create lead
    console.log('📋 Creating lead...');
    const lead = await createLead(
      supabaseAdmin,
      student.id,
      coApplicant.id,
      lender.id,
      appUser.partner_id,
      body
    );
    console.log('✅ Lead created:', lead.case_id);

    // Create test records
    if (body.tests && Array.isArray(body.tests) && body.tests.length > 0) {
      console.log('📊 Creating test scores...');
      await createTestRecords(supabaseAdmin, student.id, body.tests);
      console.log('✅ Test scores created');
    }

    // Create university associations
    if (body.universities && body.universities.length > 0) {
      console.log('🎓 Creating university associations...');
      await createUniversityAssociations(supabaseAdmin, lead.id, body.universities);
      console.log('✅ University associations created');
    }

    // Get recommended lenders
    console.log('🏦 Fetching recommended lenders...');
    let recommendedLenders: any[] = [];
    
    const { uuids } = separateUniversities(body.universities || []);
    
    if (uuids.length > 0) {
      const { data: preferences } = await supabaseAdmin
        .from('university_lender_preferences')
        .select('lender_id, compatibility_score, is_preferred')
        .in('university_id', uuids)
        .eq('study_destination', body.country)
        .order('compatibility_score', { ascending: false })
        .limit(5);

      if (preferences && preferences.length > 0) {
        const lenderIds = [...new Set(preferences.map((p: any) => p.lender_id))];
        
        const { data: lenders } = await supabaseAdmin
          .from('lenders')
          .select('*')
          .in('id', lenderIds)
          .eq('is_active', true);

        if (lenders) {
          recommendedLenders = preferences
            .map((pref: any) => {
              const lenderData = lenders.find((l: any) => l.id === pref.lender_id);
              if (!lenderData) return null;
              return {
                ...lenderData,
                lender_id: lenderData.id,
                lender_name: lenderData.name,
                lender_code: lenderData.code,
                lender_description: lenderData.description,
                compatibility_score: pref.compatibility_score,
                is_preferred: pref.is_preferred
              };
            })
            .filter(Boolean);
        }
      }
    }
    
    // Fallback to default lenders
    if (recommendedLenders.length === 0) {
      const { data: allLenders } = await supabaseAdmin
        .from('lenders')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);

      if (allLenders) {
        recommendedLenders = allLenders.map((lender: any) => ({
          ...lender,
          lender_id: lender.id,
          lender_name: lender.name,
          lender_code: lender.code,
          lender_description: lender.description,
          compatibility_score: 50,
          is_preferred: false
        }));
      }
    }
    
    console.log(`✅ Found ${recommendedLenders.length} recommended lenders`);
    console.log('🎉 Application submission completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          student_id: student.id,
          co_applicant_id: coApplicant.id
        },
        recommended_lenders: recommendedLenders
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 [create-lead] Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
