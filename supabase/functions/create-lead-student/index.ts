/**
 * Student Lead Creation Edge Function
 * 
 * Uses unified validation layer for consistent data integrity
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateStudentLeadRequest,
  formatValidationErrors,
  cleanPhoneNumber,
  normalizeCountry,
} from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('🎓 [create-lead-student] Starting student lead creation');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const body = await req.json();
    console.log('📝 Request received for:', body.student_name);

    // Determine if this is an authenticated request
    const authHeader = req.headers.get('Authorization');
    let authenticatedUser = null;
    let isAuthenticated = false;

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && user) {
        authenticatedUser = user;
        isAuthenticated = true;
        console.log('✅ Authenticated user:', user.email);
      }
    }

    // Validate with unified validation
    console.log('📝 Validating student lead data...');
    const validationResult = validateStudentLeadRequest(body);
    
    if (!validationResult.isValid) {
      console.error('❌ Validation failed:', validationResult.errors);
      throw new Error(formatValidationErrors(validationResult.errors));
    }
    console.log('✅ Validation passed');

    // Clean and prepare data
    const cleanStudentPhone = cleanPhoneNumber(body.student_phone);
    const source = body.source || 'student_direct';
    const studyDestination = mapCountryToEnum(normalizeCountry(body.country));
    const loanAmount = parseInt(body.loan_amount) || 3000000;
    const intakeMonth = body.intake_month || (new Date().getMonth() + 4) % 12 + 1;
    const intakeYear = body.intake_year || (intakeMonth <= new Date().getMonth() + 1 ? new Date().getFullYear() + 1 : new Date().getFullYear());

    // Check for existing lead by phone number
    console.log('🔍 Checking for existing lead by phone:', cleanStudentPhone);
    
    const { data: existingStudent, error: studentLookupError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('phone', cleanStudentPhone)
      .maybeSingle();

    let existingLead: any = null;
    let partnerName: string | null = null;
    
    if (existingStudent) {
      console.log('📋 Found existing student:', existingStudent.id);
      
      // Check for existing lead for this intake
      const { data: leadData } = await supabaseAdmin
        .from('leads_new')
        .select(`
          id, 
          case_id, 
          partner_id, 
          status, 
          is_quick_lead,
          study_destination,
          intake_month,
          intake_year
        `)
        .eq('student_id', existingStudent.id)
        .eq('study_destination', studyDestination)
        .eq('intake_month', intakeMonth)
        .eq('intake_year', intakeYear)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      existingLead = leadData;
      
      // Get partner name if partner_id exists
      if (existingLead?.partner_id) {
        const { data: partnerData } = await supabaseAdmin
          .from('partners')
          .select('name')
          .eq('id', existingLead.partner_id)
          .single();
        partnerName = partnerData?.name || null;
      }
    }

    // CASE 1: Existing partner-created lead found
    if (existingLead && existingLead.partner_id) {
      console.log('✅ Found existing partner-created lead:', existingLead.case_id);
      console.log('   Partner:', partnerName);
      
      // Update existing lead if it's a quick lead and we have more data
      if (existingLead.is_quick_lead && isAuthenticated) {
        console.log('📝 Updating quick lead to full application');
        
        const { error: updateError } = await supabaseAdmin
          .from('leads_new')
          .update({
            is_quick_lead: false,
            status: 'new',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLead.id);

        if (updateError) {
          console.warn('⚠️ Failed to update lead:', updateError.message);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          lead: {
            id: existingLead.id,
            case_id: existingLead.case_id,
            is_partner_lead: true,
            partner_name: partnerName,
          },
          message: 'Found your existing application. Your partner has already started your application.',
          is_existing: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // CASE 2: Existing organic lead found
    if (existingLead && !existingLead.partner_id) {
      console.log('✅ Found existing organic lead:', existingLead.case_id);
      
      return new Response(
        JSON.stringify({
          success: true,
          lead: {
            id: existingLead.id,
            case_id: existingLead.case_id,
            is_partner_lead: false,
            partner_name: null,
          },
          message: 'Found your existing application.',
          is_existing: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // CASE 3: Create new organic lead
    console.log('📝 Creating new organic lead (no partner)');

    // Create or get student
    let studentId: string;
    
    if (existingStudent) {
      studentId = existingStudent.id;
      console.log('✅ Using existing student:', studentId);
      
      // IMPORTANT: If authenticated, sync student email to auth user email (if not already taken)
      if (isAuthenticated && authenticatedUser?.email) {
        const authEmail = authenticatedUser.email.toLowerCase();
        
        // Check if this email is already used by a different student
        const { data: emailCheck } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('email', authEmail)
          .neq('id', studentId)
          .maybeSingle();
        
        if (emailCheck) {
          console.log('⚠️ Email already in use by another student, skipping sync');
        } else {
          console.log('🔄 Syncing student email to auth user email:', authEmail);
          
          const { error: syncError } = await supabaseAdmin
            .from('students')
            .update({ email: authEmail })
            .eq('id', studentId);
            
          if (syncError) {
            console.warn('⚠️ Failed to sync student email:', syncError.message);
          } else {
            console.log('✅ Student email synced to:', authEmail);
          }
        }
      }
    } else {
      // Create new student - check if email is already taken
      let studentEmail = isAuthenticated 
        ? authenticatedUser!.email?.toLowerCase()
        : `${cleanStudentPhone}@student.placeholder`;
      
      // If authenticated and email exists, check if it's already used
      if (isAuthenticated && studentEmail) {
        const { data: existingByEmail } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('email', studentEmail)
          .maybeSingle();
        
        if (existingByEmail) {
          // Email already in use - use phone-based placeholder instead
          console.log('⚠️ Email already in use, using phone-based placeholder');
          studentEmail = `${cleanStudentPhone}@student.placeholder`;
        }
      }
      
      const { data: newStudent, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          name: body.student_name.trim(),
          email: studentEmail,
          phone: cleanStudentPhone,
          postal_code: body.student_pin_code?.trim() || '000000',
          country: 'India',
          nationality: 'Indian',
        })
        .select()
        .single();

      if (studentError) {
        throw new Error(`Failed to create student: ${studentError.message}`);
      }
      
      studentId = newStudent.id;
      console.log('✅ Created new student:', studentId);
    }

    // Create co-applicant
    const cleanCoApplicantPhone = body.co_applicant_phone 
      ? cleanPhoneNumber(body.co_applicant_phone) 
      : cleanStudentPhone;
    
    const coApplicantSalary = parseFloat(body.co_applicant_monthly_salary || '50000');
    
    const { data: coApplicant, error: coApplicantError } = await supabaseAdmin
      .from('co_applicants')
      .insert({
        name: body.co_applicant_name?.trim() || 'Co-Applicant',
        phone: cleanCoApplicantPhone,
        relationship: body.co_applicant_relationship || 'parent',
        salary: coApplicantSalary * 12,
        monthly_salary: coApplicantSalary,
        pin_code: body.co_applicant_pin_code?.trim() || '000000',
      })
      .select()
      .single();

    if (coApplicantError) {
      throw new Error(`Failed to create co-applicant: ${coApplicantError.message}`);
    }
    console.log('✅ Created co-applicant:', coApplicant.id);

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
    console.log('✅ Assigned lender:', lender.name);

    // Create lead - ORGANIC (no partner_id)
    const caseId = `EDU-${Date.now()}`;
    const isQuickLead = source === 'student_landing' && !isAuthenticated;

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert({
        case_id: caseId,
        student_id: studentId,
        co_applicant_id: coApplicant.id,
        partner_id: null, // ORGANIC - no partner
        lender_id: lender.id,
        loan_amount: loanAmount,
        loan_type: body.loan_type || 'unsecured',
        study_destination: studyDestination,
        intake_month: intakeMonth,
        intake_year: intakeYear,
        status: 'new',
        documents_status: 'pending',
        is_quick_lead: isQuickLead,
        source: source,
        eligibility_score: body.eligibility_score || null,
        eligibility_result: body.eligibility_result || null,
      })
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }
    console.log('✅ Created organic lead:', lead.case_id);

    // Create university association if provided
    if (body.university_id && body.university_id.length > 10) {
      await supabaseAdmin
        .from('lead_universities')
        .insert({
          lead_id: lead.id,
          university_id: body.university_id,
        });
      console.log('✅ University association created');
    }

    console.log('🎉 Student lead creation completed');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          is_partner_lead: false,
          partner_name: null,
        },
        message: isQuickLead 
          ? 'Your eligibility check has been saved. Complete verification to continue.'
          : 'Your application has been created successfully.',
        is_existing: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    const message = error?.message || 'An unexpected error occurred';
    console.error('💥 [create-lead-student] Error:', message);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
