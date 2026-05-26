// Test script to check existing users and create test users if needed
import { createClient } from '@supabase/supabase-js';

async function checkAndCreateTestUsers() {
  console.log('🔍 Checking existing users...');

  try {
    // Check existing users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users?.length || 0} existing users:`);
    users?.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    // Create test users if none exist
    if (!users || users.length === 0) {
      console.log('🔧 Creating test users...');

      const testUsers = [
        {
          username: 'admin',
          email: 'admin@lighthouse.com',
          password_hash: 'admin123', // In production, this should be properly hashed
          role: 'admin'
        },
        {
          username: 'testuser',
          email: 'user@lighthouse.com',
          password_hash: 'user123', // In production, this should be properly hashed
          role: 'user'
        }
      ];

      for (const user of testUsers) {
        const { data, error: insertError } = await supabase
          .from('users')
          .insert(user)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Error creating user ${user.username}:`, insertError);
        } else {
          console.log(`✅ Created user: ${user.username} (${user.email})`);
        }
      }
    }

    console.log('\n🔑 Test Login Credentials:');
    console.log('Admin: admin@lighthouse.com / admin123');
    console.log('User: user@lighthouse.com / user123');
    console.log('\n🌐 Application URL: http://localhost:8081');

  } catch (error) {
    console.error('Error in test setup:', error);
  }
}

checkAndCreateTestUsers();