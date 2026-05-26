import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from './passwordUtils';

export const createTestUser = async () => {
  try {
    console.log('Creating test user...');
    
    const testUserEmail = 'testuser@lighthouse.com';
    const testUserPassword = 'test123';
    const testUsername = 'Test User';
    
    // Check if test user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUserEmail);
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      return null;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Test user already exists:', existingUsers[0]);
      return existingUsers[0];
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(testUserPassword);
    console.log('Hashed password for test user:', hashedPassword);
    
    // Create the test user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: testUsername,
        email: testUserEmail,
        password_hash: hashedPassword,
        role: 'user',
        is_admin: false
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating test user:', createError);
      return null;
    }
    
    console.log('✅ Test user created successfully:', newUser);
    console.log('📧 Email:', testUserEmail);
    console.log('🔑 Password:', testUserPassword);
    
    return newUser;
  } catch (error) {
    console.error('Error in createTestUser:', error);
    return null;
  }
};

export const createMultipleTestUsers = async () => {
  const testUsers = [
    {
      username: 'John Doe',
      email: 'john@lighthouse.com',
      password: 'john123'
    },
    {
      username: 'Jane Smith',
      email: 'jane@lighthouse.com',
      password: 'jane123'
    },
    {
      username: 'Mike Johnson',
      email: 'mike@lighthouse.com',
      password: 'mike123'
    }
  ];
  
  const createdUsers = [];
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email);
      
      if (checkError) {
        console.error(`Error checking for existing user ${user.email}:`, checkError);
        continue;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${user.email} already exists`);
        createdUsers.push(existingUsers[0]);
        continue;
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(user.password);
      
      // Create the user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: user.username,
          email: user.email,
          password_hash: hashedPassword,
          role: 'user',
          is_admin: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`Error creating user ${user.email}:`, createError);
        continue;
      }
      
      console.log(`✅ User created: ${user.email} (password: ${user.password})`);
      createdUsers.push(newUser);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
  
  return createdUsers;
};

// Function to verify a user's password (for testing)
export const testUserLogin = async (email: string, password: string) => {
  try {
    console.log(`Testing login for ${email} with password ${password}`);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error finding user:', error);
      return false;
    }
    
    if (!user) {
      console.log('User not found');
      return false;
    }
    
    const hashedInputPassword = await hashPassword(password);
    console.log('Stored hash:', user.password_hash);
    console.log('Input hash:', hashedInputPassword);
    
    const match = user.password_hash === hashedInputPassword;
    console.log('Password match:', match);
    
    return match;
  } catch (error) {
    console.error('Error testing login:', error);
    return false;
  }
};

// Export test credentials for easy reference
export const TEST_USERS = [
  { email: 'testuser@lighthouse.com', password: 'test123', username: 'Test User' },
  { email: 'john@lighthouse.com', password: 'john123', username: 'John Doe' },
  { email: 'jane@lighthouse.com', password: 'jane123', username: 'Jane Smith' },
  { email: 'mike@lighthouse.com', password: 'mike123', username: 'Mike Johnson' }
];
