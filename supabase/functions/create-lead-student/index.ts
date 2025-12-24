/**
 * Student Lead Creation Edge Function
 * 
 * Uses unified validation layer for consistent data integrity
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
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

// ===== HELPER: AI Lender Evaluation =====
async function evaluateLendersForLead(
  supabaseAdmin: SupabaseClient,
  leadId: string,
  studyDestination: string,
  loanAmount: number
): Promise<any[]> {
  console.log('🤖 Triggering AI lender evaluation for lead:', leadId);
  
  let recommendedLenders: any[] = [];
  
  try {
    // Call suggest-lender edge function
    const suggestLenderUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/suggest-lender`;
    
    const lenderResponse = await fetch(suggestLenderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        leadId: leadId,
        studyDestination: studyDestination,
        loanAmount: loanAmount,
      }),
    });

    if (lenderResponse.ok) {
      const lenderSuggestion = await lenderResponse.json();
      console.log('✅ AI lender evaluation complete');
      
      if (lenderSuggestion.success && lenderSuggestion.grouped_evaluations) {
        // Return ALL lenders grouped by fit category (not just top 5)
        const allEvaluations = [
          ...(lenderSuggestion.grouped_evaluations.best_fit || []).map((e: any) => ({ ...e, fit_group: 'best_fit' })),
          ...(lenderSuggestion.grouped_evaluations.also_consider || []).map((e: any) => ({ ...e, fit_group: 'also_consider' })),
          ...(lenderSuggestion.grouped_evaluations.possible_but_risky || []).map((e: any) => ({ ...e, fit_group: 'possible_but_risky' })),
          ...(lenderSuggestion.grouped_evaluations.not_suitable || []).map((e: any) => ({ ...e, fit_group: 'not_suitable' })),
        ];
        
        console.log(`📊 Found ${allEvaluations.length} total lenders (all categories)`);
        
        // Get full lender details for each evaluation
        if (allEvaluations.length > 0) {
          const lenderIds = allEvaluations.map((e: any) => e.lender_id);
          
          const { data: lenderDetails } = await supabaseAdmin
            .from('lenders')
            .select(`
              id, name, code, description, logo_url, website,
              contact_email, contact_phone,
              interest_rate_min, interest_rate_max,
              loan_amount_min, loan_amount_max,
              processing_fee, foreclosure_charges,
              moratorium_period, processing_time_days,
              disbursement_time_days, approval_rate,
              key_features, eligible_expenses, required_documents
            `)
            .in('id', lenderIds);
          
          // Merge AI scores with full lender details
          recommendedLenders = allEvaluations.map((evalResult: any) => {
            const details: any = lenderDetails?.find((l: any) => l.id === evalResult.lender_id) || {};
            return {
              lender_id: evalResult.lender_id,
              lender_name: evalResult.lender_name,
              lender_code: details.code || '',
              lender_description: details.description,
              logo_url: details.logo_url,
              website: details.website,
              contact_email: details.contact_email,
              contact_phone: details.contact_phone,
              interest_rate_min: details.interest_rate_min,
              interest_rate_max: details.interest_rate_max,
              loan_amount_min: details.loan_amount_min,
              loan_amount_max: details.loan_amount_max,
              processing_fee: details.processing_fee,
              foreclosure_charges: details.foreclosure_charges,
              moratorium_period: details.moratorium_period,
              processing_time_days: details.processing_time_days,
              disbursement_time_days: details.disbursement_time_days,
              approval_rate: details.approval_rate,
              key_features: details.key_features,
              eligible_expenses: details.eligible_expenses,
              required_documents: details.required_documents,
              // AI evaluation data
              compatibility_score: evalResult.fit_score,
              is_preferred: evalResult.group === 'best_fit' || evalResult.fit_group === 'best_fit',
              student_facing_reason: evalResult.student_facing_reason || evalResult.justification,
              processing_time_estimate: evalResult.processing_time_estimate,
              probability_band: evalResult.probability_band,
              risk_flags: evalResult.risk_flags || [],
              // NEW: Include fit group and justification for UI
              fit_group: evalResult.fit_group || evalResult.group,
              justification: evalResult.justification,
              bre_rules_matched: evalResult.bre_rules_matched || [],
            };
          });
          
          // Update lead with best-fit lender
          if (recommendedLenders.length > 0) {
            const bestLender = recommendedLenders[0];
            await supabaseAdmin
              .from('leads_new')
              .update({ 
                lender_id: bestLender.lender_id,
              })
              .eq('id', leadId);
            console.log('✅ Assigned best-fit lender:', bestLender.lender_name);
          }
        }
      }
    } else {
      const errorText = await lenderResponse.text();
      console.warn('⚠️ AI lender evaluation returned error:', errorText);
    }
  } catch (aiError: any) {
    console.error('❌ AI lender call error:', aiError.message);
  }
  
  // Fallback: Return top 3 lenders by preferred_rank if AI failed
  if (recommendedLenders.length === 0) {
    console.log('📋 Using fallback lender list');
    
    const { data: fallbackLenders } = await supabaseAdmin
      .from('lenders')
      .select(`
        id, name, code, description, logo_url, website,
        interest_rate_min, interest_rate_max,
        loan_amount_min, loan_amount_max,
        processing_fee, moratorium_period,
        processing_time_days, approval_rate,
        key_features
      `)
      .eq('is_active', true)
      .order('preferred_rank', { ascending: true });
    
    recommendedLenders = (fallbackLenders || []).map((l: any, index: number) => {
      // Calculate a basic score based on available data
      let score = 50;
      const factors: string[] = [];
      
      // Loan amount fit
      if (l.loan_amount_min && l.loan_amount_max) {
        score += 10;
        factors.push('Competitive loan range');
      }
      
      // Interest rate available
      if (l.interest_rate_min && l.interest_rate_max) {
        score += 10;
        factors.push('Transparent rates');
      }
      
      // Approval rate
      if (l.approval_rate && l.approval_rate > 80) {
        score += 10;
        factors.push('High approval rate');
      }
      
      // Priority bonus
      score += Math.max(0, 15 - (index * 5));
      
      return {
        lender_id: l.id,
        lender_name: l.name,
        lender_code: l.code,
        lender_description: l.description,
        logo_url: l.logo_url,
        website: l.website,
        interest_rate_min: l.interest_rate_min,
        interest_rate_max: l.interest_rate_max,
        loan_amount_min: l.loan_amount_min,
        loan_amount_max: l.loan_amount_max,
        processing_fee: l.processing_fee,
        moratorium_period: l.moratorium_period,
        processing_time_days: l.processing_time_days,
        approval_rate: l.approval_rate,
        key_features: l.key_features,
        compatibility_score: Math.min(100, score),
        is_preferred: index === 0,
        student_facing_reason: factors.length > 0 
          ? factors.join(', ')
          : 'Popular choice for education loans',
        fit_group: score >= 70 ? 'also_consider' : 'possible_but_risky',
        is_fallback: true,
        risk_flags: ['AI evaluation unavailable - showing default rankings'],
        bre_rules_matched: factors,
      };
    });
    
    console.log(`📋 Returning ${recommendedLenders.length} fallback lenders`);
  }
  
  return recommendedLenders;
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
          intake_year,
          loan_amount
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

      // ===== AI LENDER EVALUATION FOR EXISTING PARTNER LEAD =====
      const recommendedLenders = await evaluateLendersForLead(
        supabaseAdmin,
        existingLead.id,
        existingLead.study_destination || studyDestination,
        parseFloat(existingLead.loan_amount) || loanAmount
      );

      return new Response(
        JSON.stringify({
          success: true,
          lead: {
            id: existingLead.id,
            case_id: existingLead.case_id,
            requested_amount: parseFloat(existingLead.loan_amount) || loanAmount,
            is_partner_lead: true,
            partner_name: partnerName,
          },
          recommended_lenders: recommendedLenders,
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
      
      // ===== AI LENDER EVALUATION FOR EXISTING ORGANIC LEAD =====
      const recommendedLenders = await evaluateLendersForLead(
        supabaseAdmin,
        existingLead.id,
        existingLead.study_destination || studyDestination,
        parseFloat(existingLead.loan_amount) || loanAmount
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          lead: {
            id: existingLead.id,
            case_id: existingLead.case_id,
            requested_amount: parseFloat(existingLead.loan_amount) || loanAmount,
            is_partner_lead: false,
            partner_name: null,
          },
          recommended_lenders: recommendedLenders,
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
    console.log('✅ Assigned default lender:', lender.name);

    // Create lead - ORGANIC (no partner_id)
    // KB: Enforce student_id from auth, set created_by fields
    const caseId = `EDU-${Date.now()}`;
    const isQuickLead = source === 'student_landing' && !isAuthenticated;

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_new')
      .insert({
        case_id: caseId,
        student_id: studentId, // KB: Tied to their OTP identity
        co_applicant_id: coApplicant.id,
        partner_id: null, // ORGANIC - no partner (KB: Student cannot set partner_id)
        lender_id: lender.id, // KB: Student cannot override lender assignment
        loan_amount: loanAmount,
        loan_type: body.loan_type || 'unsecured',
        loan_classification: (body.loan_type === 'secured') ? 'secured_property' : 'unsecured',
        study_destination: studyDestination,
        intake_month: intakeMonth,
        intake_year: intakeYear,
        status: 'new',
        documents_status: 'pending',
        is_quick_lead: isQuickLead,
        source: source,
        eligibility_score: body.eligibility_score || null,
        eligibility_result: body.eligibility_result || null,
        // KB: Origin tracking for auditability
        created_by_user_id: authenticatedUser?.id || null,
        created_by_role: isAuthenticated ? 'student' : 'anonymous',
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

    // ===== AI LENDER EVALUATION FOR NEW LEAD =====
    const recommendedLenders = await evaluateLendersForLead(
      supabaseAdmin,
      lead.id,
      studyDestination,
      loanAmount
    );

    console.log('🎉 Student lead creation completed');

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_id: lead.case_id,
          requested_amount: loanAmount,
          is_partner_lead: false,
          partner_name: null,
        },
        recommended_lenders: recommendedLenders,
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
