import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('=== DIAGNOSTIC TEST ===\n');

  // Login as admin
  console.log('1. Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'alphatestteam01@gmail.com',
    password: 'Itachi@9887',
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in as admin');
  console.log('   Admin user ID:', authData.user.id);

  // Check all users in public.users
  console.log('\n2. Checking public.users table...');
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, role');

  if (usersError) {
    console.error('❌ Error:', usersError.message);
  } else {
    console.log('   Users in database:');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role}) - ID: ${u.id}`);
    });
  }

  // Check all auth users (we can only see our own with anon key)
  console.log('\n3. Checking what auth users we can see...');
  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

  if (authUsersError) {
    console.error('   ❌ Cannot list users with anon key (expected):', authUsersError.message);
  } else {
    console.log('   Auth users:');
    authUsers.users.forEach(u => {
      console.log(`   - ${u.email} - ID: ${u.id}`);
    });
  }

  // Get a city
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .limit(1);

  const cityId = cities[0].id;

  // Make a request through the Edge Function to see what happens
  console.log('\n4. Calling create-user Edge Function...');
  console.log('   Using unique email:', `diagnostic-${Date.now()}@test.com`);

  const testEmail = `diagnostic-${Date.now()}@test.com`;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`,
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({
      email: testEmail,
      password: 'test123456',
      fullName: 'Diagnostic Test User',
      role: 'employee',
      cityId: cityId
    })
  });

  console.log('   Response status:', response.status);
  const responseText = await response.text();
  console.log('   Response body:', responseText);

  try {
    const responseJson = JSON.parse(responseText);
    console.log('\n   Parsed response:', JSON.stringify(responseJson, null, 2));

    if (responseJson.userId) {
      console.log('\n5. Verifying created user...');
      console.log('   User ID returned:', responseJson.userId);
      console.log('   Admin ID for comparison:', authData.user.id);
      console.log('   Are they the same?', responseJson.userId === authData.user.id ? '⚠️  YES - THIS IS THE PROBLEM!' : '✅ No');
    }
  } catch (e) {
    console.log('   Could not parse response as JSON');
  }

  await supabase.auth.signOut();
}

diagnose();
