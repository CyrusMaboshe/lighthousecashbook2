
import { hashPassword } from '@/utils/passwordUtils';
import { findUserByEmail } from './userService';
import { authenticateUser } from './authService';
import { SeparateMultiTenantAuth } from './separateMultiTenantAuth';

export const verifyUserPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('=== PASSWORD VERIFICATION ===');
    console.log('Verifying password for email:', email);
    
    // First try standard user authentication
    const authenticatedUser = await authenticateUser(email.toLowerCase(), password);
    
    if (authenticatedUser) {
      console.log('✅ Password verification successful using authentication service!');
      return true;
    }

    // Fallback: Try multi-tenant authentication
    console.log('🔍 Standard authentication failed, trying multi-tenant fallback...');
    const { user: mtUser } = await SeparateMultiTenantAuth.signIn(email.toLowerCase(), password);
    if (mtUser) {
      console.log('✅ Password verification successful using SeparateMultiTenantAuth!');
      return true;
    }

    console.log('❌ Password verification failed - no matching user in either auth service');
    return false;
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
};
