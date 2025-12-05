import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  // Login as admin
  console.log('1. Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'alphatestteam01@gmail.com',
    password: 'Itachi@9887',
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  console.log('✓ Logged in successfully');
  console.log('User ID:', authData.user.id);
  console.log('Email:', authData.user.email);

  // Check user profile
  console.log('\n2. Checking user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('✓ Profile found:');
    console.log(JSON.stringify(profile, null, 2));
  }

  // Test getUser
  console.log('\n3. Testing auth.getUser()...');
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('getUser error:', userError);
  } else {
    console.log('✓ getUser() successful:');
    console.log('User ID:', userData.user.id);
    console.log('Email:', userData.user.email);
  }

  // Try to call the Edge Function
  console.log('\n4. Calling create-user Edge Function...');
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      fullName: 'Debug Test User',
      role: 'employee',
      cityId: 'e8d76c19-0de4-4d11-97d0-1968f3c3eac5',
    },
  });

  if (error) {
    console.error('✗ Edge Function error:', error);
  } else {
    console.log('✓ Edge Function response:');
    console.log(JSON.stringify(data, null, 2));
  }

  await supabase.auth.signOut();
}

debug();
