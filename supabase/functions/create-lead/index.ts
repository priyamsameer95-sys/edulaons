import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [create-lead] Edge function started');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [create-lead] No authorization header');
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth token for validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create admin client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [create-lead] Authentication failed:', authError);
      throw new Error('Unauthorized: You must be logged in');
    }

    console.log('✅ [create-lead] User authenticated:', user.id);

    // Get user's app_user record to verify permissions
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('id, role, partner_id, is_active')
      .eq('id', user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('❌ [create-lead] Failed to get app user:', appUserError);
      throw new Error('User account not found or not configured properly');
    }

    if (!appUser.is_active) {
      console.error('❌ [create-lead] User account is inactive');
      throw new Error('Your account is inactive. Please contact support.');
    }

    console.log('✅ [create-lead] User permissions verified:', {
      role: appUser.role,
      partnerId: appUser.partner_id,
      isActive: appUser.is_active
    });

    // Parse request body
    const body = await req.json();
    console.log('📋 [create-lead] Request received');

    // Validate required fields
    const requiredFields = [
      'student_name', 'student_phone', 'student_pin_code',
      'co_applicant_name', 'co_applicant_phone', 'co_applicant_salary',
      'co_applicant_relationship', 'co_applicant_pin_code',
      'country', 'intake_month', 'loan_type', 'amount_requested'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Step 1: Create student record using service role (bypasses RLS)
    console.log('👨‍🎓 [create-lead] Creating student...');
    
    const studentEmail = body.student_email?.trim();
    const studentData = {
      name: body.student_name.trim(),
      email: studentEmail || `${body.student_phone.trim()}@temp.placeholder`,
      phone: body.student_phone.trim(),
      postal_code: body.student_pin_code.trim(),
      country: 'India'
    };

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (studentError) {
      console.error('❌ [create-lead] Student creation failed:', studentError);
      throw new Error(`Failed to create student: ${studentError.message}`);
    }

    console.log('✅ [create-lead] Student created:', student.id);

    // Step 2: Create co-applicant record
    console.log('👥 [create-lead] Creating co-applicant...');
    
    const coApplicantEmail = body.co_applicant_email?.trim();
    const coApplicantData = {
      name: body.co_applicant_name.trim(),
      email: coApplicantEmail || null,
      phone: body.co_applicant_phone.trim(),
      relationship: body.co_applicant_relationship,
      salary: parseFloat(body.co_applicant_salary),
      pin_code: body.co_applicant_pin_code.trim()
    };

    const { data: coApplicant, error: coApplicantError } = await supabaseAdmin
      .from('co_applicants')
      .insert(coApplicantData)
      .select()
      .single();

    if (coApplicantError) {
      console.error('❌ [create-lead] Co-applicant creation failed:', coApplicantError);
      throw new Error(`Failed to create co-applicant: ${coApplicantError.message}`);
    }

    console.log('✅ [create-lead] Co-applicant created:', coApplicant.id);

    // Step 3: Get default lender
    console.log('🏦 [create-lead] Getting lender...');
    
    const { data: lender, error: lenderError } = await supabaseAdmin
      .from('lenders')
      .select('id, name')
      .limit(1)
      .single();

    if (lenderError || !lender) {
      console.error('❌ [create-lead] Failed to get lender:', lenderError);
      throw new Error('No lender configured in system');
    }

    console.log('✅ [create-lead] Lender found:', lender.name);

    // Step 4: Create lead record
    console.log('📋 [create-lead] Creating lead...');
    
    const caseId = `EDU-${Date.now()}`;
    const [intakeYear, intakeMonth] = body.intake_month ? body.intake_month.split('-').map(Number) : [null, null];

    const leadData = {
      case_id: caseId,
      student_id: student.id,
      co_applicant_id: coApplicant.id,
      partner_id: appUser.partner_id,
      lender_id: lender.id,
      loan_amount: parseFloat(body.amount_requested),
      loan_type: body.loan_type,
      study_destination: body.country,
      intake_month: intakeMonth,
      intake_year: intakeYear,
      status: 'new',
      documents_status: 'pending'
    };

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('❌ [create-lead] Lead creation failed:', leadError);
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }

    console.log('✅ [create-lead] Lead created:', lead.id);

    // Step 5: Create academic test records if provided
    const testScores = [];
    if (body.gmat_score) testScores.push({ student_id: student.id, test_type: 'GMAT', score: body.gmat_score });
    if (body.gre_score) testScores.push({ student_id: student.id, test_type: 'GRE', score: body.gre_score });
    if (body.toefl_score) testScores.push({ student_id: student.id, test_type: 'TOEFL', score: body.toefl_score });
    if (body.pte_score) testScores.push({ student_id: student.id, test_type: 'PTE', score: body.pte_score });
    if (body.ielts_score) testScores.push({ student_id: student.id, test_type: 'IELTS', score: body.ielts_score });

    if (testScores.length > 0) {
      console.log('📊 [create-lead] Creating test scores...');
      const { error: testError } = await supabaseAdmin
        .from('academic_tests')
        .insert(testScores);
      
      if (testError) {
        console.warn('⚠️ [create-lead] Test scores creation failed:', testError);
        // Don't fail the whole operation for test scores
      } else {
        console.log('✅ [create-lead] Test scores created');
      }
    }

    // Step 6: Create university associations
    if (body.universities && body.universities.length > 0) {
      console.log('🎓 [create-lead] Creating university associations...');
      
      const universityRecords = body.universities
        .filter((uniId: string) => uniId && uniId.trim())
        .map((universityId: string) => ({
          lead_id: lead.id,
          university_id: universityId
        }));

      if (universityRecords.length > 0) {
        const { error: uniError } = await supabaseAdmin
          .from('lead_universities')
          .insert(universityRecords);
        
        if (uniError) {
          console.warn('⚠️ [create-lead] University associations failed:', uniError);
          // Don't fail the whole operation
        } else {
          console.log('✅ [create-lead] University associations created');
        }
      }
    }

    // Step 7: Get recommended lenders based on universities
    console.log('🏦 [create-lead] Fetching recommended lenders...');
    let recommendedLenders = [];
    
    if (body.universities && body.universities.length > 0) {
      const { data: preferences, error: prefError } = await supabaseAdmin
        .from('university_lender_preferences')
        .select(`
          lender_id,
          compatibility_score,
          is_preferred,
          lenders!inner (
            id,
            name,
            code
          )
        `)
        .in('university_id', body.universities)
        .eq('study_destination', body.country)
        .order('compatibility_score', { ascending: false })
        .limit(5);

      if (!prefError && preferences && preferences.length > 0) {
        recommendedLenders = preferences.map((pref: any) => ({
          lender_id: pref.lenders.id,
          lender_name: pref.lenders.name,
          lender_code: pref.lenders.code,
          compatibility_score: pref.compatibility_score,
          is_preferred: pref.is_preferred
        }));
        console.log('✅ [create-lead] Found recommended lenders:', recommendedLenders.length);
      }
    }
    
    // If no university-specific recommendations, get default lenders
    if (recommendedLenders.length === 0) {
      console.log('📋 [create-lead] Fetching default lenders...');
      const { data: allLenders, error: lendersError } = await supabaseAdmin
        .from('lenders')
        .select('id, name, code')
        .eq('is_active', true)
        .limit(5);

      if (!lendersError && allLenders) {
        recommendedLenders = allLenders.map((lender: any) => ({
          lender_id: lender.id,
          lender_name: lender.name,
          lender_code: lender.code,
          compatibility_score: 50,
          is_preferred: false
        }));
        console.log('✅ [create-lead] Using default lenders:', recommendedLenders.length);
      }
    }

    console.log('🎉 [create-lead] Lead creation completed successfully');

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
    console.error('💥 [create-lead] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
