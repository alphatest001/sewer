import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 MANUAL USER CREATION TEST\n');

async function test() {
  // Login as admin
  console.log('1️⃣  Logging in as admin...');
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'alphatestteam01@gmail.com',
    password: 'Itachi@9887',
  });
  console.log('   ✅ Logged in successfully\n');

  // Create a unique email
  const testEmail = `testuser-${Date.now()}@example.com`;
  console.log(`2️⃣  Creating user: ${testEmail}`);
  console.log('   Password: test123456');
  console.log('   Role: employee');
  console.log('   City: Surat\n');

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: testEmail,
      password: 'test123456',
      fullName: 'Test User Manual',
      role: 'employee',
      cityId: 'e8d76c19-0de4-4d11-97d0-1968f3c3eac5',
    },
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Full error:', error);
    return;
  }

  if (data?.success) {
    console.log('   ✅ USER CREATED SUCCESSFULLY!');
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Email: ${data.email}\n`);

    // Verify user in database
    console.log('3️⃣  Verifying user in database...');
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userData) {
      console.log('   ✅ User found in database:');
      console.log(`   - ID: ${userData.id}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Full Name: ${userData.full_name}`);
      console.log(`   - Role: ${userData.role}`);
      console.log(`   - City ID: ${userData.city_id}\n`);

      // Cleanup
      console.log('4️⃣  Cleaning up test user...');
      await supabase.from('users').delete().eq('id', userData.id);
      console.log('   ✅ Cleanup complete\n');

      console.log('╔══════════════════════════════════════╗');
      console.log('║  🎉 ALL TESTS PASSED! SYSTEM WORKS! ║');
      console.log('╚══════════════════════════════════════╝');
    } else {
      console.log('   ❌ User NOT found in database');
    }
  } else {
    console.log('   ❌ Creation failed:', data?.error || 'Unknown error');
  }

  await supabase.auth.signOut();
}

test().catch(console.error);
