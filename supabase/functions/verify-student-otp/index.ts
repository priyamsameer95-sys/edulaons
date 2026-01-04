/**
 * Student OTP Verification Edge Function
 * 
 * Per Knowledge Base:
 * - Student can sign up independently via OTP
 * - Student sees "No application yet" state if no lead exists
 * - Student account activation tracked via is_activated, activated_at
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded OTP for testing - in production, this would be SMS-based
const VALID_OTP = '9955'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, otp, name } = await req.json()
    
    console.log('🔐 OTP verification request:', { phone, otp: otp ? '****' : 'missing', name })

    // Validate inputs
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean phone number (remove spaces, dashes, +, etc.) and normalize country code
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '')
    
    // Strip +91 or 91 prefix for Indian numbers (normalize to 10 digits)
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2)
    }
    
    console.log('📱 Phone normalized:', { original: phone, cleaned: cleanPhone })
    
    // Validate OTP (hardcoded for now)
    if (otp !== VALID_OTP) {
      console.log('❌ Invalid OTP provided')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP. Use 9955 for testing.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if student exists by phone
    const { data: existingStudent, error: findError } = await supabase
      .from('students')
      .select('id, email, name, phone, is_activated, activated_at, otp_enabled')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (findError) {
      console.error('Error finding student:', findError)
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let studentId: string
    let studentEmail: string
    let studentName: string
    let isNewUser = false
    let hasLead = false

    if (existingStudent) {
      // Existing student - use their details
      console.log('📋 Found existing student:', existingStudent.id)
      studentId = existingStudent.id
      studentName = existingStudent.name
      
      // Phone is primary ID - email handling:
      // - If email is synthetic/placeholder → set to NULL (will be updated when user provides real email in form)
      // - If email is real → preserve it
      const isSyntheticOrPlaceholder = 
        !existingStudent.email ||
        existingStudent.email.includes('placeholder') || 
        existingStudent.email.includes('@lead.') ||
        existingStudent.email.endsWith('@student.loan.app');

      if (isSyntheticOrPlaceholder) {
        // Clear synthetic email - real email will come from application form
        console.log('🔄 Clearing synthetic/placeholder email, will be set from application form')
        
        await supabase
          .from('students')
          .update({ email: null })
          .eq('id', studentId)
        
        // For auth, we still need an email - use synthetic for Supabase Auth only
        studentEmail = `${cleanPhone}@student.loan.app`
      } else {
        // Preserve real email
        studentEmail = existingStudent.email
        console.log('📧 Preserving real email:', studentEmail)
      }

      // KB Requirement: Check if a lead exists for this student
      const { data: leadData, error: leadError } = await supabase
        .from('leads_new')
        .select('id, case_id, status, partner_id')
        .eq('student_id', studentId)
        .limit(1)
        .maybeSingle()

      if (!leadError && leadData) {
        hasLead = true
        console.log('✅ Lead found for student:', leadData.case_id)

        // Activate student on first login with a lead
        if (!existingStudent.is_activated) {
          const { error: activateError } = await supabase
            .from('students')
            .update({ 
              is_activated: true, 
              activated_at: new Date().toISOString() 
            })
            .eq('id', studentId)

          if (activateError) {
            console.warn('⚠️ Failed to activate student:', activateError.message)
          } else {
            console.log('🎉 Student activated on first login with lead')
          }
        }
      } else {
        console.log('ℹ️ No lead found for student - they can still proceed to create one')
      }
    } else {
      // New student - create one (KB: Student can sign up independently)
      // Phone is primary ID - email is NULL until user provides real email in application form
      isNewUser = true
      studentName = name || `Student ${cleanPhone.slice(-4)}`
      
      // For Supabase Auth we need an email, but students table will have NULL
      const authEmail = `${cleanPhone}@student.loan.app`
      console.log('🆕 Creating new student with phone as primary ID (email=NULL)')
      
      // Try to insert new student with NULL email
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          phone: cleanPhone,
          email: null,  // NULL - will be set when user provides real email in form
          name: studentName,
          otp_enabled: true,
          is_activated: false, // Not activated until they have a lead
        })
        .select('id, name')
        .single()

      if (insertError) {
        // Handle unique constraint violation OR PGRST116 (0 rows) gracefully
        if (insertError.code === '23505' || insertError.code === 'PGRST116') {
          console.log('⚠️ Phone already exists, fetching existing student:', insertError.code)
          const { data: existingByPhone, error: fetchError } = await supabase
            .from('students')
            .select('id, email, name')
            .eq('phone', cleanPhone)
            .maybeSingle()
          
          if (existingByPhone) {
            studentId = existingByPhone.id
            // Use real email if exists, otherwise synthetic for auth only
            studentEmail = existingByPhone.email && !existingByPhone.email.endsWith('@student.loan.app') 
              ? existingByPhone.email 
              : authEmail
            studentName = existingByPhone.name
            isNewUser = false
            console.log('✅ Found existing student:', studentId)
          } else {
            console.error('Could not find student after error:', insertError, fetchError)
            return new Response(
              JSON.stringify({ success: false, error: 'Could not find or create student' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          console.error('Error creating student:', insertError)
          return new Response(
            JSON.stringify({ success: false, error: 'Could not create student profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        studentId = newStudent.id
        studentEmail = authEmail  // For Supabase Auth only, students.email is NULL
        hasLead = false // New user has no lead
        console.log('✅ Created new student:', studentId, '(email=NULL in students table)')
      }
    }

    // Check if auth user exists for this phone (search by pattern to catch duplicates)
    // This prevents creating duplicate users like +919955240477@student.loan.app AND 9955240477@student.loan.app
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // Find any existing auth user that matches this phone number
    const phonePattern = cleanPhone.slice(-10); // Last 10 digits
    const existingAuthUser = authUsers?.users?.find(u => {
      if (!u.email) return false;
      // Match exact email or phone-pattern in email
      if (u.email === studentEmail) return true;
      // Also catch variants like +91xxxx@student.loan.app
      if (u.email.endsWith('@student.loan.app') && u.email.includes(phonePattern)) return true;
      return false;
    });

    let userId: string

    if (existingAuthUser) {
      userId = existingAuthUser.id
      console.log('👤 Found existing auth user:', userId, 'email:', existingAuthUser.email)
      
      // If the existing user has a different email format, update it to the canonical one
      if (existingAuthUser.email !== studentEmail) {
        console.log('🔄 Updating auth user email from', existingAuthUser.email, 'to', studentEmail)
        // Note: We can't easily update auth user email, so we'll use the existing one
        // The student table email should be authoritative
      }
    } else {
      // Create auth user with a random password (phone-based login, no password needed)
      const randomPassword = crypto.randomUUID()
      
      console.log('🆕 Creating new auth user with email:', studentEmail)
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          name: studentName,
          phone: cleanPhone,
          role: 'student'
        }
      })

      if (authError) {
        // Handle case where user already exists (race condition or missed in search)
        if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
          console.log('⚠️ Auth user creation failed - user may already exist, trying to find them')
          const retryUser = authUsers?.users?.find(u => u.email?.includes(phonePattern))
          if (retryUser) {
            userId = retryUser.id
            console.log('✅ Found existing user on retry:', userId)
          } else {
            console.error('Error creating auth user:', authError)
            return new Response(
              JSON.stringify({ success: false, error: 'Could not create user account' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          console.error('Error creating auth user:', authError)
          return new Response(
            JSON.stringify({ success: false, error: 'Could not create user account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        userId = authData.user.id
        console.log('✅ Created new auth user:', userId)

        // Create app_users entry
        const { error: appUserError } = await supabase
          .from('app_users')
          .upsert({
            id: userId,
            email: studentEmail,
            role: 'student',
            is_active: true,
          }, { onConflict: 'id' })

        if (appUserError) {
          console.error('Error creating app_user:', appUserError)
        }
      }
    }

    // Generate a magic link / session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: studentEmail,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard/student`
      }
    })

    if (sessionError) {
      console.error('Error generating session:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Could not create login session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token from the magic link
    const linkUrl = new URL(sessionData.properties.action_link)
    const token = linkUrl.searchParams.get('token')
    const tokenType = linkUrl.searchParams.get('type')

    console.log('🎉 OTP verification successful:', { phone: cleanPhone, isNewUser, hasLead })

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        hasLead, // KB: Return whether student has an existing lead
        student: {
          id: studentId,
          name: studentName,
          email: studentEmail,
          phone: cleanPhone,
        },
        auth: {
          userId,
          email: studentEmail,
          token,
          tokenType,
          actionLink: sessionData.properties.action_link
        },
        // KB: Clear message for "no lead" state
        message: hasLead 
          ? 'Welcome back! Your application is ready.'
          : 'Welcome! Start your loan application now.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
