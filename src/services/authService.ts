
import { User } from '@/types/auth';
import { hashPassword } from '@/utils/passwordUtils';
import { createUserInDatabase, findUserByEmail } from './userService';

const HARDCODED_ADMINS = [
  { email: 'jonahdjbreezy@gmail.com', username: 'Admin User', password: 'titanium' },
  { email: 'cyrusmaboshe@lighthouse.com', username: 'Cyrus Maboshe', password: 'titanium' }
];

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);

    // Check hardcoded admin credentials first
    console.log('Checking admin credentials...');
    const adminMatch = HARDCODED_ADMINS.find(
      admin => admin.email.toLowerCase() === email.toLowerCase() && admin.password === password
    );

    if (adminMatch) {
      console.log('✅ Admin credentials match!');

      // Check if this admin user exists in database, if not create them
      let existingUser = await findUserByEmail(email.toLowerCase());

      if (!existingUser) {
        console.log('Creating admin user in database...');
        const hashedPassword = await hashPassword(password);
        const dbUser = await createUserInDatabase(
          email.toLowerCase(),
          adminMatch.username,
          hashedPassword,
          'admin'
        );

        if (!dbUser) {
          console.error('Failed to create admin user in database');
          return null;
        }
        existingUser = dbUser;
      }

      const adminUser: User = {
        id: existingUser.id,
        username: existingUser.username,
        password: await hashPassword(password), // Use hash of successfully typed password
        role: existingUser.role as 'admin' | 'user',
        email: existingUser.email,
        is_super_admin: existingUser.is_super_admin || false
      };

      console.log('🔍 Admin user login data:', {
        email: adminUser.email,
        role: adminUser.role,
        is_super_admin: adminUser.is_super_admin,
        raw_is_super_admin: existingUser.is_super_admin
      });

      console.log('✅ Admin user logged in successfully');
      return adminUser;
    }

    // Check in Supabase users table for regular users
    console.log('Checking Supabase users table...');
    const user = await findUserByEmail(email.toLowerCase());

    if (user) {
      console.log('Found user in database:', user.username);
      console.log('User role:', user.role);
      console.log('User is_admin:', user.is_admin);
      console.log('User is_active:', user.is_active);

      // Check if user is active
      if (user.is_active === false) {
        console.log('❌ User account is deactivated');
        return null;
      }

      // Hash the input password for comparison
      const hashedInputPassword = await hashPassword(password);

      console.log('Comparing passwords...');
      console.log('Stored hash (first 20 chars):', user.password_hash?.substring(0, 20) + '...');
      console.log('Input hash (first 20 chars):', hashedInputPassword.substring(0, 20) + '...');

      // Compare hashed passwords
      if (user.password_hash === hashedInputPassword) {
        console.log('✅ Password match!');
        const authUser: User = {
          id: user.id,
          username: user.username,
          password: user.password_hash,
          role: user.role as 'admin' | 'user',
          email: user.email,
          profile_picture_url: user.profile_picture_url,
          is_super_admin: user.is_super_admin || false
        };

        console.log('🔍 User login data:', {
          email: authUser.email,
          role: authUser.role,
          is_super_admin: authUser.is_super_admin,
          raw_is_super_admin: user.is_super_admin
        });
        console.log('✅ Database user logged in successfully');
        return authUser;
      } else {
        console.log('❌ Password mismatch');
        console.log('Expected hash:', user.password_hash);
        console.log('Computed hash:', hashedInputPassword);
      }
    } else {
      console.log('❌ No user found with email:', email);
    }

    console.log('❌ Login failed - no matching user or password');
    return null;
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
};

// Add function to restore user session from localStorage
export const restoreUserSession = (): User | null => {
  try {
    const storedUser = localStorage.getItem('lighthouse-current-user');
    const sessionExpiry = localStorage.getItem('lighthouse-session-expiry');

    if (!storedUser || !sessionExpiry) {
      return null;
    }

    // Check if session has expired (24 hours by default)
    const expiryTime = parseInt(sessionExpiry);
    const currentTime = new Date().getTime();

    if (currentTime > expiryTime) {
      console.log('Session expired, clearing stored data');
      localStorage.removeItem('lighthouse-current-user');
      localStorage.removeItem('lighthouse-session-expiry');
      return null;
    }

    const user = JSON.parse(storedUser);
    console.log('✅ Restored user session:', user.username);
    return user;
  } catch (error) {
    console.error('Error restoring user session:', error);
    localStorage.removeItem('lighthouse-current-user');
    localStorage.removeItem('lighthouse-session-expiry');
    return null;
  }
};

// Add function to set session with expiry
export const setUserSession = (user: User): void => {
  try {
    localStorage.setItem('lighthouse-current-user', JSON.stringify(user));
    // Set session to expire in 7 days (7 * 24 * 60 * 60 * 1000 milliseconds)
    const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('lighthouse-session-expiry', expiryTime.toString());
    console.log('✅ User session stored with expiry');
  } catch (error) {
    console.error('Error storing user session:', error);
  }
};

// Add function to clear user session
export const clearUserSession = (): void => {
  localStorage.removeItem('lighthouse-current-user');
  localStorage.removeItem('lighthouse-session-expiry');
  console.log('✅ User session cleared');
};
