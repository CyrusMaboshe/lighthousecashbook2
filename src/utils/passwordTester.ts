import { hashPassword } from './passwordUtils';
import { supabase } from '@/integrations/supabase/client';

// Common passwords to test
const commonPasswords = [
  'titanium',
  'password',
  '123456',
  'admin',
  'user',
  'test',
  'lighthouse',
  'cyrus',
  'henry',
  'dence',
  'confidence',
  'kangila',
  'maboshe',
  'password123',
  'admin123',
  'user123'
];

export const testUserPasswords = async (email: string) => {
  try {
    console.log(`Testing passwords for: ${email}`);
    
    // Get user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (error || !users || users.length === 0) {
      console.log('User not found in database');
      return null;
    }

    const user = users[0];
    console.log(`Found user: ${user.username}`);
    console.log(`Stored hash: ${user.password_hash}`);

    // Test each common password
    for (const password of commonPasswords) {
      const hashedPassword = await hashPassword(password);
      console.log(`Testing password "${password}": ${hashedPassword}`);
      
      if (hashedPassword === user.password_hash) {
        console.log(`✅ MATCH FOUND! Password for ${email} is: "${password}"`);
        return password;
      }
    }

    console.log('❌ No matching password found from common passwords');
    return null;
  } catch (error) {
    console.error('Error testing passwords:', error);
    return null;
  }
};

export const testAllFailingUsers = async () => {
  const failingEmails = [
    'cofidencekangila3@gmail.com',
    'cyrus@gmail.com', 
    'henry@gmail.com'
  ];

  console.log('=== TESTING PASSWORDS FOR FAILING USERS ===');
  
  for (const email of failingEmails) {
    console.log(`\n--- Testing ${email} ---`);
    const password = await testUserPasswords(email);
    if (password) {
      console.log(`✅ ${email} can login with password: "${password}"`);
    } else {
      console.log(`❌ ${email} - no working password found`);
    }
  }
};

// Function to manually test a specific password for a user
export const testSpecificPassword = async (email: string, password: string) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (error || !users || users.length === 0) {
      return false;
    }

    const user = users[0];
    const hashedPassword = await hashPassword(password);
    
    console.log(`Testing ${email} with password "${password}"`);
    console.log(`Stored hash: ${user.password_hash}`);
    console.log(`Input hash:  ${hashedPassword}`);
    console.log(`Match: ${hashedPassword === user.password_hash}`);
    
    return hashedPassword === user.password_hash;
  } catch (error) {
    console.error('Error testing specific password:', error);
    return false;
  }
};
