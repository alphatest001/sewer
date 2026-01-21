import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  role: 'supervisor' | 'customer';
  cityId: string;
}

// Helper function to generate random password
function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to generate user ID based on role
async function generateUserId(supabase: any, role: string): Promise<string> {
  let prefix = '';
  switch (role) {
    case 'supervisor':
      prefix = 'SUP';
      break;
    case 'customer':
      prefix = 'CUST';
      break;
    default:
      prefix = 'USER';
  }

  // Find the next available number (use ilike for case-insensitive matching)
  const { data: existingUsers } = await supabase
    .from('users')
    .select('email')
    .ilike('email', `${prefix}%@varman.local`)
    .order('email', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (existingUsers && existingUsers.length > 0) {
    const lastEmail = existingUsers[0].email;
    const match = lastEmail.match(/(\d+)@/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization header to verify caller
    const authHeader = req.headers.get('authorization');

    // Verify the caller is authenticated
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify JWT and get user using service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'User profile not found', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Parse and validate request body
    const body: CreateUserRequest = await req.json();

    if (!body.fullName || !body.role || !body.cityId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate role
    if (body.role !== 'supervisor' && body.role !== 'customer') {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be supervisor or customer', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate user ID and password
    const userId = await generateUserId(supabase, body.role);
    const email = `${userId}@varman.local`.toLowerCase(); // Ensure lowercase to match Supabase auth behavior
    const password = generatePassword(8);

    console.log(`[CREATE-USER] Generated credentials - Email: ${email}, Password: ${password}`);

    // Create auth user with metadata
    // Note: A database trigger automatically creates the user profile using user_metadata
    console.log(`[CREATE-USER] Creating auth user for email: ${email}`);
    const { data: authUser, error: authCreateError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName,
        role: body.role,
        city_id: body.cityId,  // ✅ Store city_id in auth metadata for instant access
      }
    });

    if (authCreateError) {
      console.error('[CREATE-USER] Auth creation error:', authCreateError.message);
      // Check if it's a duplicate email error
      if (authCreateError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Email already exists', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }
      throw new Error(`Auth error: ${authCreateError.message}`);
    }

    if (!authUser.user) {
      console.error('[CREATE-USER] No user returned from auth.admin.createUser');
      throw new Error('Failed to create auth user');
    }

    console.log(`[CREATE-USER] Auth user created with ID: ${authUser.user.id}`);

    // Update the user profile with city_id and temp_password (trigger creates the profile but doesn't set these)
    console.log(`[CREATE-USER] Updating profile to set city_id and temp_password`);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        city_id: body.cityId,
        temp_password: password  // Store password for admin display
      })
      .eq('id', authUser.user.id);

    if (updateError) {
      console.error('[CREATE-USER] Failed to update profile:', updateError.message);
      // Clean up auth user if profile update fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to set city and password for user: ${updateError.message}`);
    }

    console.log(`[CREATE-USER] ✅ User created successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        userId: authUser.user.id,
        email: email,
        password: password,
        userIdDisplay: userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-user function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
