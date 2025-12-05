import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djeauecionobyhdmjlnb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWF1ZWNpb25vYnloZG1qbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTU5ODYsImV4cCI6MjA4MDM5MTk4Nn0.GmxRAE9J34KAydV4jksa79Atm6wIP7r45OZ7hmcc58w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const ADMIN_EMAIL = 'alphatestteam01@gmail.com';
const ADMIN_PASSWORD = 'Itachi@9887';
const CITY_ID = 'e8d76c19-0de4-4d11-97d0-1968f3c3eac5'; // Surat
const TEST_EMAIL = `test-${Date.now()}@example.com`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function pass(message) {
  log(colors.green, '✓', message);
}

function fail(message) {
  log(colors.red, '✗', message);
}

function info(message) {
  log(colors.cyan, 'ℹ', message);
}

function section(message) {
  console.log(`\n${colors.blue}═══ ${message} ═══${colors.reset}\n`);
}

async function runTests() {
  let adminSession = null;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  try {
    section('STEP 1: Login as Admin');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError) {
      fail(`Failed to login as admin: ${authError.message}`);
      process.exit(1);
    }

    adminSession = authData.session;
    pass(`Logged in as admin: ${ADMIN_EMAIL}`);
    info(`JWT Token obtained: ${adminSession.access_token.substring(0, 20)}...`);

    // Test 1: Missing Authorization Header
    section('TEST 1: Missing Authorization Header');
    testResults.total++;
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'test123',
          fullName: 'Test User',
          role: 'employee',
          cityId: CITY_ID,
        }),
      });

      const result = await response.json();

      if (response.status === 401 && result.success === false) {
        pass('Correctly rejected request without auth token (401)');
        info(`Error message: ${result.error}`);
        testResults.passed++;
      } else {
        fail(`Expected 401 status, got ${response.status}`);
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 2: Missing Required Fields
    section('TEST 2: Missing Required Fields');
    testResults.total++;
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: TEST_EMAIL,
          // Missing password, fullName, role, cityId
        },
      });

      if (!data?.success && data?.error) {
        pass('Correctly rejected request with missing fields');
        info(`Error message: ${data.error}`);
        testResults.passed++;
      } else {
        fail('Should have rejected request with missing fields');
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 3: Password Too Short
    section('TEST 3: Password Too Short (< 6 characters)');
    testResults.total++;
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: TEST_EMAIL,
          password: '123',
          fullName: 'Test User',
          role: 'employee',
          cityId: CITY_ID,
        },
      });

      if (!data?.success && data?.error && data.error.includes('6 characters')) {
        pass('Correctly rejected password < 6 characters');
        info(`Error message: ${data.error}`);
        testResults.passed++;
      } else {
        fail('Should have rejected short password');
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 4: Invalid Role
    section('TEST 4: Invalid Role');
    testResults.total++;
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: TEST_EMAIL,
          password: 'test123456',
          fullName: 'Test User',
          role: 'admin', // Should not be allowed
          cityId: CITY_ID,
        },
      });

      if (!data?.success && data?.error && data.error.includes('Invalid role')) {
        pass('Correctly rejected invalid role (admin)');
        info(`Error message: ${data.error}`);
        testResults.passed++;
      } else {
        fail('Should have rejected admin role');
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 5: Create Valid User
    section('TEST 5: Create Valid User (Happy Path)');
    testResults.total++;
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: TEST_EMAIL,
          password: 'test123456',
          fullName: 'Test User',
          role: 'employee',
          cityId: CITY_ID,
        },
      });

      if (error) {
        fail(`Edge Function error: ${error.message}`);
        testResults.failed++;
      } else if (data?.success) {
        pass('Successfully created user!');
        info(`User ID: ${data.userId}`);
        info(`Email: ${data.email}`);
        testResults.passed++;

        // Verify user in database
        section('TEST 5a: Verify User in Database');
        testResults.total++;
        const { data: userData, error: queryError } = await supabase
          .from('users')
          .select('id, email, full_name, role, city_id')
          .eq('email', TEST_EMAIL)
          .single();

        if (queryError) {
          fail(`Failed to query user: ${queryError.message}`);
          testResults.failed++;
        } else if (userData) {
          pass('User found in database!');
          info(`ID: ${userData.id}`);
          info(`Email: ${userData.email}`);
          info(`Full Name: ${userData.full_name}`);
          info(`Role: ${userData.role}`);
          info(`City ID: ${userData.city_id}`);
          testResults.passed++;
        } else {
          fail('User not found in database');
          testResults.failed++;
        }
      } else {
        fail(`Creation failed: ${data?.error || 'Unknown error'}`);
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 6: Duplicate Email
    section('TEST 6: Duplicate Email');
    testResults.total++;
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: TEST_EMAIL, // Same email as Test 5
          password: 'test123456',
          fullName: 'Another User',
          role: 'customer',
          cityId: CITY_ID,
        },
      });

      if (!data?.success && data?.error && (data.error.includes('already') || data.error.includes('exists'))) {
        pass('Correctly rejected duplicate email');
        info(`Error message: ${data.error}`);
        testResults.passed++;
      } else {
        fail('Should have rejected duplicate email');
        testResults.failed++;
      }
    } catch (error) {
      fail(`Test failed with exception: ${error.message}`);
      testResults.failed++;
    }

    // Test 7: Non-Admin User Cannot Create Users
    section('TEST 7: Non-Admin Authorization Check');
    info('Creating a test employee user to verify non-admin cannot create users...');

    const employeeEmail = `employee-${Date.now()}@example.com`;
    const { data: empCreateData } = await supabase.functions.invoke('create-user', {
      body: {
        email: employeeEmail,
        password: 'employee123',
        fullName: 'Test Employee',
        role: 'employee',
        cityId: CITY_ID,
      },
    });

    if (empCreateData?.success) {
      pass(`Created employee user: ${employeeEmail}`);

      // Logout admin and login as employee
      await supabase.auth.signOut();
      const { data: empAuthData } = await supabase.auth.signInWithPassword({
        email: employeeEmail,
        password: 'employee123',
      });

      if (empAuthData?.session) {
        pass('Logged in as employee');

        testResults.total++;
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: `test-${Date.now()}@example.com`,
            password: 'test123456',
            fullName: 'Should Fail',
            role: 'customer',
            cityId: CITY_ID,
          },
        });

        if (!data?.success && data?.error && data.error.includes('Admin access required')) {
          pass('Correctly rejected non-admin user (403 Forbidden)');
          info(`Error message: ${data.error}`);
          testResults.passed++;
        } else {
          fail('Should have rejected non-admin user');
          testResults.failed++;
        }

        // Logout employee and login back as admin
        await supabase.auth.signOut();
        await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
      }
    }

    // Cleanup: Delete test users
    section('CLEANUP: Deleting Test Users');
    info('Cleaning up test users from database...');

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .or(`email.eq.${TEST_EMAIL},email.eq.${employeeEmail}`);

    if (deleteError) {
      info(`Note: Could not clean up test users (this is okay): ${deleteError.message}`);
    } else {
      pass('Test users cleaned up successfully');
    }

  } catch (error) {
    fail(`Unexpected error: ${error.message}`);
    console.error(error);
  } finally {
    // Logout
    await supabase.auth.signOut();
  }

  // Print Summary
  section('TEST SUMMARY');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\n${colors.cyan}Success Rate: ${successRate}%${colors.reset}\n`);

  if (testResults.failed === 0) {
    console.log(`${colors.green}╔══════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✓ ALL TESTS PASSED SUCCESSFULLY!  ║${colors.reset}`);
    console.log(`${colors.green}╚══════════════════════════════════════╝${colors.reset}\n`);
  } else {
    console.log(`${colors.red}╔══════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ✗ SOME TESTS FAILED                ║${colors.reset}`);
    console.log(`${colors.red}╚══════════════════════════════════════╝${colors.reset}\n`);
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests
runTests();
