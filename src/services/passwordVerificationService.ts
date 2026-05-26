
import { hashPassword } from '@/utils/passwordUtils';
import { findUserByEmail } from './userService';
import { authenticateUser } from './authService';

export const verifyUserPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('=== PASSWORD VERIFICATION ===');
    console.log('Verifying password for email:', email);
    
    // Use the same authentication logic as login to ensure consistency
    const authenticatedUser = await authenticateUser(email.toLowerCase(), password);
    
    if (authenticatedUser) {
      console.log('✅ Password verification successful using authentication service!');
      return true;
    } else {
      console.log('❌ Password verification failed - authentication service returned null');
      return false;
    }
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
};
