/**
 * Create Lead Edge Function - Refactored for better maintainability
 * Handles student loan application submissions
 * 
 * Uses unified validation layer for consistent data integrity
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateOrThrow, separateUniversities } from './validation.ts';
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

    // Parse and validate request with comprehensive validation
    const body = await req.json();
    console.log('📝 Validating request data...');
    validateOrThrow(body);
    console.log('✅ Request validated (all fields pass format checks)');

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

    // Get lender with intelligent assignment
    console.log('🏦 Getting lender...');
    const { uuids: universityUuids } = separateUniversities(body.universities || []);
    const lender = await getDefaultLender(supabaseAdmin, body.country, universityUuids);
    console.log('✅ Lender found:', lender.name);

    // Create lead
    // Use partner_id from request body (admin creating on behalf of partner) or from logged-in user
    const partnerId = body.partner_id || appUser.partner_id;
    console.log('📋 Creating lead for partner:', partnerId || 'Direct (no partner)');
    const lead = await createLead(
      supabaseAdmin,
      student.id,
      coApplicant.id,
      lender.id,
      partnerId,
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

    // Get recommended lenders using the unified BRE engine
    console.log('🏦 Calling unified BRE (suggest-lender) for recommendations...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recommendedLenders: any[] = [];

    try {
      // Call the suggest-lender edge function directly via internal fetch
      const breResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/suggest-lender`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: lead.id,
            studyDestination: body.country,
            loanAmount: body.amount_requested,
          }),
        }
      );

      if (breResponse.ok) {
        const breData = await breResponse.json();
        console.log(`✅ BRE returned ${breData.results?.length || 0} scored lenders`);

        // Transform BRE results to our expected format
        if (breData.results && Array.isArray(breData.results)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recommendedLenders = breData.results.slice(0, 5).map((r: any) => ({
            lender_id: r.lender_id,
            lender_name: r.lender_name,
            lender_code: r.lender_code,
            lender_description: r.reason || '',
            compatibility_score: r.score, // Use BRE-computed score
            is_preferred: r.status === 'BEST_FIT',
            interest_rate_min: parseFloat(r.interest_rate_display?.split('-')[0] || '10'),
            interest_rate_max: parseFloat(r.interest_rate_display?.split('-')[1] || '12'),
            processing_time_estimate: r.processing_time_estimate,
            status: r.status,
            badges: r.badges || [],
            pillar_breakdown: r.pillar_breakdown,
          }));
        }
      } else {
        console.warn(`⚠️ BRE call failed: ${breResponse.status}, falling back to simple list`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (breError: any) {
      console.warn('⚠️ BRE call exception:', breError.message);
    }

    // Fallback: If BRE failed, get simple lender list (but with honest "unscored" marker)
    if (recommendedLenders.length === 0) {
      console.log('📋 Using fallback lender list (BRE unavailable)');
      const { data: allLenders } = await supabaseAdmin
        .from('lenders')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);

      if (allLenders) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recommendedLenders = allLenders.map((lender: any) => ({
          lender_id: lender.id,
          lender_name: lender.name,
          lender_code: lender.code,
          lender_description: lender.description,
          compatibility_score: null, // IMPORTANT: null = unscored, not fake 50%
          is_preferred: false,
          interest_rate_min: lender.interest_rate_min,
          interest_rate_max: lender.interest_rate_max,
        }));
      }
    }

    console.log(`✅ Returning ${recommendedLenders.length} recommended lenders`);

    // Wait a moment for trigger to complete (eligibility calculation happens async)
    console.log('⏳ Waiting for eligibility calculation trigger to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch eligibility score for the assigned lender
    console.log('📊 Fetching eligibility score for assigned lender...');
    const { data: eligibilityScore, error: eligibilityError } = await supabaseAdmin
      .from('eligibility_scores')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('lender_id', lender.id)
      .maybeSingle();

    if (eligibilityError) {
      console.warn('⚠️ Error fetching eligibility score:', eligibilityError.message);
    } else if (eligibilityScore) {
      console.log('✅ Eligibility score fetched:', eligibilityScore.overall_score);

      // Add eligibility to the assigned lender in recommended list
      const assignedLenderIndex = recommendedLenders.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (l: any) => l.lender_id === lender.id
      );

      if (assignedLenderIndex >= 0) {
        recommendedLenders[assignedLenderIndex] = {
          ...recommendedLenders[assignedLenderIndex],
          eligibility_score: eligibilityScore.overall_score,
          university_score: eligibilityScore.university_score,
          student_score: eligibilityScore.student_score,
          co_applicant_score: eligibilityScore.co_applicant_score,
          approval_status: eligibilityScore.approval_status,
          rejection_reason: eligibilityScore.rejection_reason,
          eligible_loan_min: eligibilityScore.eligible_loan_min,
          eligible_loan_max: eligibilityScore.eligible_loan_max,
          rate_tier: eligibilityScore.rate_tier,
          interest_rate_min: eligibilityScore.interest_rate_min,
          interest_rate_max: eligibilityScore.interest_rate_max,
          loan_band_percentage: eligibilityScore.loan_band_percentage,
          university_breakdown: eligibilityScore.university_breakdown,
          student_breakdown: eligibilityScore.student_breakdown,
          co_applicant_breakdown: eligibilityScore.co_applicant_breakdown
        };
        console.log('✅ Eligibility data added to assigned lender');
      }
    } else {
      console.warn('⚠️ No eligibility score found yet - may still be calculating');
    }

    console.log('🎉 Application submission completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          student_id: student.id,
          co_applicant_id: coApplicant.id,
          requested_amount: body.amount_requested
        },
        recommended_lenders: recommendedLenders
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
