import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  // Login as admin
  console.log('Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'alphatestteam01@gmail.com',
    password: 'Itachi@9887',
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  console.log('✓ Logged in');
  console.log('Access Token:', authData.session.access_token.substring(0, 30) + '...\n');

  // Call Edge Function and capture full response
  console.log('Calling Edge Function...');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'test123456',
        fullName: 'Debug Test User',
        role: 'employee',
        cityId: 'e8d76c19-0de4-4d11-97d0-1968f3c3eac5',
      }),
    });

    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Body:', responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('Parsed JSON:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }

  await supabase.auth.signOut();
}

debug();
