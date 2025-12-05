import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginError() {
  console.log('=== Testing Login Error Messages ===\n');

  // Test 1: Wrong email
  console.log('Test 1: Login with wrong email (shharsh41@gmail.com)');
  const { data: data1, error: error1 } = await supabase.auth.signInWithPassword({
    email: 'shharsh41@gmail.com',
    password: 'Itachi@9887',
  });

  if (error1) {
    console.log('✅ Error caught:', error1.message);
    console.log('   Error status:', error1.status);
  } else {
    console.log('❌ No error - login succeeded unexpectedly');
  }

  console.log('\nTest 2: Login with correct email (shharsh@gmail.com)');
  const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
    email: 'shharsh@gmail.com',
    password: 'Itachi@9887',
  });

  if (error2) {
    console.log('✅ Error caught:', error2.message);
    console.log('   Error status:', error2.status);
  } else {
    console.log('✅ Login succeeded!');
    console.log('   User:', data2.user.email);

    // Get user metadata
    console.log('   User metadata:', JSON.stringify(data2.user.user_metadata, null, 2));

    // Sign out
    await supabase.auth.signOut();
  }

  console.log('\nTest 3: Login with wrong password');
  const { data: data3, error: error3 } = await supabase.auth.signInWithPassword({
    email: 'shharsh@gmail.com',
    password: 'WrongPassword123',
  });

  if (error3) {
    console.log('✅ Error caught:', error3.message);
    console.log('   Error status:', error3.status);
  } else {
    console.log('❌ No error - login succeeded unexpectedly');
  }
}

testLoginError();
