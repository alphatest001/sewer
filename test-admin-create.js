import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateUser() {
  console.log('🔐 Logging in as admin...');

  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'alphatestteam01@gmail.com',
    password: 'Itachi@9887',
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in successfully');
  console.log('📋 Session token:', authData.session.access_token.substring(0, 30) + '...');

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Failed to get profile:', profileError.message);
  } else {
    console.log('👤 User profile:', profile);
  }

  // Get a city ID
  const { data: cities, error: cityError } = await supabase
    .from('cities')
    .select('id, name')
    .limit(1);

  if (cityError || !cities || cities.length === 0) {
    console.error('❌ No cities found');
    return;
  }

  const cityId = cities[0].id;
  console.log(`🏙️  Using city: ${cities[0].name} (${cityId})`);

  // Try to create a user
  console.log('\n📝 Attempting to create user...');

  const testEmail = `test-${Date.now()}@example.com`;
  const requestBody = {
    email: testEmail,
    password: 'test123456',
    fullName: 'Test User',
    role: 'employee',
    cityId: cityId
  };

  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: requestBody
    });

    console.log('\n📥 Response received:');
    console.log('Data:', data);
    console.log('Error:', error);

    if (error) {
      console.error('\n❌ Edge Function Error Details:');
      console.error('Message:', error.message);
      console.error('Status:', error.status);
      console.error('Context:', error.context);

      // Try to get more error details
      if (error.context && error.context.body) {
        try {
          const errorBody = error.context.body;
          console.log('Error body:', errorBody);
        } catch (e) {
          console.log('Could not parse error body');
        }
      }
    }

    if (data) {
      if (data.success) {
        console.log('✅ User created successfully!');
        console.log('User ID:', data.userId);
      } else {
        console.log('❌ Creation failed:', data.error);
      }
    }
  } catch (err) {
    console.error('\n❌ Exception thrown:', err.message);
    console.error('Full error:', err);
  }

  // Logout
  await supabase.auth.signOut();
}

testCreateUser();
