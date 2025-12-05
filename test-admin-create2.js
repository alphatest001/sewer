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

  // Get a city ID
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .limit(1);

  const cityId = cities[0].id;
  console.log(`🏙️  Using city: ${cities[0].name}`);

  // Try to create a user using raw fetch to get error details
  console.log('\n📝 Attempting to create user...');

  const testEmail = `test-${Date.now()}@example.com`;
  const requestBody = {
    email: testEmail,
    password: 'test123456',
    fullName: 'Test User',
    role: 'employee',
    cityId: cityId
  };

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('\n📥 Response body:');
    console.log(responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }

  } catch (err) {
    console.error('\n❌ Exception:', err.message);
  }

  // Logout
  await supabase.auth.signOut();
}

testCreateUser();
