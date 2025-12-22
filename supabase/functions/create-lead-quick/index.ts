/**
 * Lead Creation Edge Function
 * Creates a complete lead with all required fields
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Required fields for lead creation
const REQUIRED_FIELDS = [
  'student_name',
  'student_phone', 
  'student_pin_code',
  'country',
  'loan_amount',
  'intake_month',
  'intake_year',
  'co_applicant_relationship',
  'co_applicant_name',
  'co_applicant_monthly_salary',
  'co_applicant_phone',
  'co_applicant_pin_code'
];

// Clean phone number - remove +91 and non-digits
function cleanPhoneNumber(phone: string): string {
  return String(phone).trim().replace(/^\+91/, '').replace(/\D/g, '');
}

// Map country names to study_destination_enum values
function mapCountryToEnum(country: string): string {
  const mapping: Record<string, string> = {
    'United Kingdom': 'UK',
    'United States': 'USA',
    'United States of America': 'USA',
    'New Zealand': 'New Zealand',
    'Australia': 'Australia',
    'Canada': 'Canada',
    'Germany': 'Germany',
    'Ireland': 'Ireland',
    'UK': 'UK',
    'USA': 'USA',
  };
  return mapping[country] || 'Other';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⚡ [create-lead] Starting lead creation');

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

    // Verify user is a partner or admin
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

    // Allow partners and admins
    const isAdmin = appUser.role === 'admin' || appUser.role === 'super_admin';
    const isPartner = appUser.role === 'partner';

    if (!isAdmin && !isPartner) {
      throw new Error('Lead creation is only available for partners and admins');
    }

    // For partners, use their partner_id. For admins, use the one from request body
    let partnerId = appUser.partner_id;
    if (isAdmin) {
      // Parse request early for admins to get partner_id
      const bodyText = await req.text();
      const body = JSON.parse(bodyText);
      partnerId = body.partner_id;
      if (!partnerId) {
        throw new Error('Admins must specify a partner_id');
      }
      // Store parsed body for later use
      (req as any)._parsedBody = body;
    }
    console.log('✅ User verified:', appUser.role, 'Partner:', partnerId);

    // Parse request (may already be parsed for admins)
    const body = (req as any)._parsedBody || await req.json();

    // Validate required fields
    const missingFields: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const cleanStudentPhone = cleanPhoneNumber(body.student_phone);
    if (cleanStudentPhone.length !== 10) {
      throw new Error('Student phone number must be 10 digits');
    }

    const cleanCoApplicantPhone = cleanPhoneNumber(body.co_applicant_phone);
    if (cleanCoApplicantPhone.length !== 10) {
      throw new Error('Co-applicant phone number must be 10 digits');
    }

    // Get intake from body (now required)
    const intakeMonth = parseInt(body.intake_month);
    const intakeYear = parseInt(body.intake_year);

    // Check for existing student by phone OR email
    const studentEmail = body.student_email?.trim() || null;
    
    let existingStudent = null;
    
    // Check by phone first
    const { data: studentByPhone } = await supabaseAdmin
      .from('students')
      .select('id, email')
      .eq('phone', cleanStudentPhone)
      .maybeSingle();
    
    existingStudent = studentByPhone;
    
    // If no match by phone and email provided, check by email
    if (!existingStudent && studentEmail) {
      const { data: studentByEmail } = await supabaseAdmin
        .from('students')
        .select('id, email')
        .eq('email', studentEmail.toLowerCase())
        .maybeSingle();
      
      existingStudent = studentByEmail;
    }

    let studentId: string;

    if (existingStudent) {
      // Use existing student
      console.log('✅ Using existing student:', existingStudent.id);
      studentId = existingStudent.id;
      
      // Check for duplicate application
      const { data: isDuplicate } = await supabaseAdmin
        .rpc('check_duplicate_application', {
          _student_id: existingStudent.id,
          _intake_month: intakeMonth,
          _intake_year: intakeYear,
          _study_destination: mapCountryToEnum(body.country)
        });

      if (isDuplicate) {
        throw new Error('A lead already exists for this student for the selected intake');
      }
    } else {
      // Create new student
      const newStudentEmail = studentEmail || `${cleanStudentPhone}@lead.placeholder`;
      const studentData: Record<string, any> = {
        name: body.student_name.trim(),
        email: newStudentEmail.toLowerCase(),
        phone: cleanStudentPhone,
        postal_code: body.student_pin_code.trim(),
        country: 'India',
        nationality: 'Indian'
      };

      // Add optional student fields
      if (body.student_gender) {
        studentData.gender = body.student_gender;
      }
      if (body.student_dob) {
        studentData.date_of_birth = body.student_dob;
      }

      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (studentError) {
        throw new Error(`Failed to create student: ${studentError.message}`);
      }
      console.log('✅ Student created:', student.id);
      studentId = student.id;
    }

    // Create co-applicant with all provided details
    const coApplicantData: Record<string, any> = {
      name: body.co_applicant_name.trim(),
      phone: cleanCoApplicantPhone,
      relationship: body.co_applicant_relationship,
      salary: parseFloat(body.co_applicant_monthly_salary) * 12,
      monthly_salary: parseFloat(body.co_applicant_monthly_salary),
      pin_code: body.co_applicant_pin_code.trim()
    };

    // Add optional co-applicant fields
    if (body.co_applicant_occupation) {
      coApplicantData.occupation = body.co_applicant_occupation.trim();
    }
    if (body.co_applicant_employer) {
      coApplicantData.employer = body.co_applicant_employer.trim();
    }

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

    // Map country to valid enum value
    const studyDestination = mapCountryToEnum(body.country);

    // Create lead with all provided details
    const caseId = `EDU-${Date.now()}`;
    const loanAmount = parseInt(body.loan_amount) || 3000000;
    const loanType = body.loan_type || 'unsecured';
    
    const leadData = {
      case_id: caseId,
      student_id: studentId,
      co_applicant_id: coApplicant.id,
      partner_id: partnerId,
      lender_id: lender.id,
      loan_amount: loanAmount,
      loan_type: loanType,
      study_destination: studyDestination,
      intake_month: intakeMonth,
      intake_year: intakeYear,
      status: 'new',
      documents_status: 'pending',
      is_quick_lead: false // Now a complete lead
    };

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }
    console.log('✅ Lead created:', lead.case_id);

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

    // Create course association if provided
    if (body.course_id) {
      await supabaseAdmin
        .from('lead_courses')
        .insert({
          lead_id: lead.id,
          course_id: body.course_id,
          is_custom_course: false
        });
      console.log('✅ Course association created');
    } else if (body.course_name) {
      // Custom course name - we need to store it differently
      // For now, create a placeholder entry or store in lead metadata
      console.log('📝 Custom course name provided:', body.course_name);
    }

    console.log('🎉 Lead creation completed');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          student_name: body.student_name
        },
        message: 'Lead created successfully with all details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 [create-lead] Error:', error.message);
    
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
