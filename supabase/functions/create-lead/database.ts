/**
 * Database operations for create-lead edge function
 */
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cleanPhoneNumber, isUUID, separateUniversities, getDbCountryName } from './validation.ts';

/**
 * Validate universities match the study destination
 */
export async function validateUniversities(
  supabaseAdmin: SupabaseClient,
  universities: string[],
  country: string
): Promise<void> {
  if (!universities || universities.length === 0) return;
  
  const { uuids } = separateUniversities(universities);
  
  if (uuids.length === 0) return;
  
  const { data: dbUniversities, error } = await supabaseAdmin
    .from('universities')
    .select('id, country')
    .in('id', uuids);
  
  if (error) {
    throw new Error(`Failed to validate universities: ${error.message}`);
  }
  
  // Convert UI country code to database country name for comparison
  // UI sends: 'UK', DB stores: 'United Kingdom'
  const dbCountryName = getDbCountryName(country);
  const uiCountryCode = country;
  
  const invalidUniversities = dbUniversities?.filter((uni: any) => {
    const uniCountry = uni.country.toLowerCase();
    // Check against both full DB name and UI short code for flexibility
    const matchesFullName = uniCountry === dbCountryName.toLowerCase();
    const matchesShortCode = uniCountry === uiCountryCode.toLowerCase();
    return !matchesFullName && !matchesShortCode;
  });
  
  if (invalidUniversities && invalidUniversities.length > 0) {
    throw new Error(`Selected universities must be from ${country}`);
  }
}

/**
 * Check if email is protected (admin/system emails that cannot be used as student)
 */
export async function checkProtectedEmail(
  supabaseAdmin: SupabaseClient,
  email: string
): Promise<void> {
  if (!email) return;
  
  // Normalize email for all checks
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check protected_accounts table
  const { data: protectedAccount } = await supabaseAdmin
    .from('protected_accounts')
    .select('email, reason')
    .eq('email', normalizedEmail)
    .maybeSingle();
  
  if (protectedAccount) {
    throw new Error('This email ID already exists in the system. Please use a different email ID.');
  }
  
  // Check if email belongs to an admin or partner (not student)
  const { data: appUser } = await supabaseAdmin
    .from('app_users')
    .select('email, role')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  
  if (appUser && appUser.role !== 'student') {
    throw new Error('This email ID already exists in the system. Please use a different email ID.');
  }
  
  // Check if email belongs to a partner
  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('email')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  
  if (partner) {
    throw new Error('This email ID already exists in the system. Please use a different email ID.');
  }
}

/**
 * Check for duplicate applications
 */
export async function checkDuplicateApplication(
  supabaseAdmin: SupabaseClient,
  studentEmail: string,
  studentPhone: string,
  intakeMonth: number,
  intakeYear: number,
  studyDestination: string
): Promise<void> {
  const cleanPhone = cleanPhoneNumber(studentPhone);
  
  // First check if email is protected/reserved
  if (studentEmail) {
    await checkProtectedEmail(supabaseAdmin, studentEmail);
  }
  
  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .or(`email.eq.${studentEmail},phone.eq.${cleanPhone}`)
    .maybeSingle();
  
  if (!existingStudent) return;
  
  const { data: isDuplicate, error } = await supabaseAdmin
    .rpc('check_duplicate_application', {
      _student_id: existingStudent.id,
      _intake_month: intakeMonth,
      _intake_year: intakeYear,
      _study_destination: studyDestination
    });
  
  if (error) {
    console.warn('⚠️ Duplicate check failed:', error);
  } else if (isDuplicate) {
    throw new Error('You already have an active application for this intake and destination');
  }
}

/**
 * Create or get existing student record
 */
export async function createStudent(
  supabaseAdmin: SupabaseClient,
  body: any
): Promise<any> {
  const studentEmail = body.student_email?.trim();
  const cleanPhone = cleanPhoneNumber(body.student_phone);
  
  // Check if student already exists by email
  if (studentEmail) {
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', studentEmail)
      .maybeSingle();
    
    if (existingStudent) {
      console.log('✅ Found existing student:', existingStudent.id);
      
      // Update student with latest information
      const updateData = {
        name: body.student_name.trim(),
        phone: cleanPhone,
        postal_code: body.student_pin_code.trim(),
        date_of_birth: body.date_of_birth || existingStudent.date_of_birth,
        gender: body.gender || existingStudent.gender,
        city: body.city || existingStudent.city,
        state: body.state || existingStudent.state,
        nationality: body.nationality || existingStudent.nationality,
        highest_qualification: body.highest_qualification || existingStudent.highest_qualification,
        tenth_percentage: body.tenth_percentage || existingStudent.tenth_percentage,
        twelfth_percentage: body.twelfth_percentage || existingStudent.twelfth_percentage,
        bachelors_percentage: body.bachelors_percentage || existingStudent.bachelors_percentage,
        bachelors_cgpa: body.bachelors_cgpa || existingStudent.bachelors_cgpa,
        credit_score: body.student_credit_score || existingStudent.credit_score
      };
      
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update(updateData)
        .eq('id', existingStudent.id)
        .select()
        .single();
      
      if (updateError) {
        console.warn('⚠️ Failed to update student info:', updateError);
        return existingStudent;
      }
      
      return updatedStudent;
    }
  }
  
  // Create new student
  const studentData = {
    name: body.student_name.trim(),
    email: studentEmail || `${cleanPhone}@temp.placeholder`,
    phone: cleanPhone,
    postal_code: body.student_pin_code.trim(),
    country: 'India',
    date_of_birth: body.date_of_birth || null,
    gender: body.gender || null,
    city: body.city || null,
    state: body.state || null,
    nationality: body.nationality || 'Indian',
    highest_qualification: body.highest_qualification || null,
    tenth_percentage: body.tenth_percentage || null,
    twelfth_percentage: body.twelfth_percentage || null,
    bachelors_percentage: body.bachelors_percentage || null,
    bachelors_cgpa: body.bachelors_cgpa || null,
    credit_score: body.student_credit_score || null
  };
  
  const { data: student, error } = await supabaseAdmin
    .from('students')
    .insert(studentData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create student: ${error.message}`);
  }
  
  console.log('✅ Created new student:', student.id);
  return student;
}

/**
 * Create co-applicant record
 */
export async function createCoApplicant(
  supabaseAdmin: SupabaseClient,
  body: any
): Promise<any> {
  const coApplicantEmail = body.co_applicant_email?.trim();
  const cleanPhone = cleanPhoneNumber(body.co_applicant_phone);
  
  const coApplicantData = {
    name: body.co_applicant_name.trim(),
    email: coApplicantEmail || null,
    phone: cleanPhone,
    relationship: body.co_applicant_relationship,
    salary: parseFloat(body.co_applicant_monthly_salary) * 12,
    monthly_salary: parseFloat(body.co_applicant_monthly_salary),
    employment_type: body.co_applicant_employment_type,
    occupation: body.co_applicant_occupation || null,
    employer: body.co_applicant_employer || null,
    employment_duration_years: body.co_applicant_employment_duration || null,
    pin_code: body.co_applicant_pin_code.trim(),
    credit_score: body.co_applicant_credit_score || null
  };
  
  const { data: coApplicant, error } = await supabaseAdmin
    .from('co_applicants')
    .insert(coApplicantData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create co-applicant: ${error.message}`);
  }
  
  return coApplicant;
}

/**
 * Get default lender
 */
export async function getDefaultLender(
  supabaseAdmin: SupabaseClient,
  studyDestination?: string,
  universityIds?: string[]
): Promise<any> {
  // Phase 3: Intelligent lender assignment based on university preferences
  if (studyDestination && universityIds && universityIds.length > 0) {
    console.log('🎯 Looking for lender preferences for universities...');
    
    const { data: preferences } = await supabaseAdmin
      .from('university_lender_preferences')
      .select('lender_id, compatibility_score, is_preferred')
      .in('university_id', universityIds)
      .eq('study_destination', studyDestination)
      .eq('is_preferred', true)
      .order('compatibility_score', { ascending: false })
      .limit(1);
    
    if (preferences && preferences.length > 0) {
      const { data: preferredLender } = await supabaseAdmin
        .from('lenders')
        .select('id, name')
        .eq('id', preferences[0].lender_id)
        .eq('is_active', true)
        .single();
      
      if (preferredLender) {
        console.log('✅ Found preferred lender:', preferredLender.name);
        return preferredLender;
      }
    }
  }
  
  // Fallback: Get lender with best overall performance (using display_order as proxy)
  const { data: lender, error } = await supabaseAdmin
    .from('lenders')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .single();
  
  if (error || !lender) {
    throw new Error('No active lender configured in system');
  }
  
  console.log('✅ Using default lender:', lender.name);
  return lender;
}

/**
 * Create lead record
 */
export async function createLead(
  supabaseAdmin: SupabaseClient,
  studentId: string,
  coApplicantId: string,
  lenderId: string,
  partnerId: string | null,
  body: any
): Promise<any> {
  const caseId = `EDU-${Date.now()}`;
  
  const leadData = {
    case_id: caseId,
    student_id: studentId,
    co_applicant_id: coApplicantId,
    partner_id: partnerId,
    lender_id: lenderId,
    loan_amount: parseFloat(body.amount_requested),
    loan_type: body.loan_type,
    study_destination: body.country,
    intake_month: body.intake_month,
    intake_year: body.intake_year,
    status: 'new',
    documents_status: 'pending'
  };
  
  const { data: lead, error } = await supabaseAdmin
    .from('leads_new')
    .insert(leadData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }
  
  return lead;
}

/**
 * Create academic test records
 */
export async function createTestRecords(
  supabaseAdmin: SupabaseClient,
  studentId: string,
  tests: any[]
): Promise<void> {
  if (!tests || !Array.isArray(tests) || tests.length === 0) return;
  
  const testRecords = tests.map((test: any) => ({
    student_id: studentId,
    test_type: test.testType,
    score: test.testScore?.toString(),
    certificate_number: test.testCertificateNumber || null,
    test_date: test.testDate || null
  }));
  
  const { error } = await supabaseAdmin
    .from('academic_tests')
    .insert(testRecords);
  
  if (error) {
    console.warn('⚠️ Test scores creation failed:', error);
  }
}

/**
 * Create university associations
 */
export async function createUniversityAssociations(
  supabaseAdmin: SupabaseClient,
  leadId: string,
  universities: string[]
): Promise<void> {
  if (!universities || universities.length === 0) return;
  
  const { uuids } = separateUniversities(universities);
  
  if (uuids.length === 0) return;
  
  const universityRecords = uuids.map((universityId: string) => ({
    lead_id: leadId,
    university_id: universityId
  }));
  
  const { error } = await supabaseAdmin
    .from('lead_universities')
    .insert(universityRecords);
  
  if (error) {
    console.warn('⚠️ University associations failed:', error);
  }
}
