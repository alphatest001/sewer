// Script to create admin user using Supabase Admin API
// Run this with: node create-admin.js

const { createClient } = require('@supabase/supabase-js');

// Get these from your Supabase project settings > API
const SUPABASE_URL = 'https://djeauecionobyhdmjlnb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace with actual service role key

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create user with admin metadata
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@varman.com',
      password: 'Admin@123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin',
        role: 'admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@varman.com');
    console.log('Password: Admin@123');
    console.log('User ID:', data.user.id);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createAdminUser();
