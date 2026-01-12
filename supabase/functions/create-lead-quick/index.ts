/**
 * Quick Lead Creation Edge Function
 * Creates a lead with minimal required fields (for partner quick capture)
 * 
 * Uses unified validation layer for consistent data integrity
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateQuickLeadRequest,
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
      throw new Error('Quick lead creation is only available for partners and admins');
    }

    // For partners, use their partner_id. For admins, require partner_id in body
    let partnerId = appUser.partner_id;
    const body = await req.json();
    
    if (isAdmin) {
      partnerId = body.partner_id;
      if (!partnerId) {
        throw new Error('Admins must specify a partner_id');
      }
    }
    console.log('✅ User verified:', appUser.role, 'Partner:', partnerId);

    // Validate request with unified validation
    console.log('📝 Validating quick lead data...');
    const validationResult = validateQuickLeadRequest(body);
    
    if (!validationResult.isValid) {
      console.error('❌ Validation failed:', validationResult.errors);
      throw new Error(formatValidationErrors(validationResult.errors));
    }
    console.log('✅ Validation passed');

    // Clean and prepare data
    const cleanStudentPhone = cleanPhoneNumber(body.student_phone);
    const studyDestination = mapCountryToEnum(normalizeCountry(body.country));
    const loanAmount = parseInt(body.loan_amount) || 3000000;
    
    // Default intake to 3 months from now
    const now = new Date();
    const defaultIntakeDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    const intakeMonth = body.intake_month || (defaultIntakeDate.getMonth() + 1);
    const intakeYear = body.intake_year || defaultIntakeDate.getFullYear();

    // Check for existing student by phone
    console.log('🔍 Checking for existing student...');
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('phone', cleanStudentPhone)
      .maybeSingle();

    let studentId: string;

    if (existingStudent) {
      studentId = existingStudent.id;
      console.log('✅ Found existing student:', studentId);

      // Check for duplicate quick lead
      const { data: existingLead } = await supabaseAdmin
        .from('leads_new')
        .select('id, case_id')
        .eq('student_id', studentId)
        .eq('study_destination', studyDestination)
        .eq('intake_month', intakeMonth)
        .eq('intake_year', intakeYear)
        .maybeSingle();

      if (existingLead) {
        console.log('⚠️ Duplicate lead found:', existingLead.case_id);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'A lead already exists for this student for the selected intake',
            error_code: 'DUPLICATE_LEAD',
            existing_case_id: existingLead.case_id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so frontend can handle gracefully
          }
        );
      }
    } else {
      // Create new student with minimal data
      console.log('📝 Creating new student...');
      const { data: newStudent, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          name: body.student_name.trim(),
          email: `${cleanStudentPhone}@quick.placeholder`,
          phone: cleanStudentPhone,
          postal_code: '000000', // Default placeholder - PIN no longer collected in quick lead
          country: 'India',
          nationality: 'Indian',
        })
        .select()
        .single();

      if (studentError) {
        throw new Error(`Failed to create student: ${studentError.message}`);
      }
      studentId = newStudent.id;
      console.log('✅ Student created:', studentId);
    }

    // Create minimal co-applicant (required by schema)
    console.log('📝 Creating placeholder co-applicant...');
    
    // Determine salary - accept income_range value or direct monthly_salary
    const coApplicantSalary = parseFloat(body.co_applicant_monthly_salary || '50000');
    
    const { data: coApplicant, error: coApplicantError } = await supabaseAdmin
      .from('co_applicants')
      .insert({
        name: body.co_applicant_name?.trim() || 'To be updated',
        phone: body.co_applicant_phone ? cleanPhoneNumber(body.co_applicant_phone) : cleanStudentPhone,
        relationship: body.co_applicant_relationship || 'parent',
        salary: coApplicantSalary * 12, // Annual salary
        monthly_salary: coApplicantSalary,
        pin_code: '000000', // Default placeholder - PIN no longer collected
        state: body.co_applicant_state || null, // NEW: Store state instead of PIN
        occupation: body.co_applicant_occupation || null,
        employment_type: body.co_applicant_employer_type || null,
        employer: body.co_applicant_employer?.trim() || null,
      })
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

    // Create quick lead
    const caseId = `EDU-${Date.now()}`;
    console.log('📝 Creating quick lead:', caseId);

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert({
        case_id: caseId,
        student_id: studentId,
        co_applicant_id: coApplicant.id,
        partner_id: partnerId,
        lender_id: lender.id,
        loan_amount: loanAmount,
        loan_type: body.loan_type || 'unsecured',
        study_destination: studyDestination,
        intake_month: intakeMonth,
        intake_year: intakeYear,
        status: 'new',
        documents_status: 'pending',
        is_quick_lead: true,
        source: 'partner_quick',
      })
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }
    console.log('✅ Quick lead created:', lead.case_id);

    // Create audit log entry for lead creation
    const { error: auditError } = await supabaseAdmin
      .from('field_audit_log')
      .insert({
        lead_id: lead.id,
        table_name: 'leads_new',
        field_name: 'lead_created',
        old_value: null,
        new_value: JSON.stringify({
          case_id: lead.case_id,
          is_quick_lead: true,
          source: 'partner_quick',
          student_name: body.student_name,
          loan_amount: loanAmount,
          study_destination: studyDestination,
        }),
        changed_by_id: user.id,
        changed_by_name: user.email,
        changed_by_type: isAdmin ? 'admin' : 'partner',
        change_source: 'api',
        change_reason: 'Quick lead creation',
      });
    
    if (auditError) {
      console.warn('⚠️ Audit log failed:', auditError.message);
    } else {
      console.log('✅ Audit log created');
    }

    // Create university association if provided
    if (body.university_id) {
      await supabaseAdmin
        .from('lead_universities')
        .insert({
          lead_id: lead.id,
          university_id: body.university_id,
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
          is_quick_lead: true,
        },
        message: 'Quick lead created successfully. Complete the full application to proceed.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    const message = error?.message || 'An unexpected error occurred';
    console.error('💥 [create-lead-quick] Error:', message);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        error_code: 'BAD_REQUEST',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
