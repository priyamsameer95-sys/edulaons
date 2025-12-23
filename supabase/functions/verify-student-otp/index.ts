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
    
    console.log('OTP verification request:', { phone, otp: otp ? '****' : 'missing', name })

    // Validate inputs
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    // Validate OTP (hardcoded for now)
    if (otp !== VALID_OTP) {
      console.log('Invalid OTP provided')
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
      .select('id, email, name, phone')
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

    if (existingStudent) {
      // Existing student - use their details
      console.log('Found existing student:', existingStudent.id)
      studentId = existingStudent.id
      studentName = existingStudent.name
      
      // IMPORTANT: Check if email needs to be updated (placeholder emails)
      if (existingStudent.email.includes('placeholder') || existingStudent.email.includes('@lead.')) {
        // Generate proper auth email
        studentEmail = `${cleanPhone}@student.loan.app`
        console.log('Updating placeholder email to:', studentEmail)
        
        // Update student email in database
        await supabase
          .from('students')
          .update({ email: studentEmail })
          .eq('id', studentId)
        
        console.log('Updated student email from placeholder')
      } else {
        studentEmail = existingStudent.email
      }
    } else {
      // New student - create one
      isNewUser = true
      const generatedEmail = `${cleanPhone}@student.loan.app`
      studentName = name || `Student ${cleanPhone.slice(-4)}`
      
      console.log('Creating new student with email:', generatedEmail)
      
      const { data: newStudent, error: createStudentError } = await supabase
        .from('students')
        .insert({
          phone: cleanPhone,
          email: generatedEmail,
          name: studentName,
        })
        .select('id, email, name')
        .single()

      if (createStudentError) {
        console.error('Error creating student:', createStudentError)
        return new Response(
          JSON.stringify({ success: false, error: 'Could not create student profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      studentId = newStudent.id
      studentEmail = newStudent.email
    }

    // Check if auth user exists for this email
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email === studentEmail)

    let userId: string

    if (existingAuthUser) {
      userId = existingAuthUser.id
      console.log('Found existing auth user:', userId)
    } else {
      // Create auth user with a random password (phone-based login, no password needed)
      const randomPassword = crypto.randomUUID()
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: randomPassword,
        email_confirm: true, // Auto-confirm since we verified via OTP
        user_metadata: {
          name: studentName,
          phone: cleanPhone,
          role: 'student'
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return new Response(
          JSON.stringify({ success: false, error: 'Could not create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = authData.user.id
      console.log('Created new auth user:', userId)

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
        // Non-fatal, continue
      }
    }

    // Generate a magic link / session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: studentEmail,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/student/dashboard`
      }
    })

    if (sessionError) {
      console.error('Error generating session:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Could not create login session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token from the magic link to create a direct session
    const linkUrl = new URL(sessionData.properties.action_link)
    const token = linkUrl.searchParams.get('token')
    const tokenType = linkUrl.searchParams.get('type')

    console.log('OTP verification successful for:', cleanPhone, 'isNewUser:', isNewUser)

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        student: {
          id: studentId,
          name: studentName,
          email: studentEmail,
          phone: cleanPhone,
        },
        auth: {
          userId,
          email: studentEmail,
          // Return the verification token for the frontend to complete sign-in
          token,
          tokenType,
          actionLink: sessionData.properties.action_link
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
