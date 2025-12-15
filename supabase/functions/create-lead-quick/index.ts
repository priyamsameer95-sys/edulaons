/**
 * Quick Lead Creation Edge Function
 * Creates a lead with minimal fields - student completes the rest
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Required fields for quick lead
const QUICK_LEAD_REQUIRED = [
  'student_name',
  'student_phone', 
  'student_pin_code',
  'country',
  'co_applicant_relationship',
  'co_applicant_monthly_salary'
];

// Calculate next intake month (next quarter start)
function getNextIntake(): { month: number; year: number } {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Intake months: Jan(1), May(5), Sep(9)
  const intakeMonths = [1, 5, 9];
  
  for (const month of intakeMonths) {
    if (month > currentMonth) {
      return { month, year: currentYear };
    }
  }
  
  // Next year's first intake
  return { month: 1, year: currentYear + 1 };
}

// Clean phone number - remove +91 and non-digits
function cleanPhoneNumber(phone: string): string {
  return phone.trim().replace(/^\+91/, '').replace(/\D/g, '');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⚡ [create-lead-quick] Starting quick lead creation');

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

    // Verify user is a partner
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

    if (appUser.role !== 'partner' || !appUser.partner_id) {
      throw new Error('Quick lead creation is only available for partners');
    }
    console.log('✅ Partner verified:', appUser.partner_id);

    // Parse request
    const body = await req.json();

    // Validate required fields
    const missingFields: string[] = [];
    for (const field of QUICK_LEAD_REQUIRED) {
      if (!body[field]) {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const cleanPhone = cleanPhoneNumber(body.student_phone);
    if (cleanPhone.length !== 10) {
      throw new Error('Phone number must be 10 digits');
    }

    // Check for duplicate by phone
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingStudent) {
      // Check for duplicate application
      const { data: isDuplicate } = await supabaseAdmin
        .rpc('check_duplicate_application', {
          _student_id: existingStudent.id,
          _intake_month: getNextIntake().month,
          _intake_year: getNextIntake().year,
          _study_destination: body.country
        });

      if (isDuplicate) {
        throw new Error('A lead already exists for this student for the selected intake');
      }
    }

    // Create student with minimal info
    const studentData = {
      name: body.student_name.trim(),
      email: `${cleanPhone}@quicklead.placeholder`,
      phone: cleanPhone,
      postal_code: body.student_pin_code.trim(),
      country: 'India',
      nationality: 'Indian'
    };

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (studentError) {
      throw new Error(`Failed to create student: ${studentError.message}`);
    }
    console.log('✅ Student created:', student.id);

    // Create co-applicant with minimal info
    const coApplicantData = {
      name: 'To be updated',
      phone: cleanPhone, // Use student phone as placeholder
      relationship: body.co_applicant_relationship,
      salary: parseFloat(body.co_applicant_monthly_salary) * 12,
      monthly_salary: parseFloat(body.co_applicant_monthly_salary),
      pin_code: body.student_pin_code.trim() // Use student PIN as placeholder
    };

    const { data: coApplicant, error: coApplicantError } = await supabaseAdmin
      .from('co_applicants')
      .insert(coApplicantData)
      .select()
      .single();

    if (coApplicantError) {
      throw new Error(`Failed to create co-applicant: ${coApplicantError.message}`);
    }
    console.log('✅ Co-applicant created:', coApplicant.id);

    // Get default lender
    const { data: lender, error: lenderError } = await supabaseAdmin
      .from('lenders')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (lenderError || !lender) {
      throw new Error('No active lender configured');
    }
    console.log('✅ Lender assigned:', lender.name);

    // Calculate intake
    const intake = getNextIntake();

    // Create lead with defaults
    const caseId = `EDU-${Date.now()}`;
    const leadData = {
      case_id: caseId,
      student_id: student.id,
      co_applicant_id: coApplicant.id,
      partner_id: appUser.partner_id,
      lender_id: lender.id,
      loan_amount: 3000000, // Default ₹30 lakhs
      loan_type: 'unsecured', // Most common
      study_destination: body.country,
      intake_month: intake.month,
      intake_year: intake.year,
      status: 'new',
      documents_status: 'pending',
      is_quick_lead: true
    };

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }
    console.log('✅ Quick lead created:', lead.case_id);

    // Create university association if provided
    if (body.university_id) {
      await supabaseAdmin
        .from('lead_universities')
        .insert({
          lead_id: lead.id,
          university_id: body.university_id
        });
      console.log('✅ University association created');
    }

    console.log('🎉 Quick lead creation completed');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          student_name: body.student_name,
          is_quick_lead: true
        },
        message: 'Lead created successfully. Student will receive notification to complete details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 [create-lead-quick] Error:', error.message);
    
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
