import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePartnerRequest {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  partnerCode: string
}

Deno.serve(async (req) => {
  console.log('Create Partner with Auth function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { name, email, password, phone, address, partnerCode }: CreatePartnerRequest = await req.json()

    console.log('Creating partner with code:', partnerCode)

    // Enhanced input validation
    if (!name || !email || !password || !partnerCode) {
      console.log('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password, and partnerCode are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email)
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      console.log('Password too weak')
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate partner code format (alphanumeric only)
    const partnerCodeRegex = /^[a-z0-9]+$/
    if (!partnerCodeRegex.test(partnerCode)) {
      console.log('Invalid partner code format:', partnerCode)
      return new Response(
        JSON.stringify({ error: 'Partner code must contain only lowercase letters and numbers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if partner code already exists
    const { data: existingPartner, error: checkError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('partner_code', partnerCode)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing partner code:', checkError)
      return new Response(
        JSON.stringify({ error: 'Database error while checking partner code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingPartner) {
      console.log('Partner code already exists:', partnerCode)
      return new Response(
        JSON.stringify({ error: 'Partner code already exists. Please choose a different code.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users?.find(user => user.email === email)
    
    if (existingUser) {
      console.log('Email already registered')
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create auth user first
    console.log('Creating auth user for:', email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'partner',
        partner_code: partnerCode,
        name: name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user account: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created with ID:', authUser.user.id)

    // Create partner record
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert({
        name,
        email,
        phone: phone || null,
        address: address || null,
        partner_code: partnerCode,
        is_active: true,
      })
      .select()
      .single()

    if (partnerError) {
      console.error('Error creating partner:', partnerError)
      // If partner creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create partner: ${partnerError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Partner created with ID:', partner.id)

    // Create app_users record linking auth user to partner
    const { error: appUserError } = await supabaseAdmin
      .from('app_users')
      .insert({
        id: authUser.user.id,
        email: email,
        role: 'partner',
        partner_id: partner.id,
        is_active: true,
      })

    if (appUserError) {
      console.error('Error creating app_users record:', appUserError)
      // Clean up on error
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('partners').delete().eq('id', partner.id)
      return new Response(
        JSON.stringify({ error: `Failed to link user to partner: ${appUserError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully created partner with auth')

    // Generate dashboard URL - use the current origin or fallback
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://lovableproject.com'
    const dashboardUrl = `${origin}/partner/${partnerCode}`
    
    console.log('Generated dashboard URL:', dashboardUrl)

    return new Response(
      JSON.stringify({
        success: true,
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          partner_code: partner.partner_code,
          dashboard_url: dashboardUrl
        },
        credentials: {
          email: email,
          password: password // In production, you might not want to return this
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})