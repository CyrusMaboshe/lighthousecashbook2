/**
 * Test script to verify jonahdjbreezy@gmail.com login functionality
 * This can be run in the browser console to test the login process
 */

import { authenticateUser } from '@/services/authService';
import { clearMultiTenantSessions, forceCleanSessionForJonah } from '@/utils/sessionCleanup';

/**
 * Test jonahdjbreezy@gmail.com login functionality
 */
export async function testJonahLogin(): Promise<void> {
  console.log('🧪 Testing jonahdjbreezy@gmail.com login functionality...');
  
  try {
    // Step 1: Clear any existing sessions
    console.log('🧹 Step 1: Clearing existing sessions...');
    forceCleanSessionForJonah();
    
    // Step 2: Test authentication
    console.log('🔐 Step 2: Testing authentication...');
    const user = await authenticateUser('jonahdjbreezy@gmail.com', 'titanium');
    
    if (user) {
      console.log('✅ Authentication successful!');
      console.log('👤 User details:', {
        email: user.email,
        username: user.username,
        role: user.role,
        id: user.id
      });
      
      // Step 3: Test session storage
      console.log('💾 Step 3: Testing session storage...');
      localStorage.setItem('lighthouse-current-user', JSON.stringify(user));
      const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lighthouse-session-expiry', expiryTime.toString());
      
      console.log('✅ Session stored successfully!');
      
      // Step 4: Verify no multi-tenant interference
      console.log('🔍 Step 4: Checking for multi-tenant interference...');
      const mtSession = localStorage.getItem('mt_user_session');
      if (mtSession) {
        console.log('⚠️ Multi-tenant session found, clearing...');
        clearMultiTenantSessions();
      } else {
        console.log('✅ No multi-tenant interference detected');
      }
      
      console.log('🎉 All tests passed! jonahdjbreezy@gmail.com login is working correctly.');
      console.log('🔄 Reload the page to see the dashboard.');
      
    } else {
      console.log('❌ Authentication failed!');
      console.log('🔍 Check if the user exists in the database or if credentials are correct.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Test function that can be called from browser console
 */
export function runJonahLoginTest(): void {
  testJonahLogin().catch(console.error);
}

/**
 * Quick test to check current authentication state
 */
export function checkAuthState(): void {
  console.log('🔍 Current Authentication State:');
  console.log('📱 Existing System Session:', localStorage.getItem('lighthouse-current-user') ? 'EXISTS' : 'MISSING');
  console.log('🏢 Multi-Tenant Session:', localStorage.getItem('mt_user_session') ? 'EXISTS' : 'MISSING');
  
  const existingUser = localStorage.getItem('lighthouse-current-user');
  if (existingUser) {
    try {
      const user = JSON.parse(existingUser);
      console.log('👤 Current User:', user.email, '(' + user.role + ')');
    } catch (error) {
      console.log('❌ Error parsing existing user session');
    }
  }
  
  const mtUser = localStorage.getItem('mt_user_session');
  if (mtUser) {
    try {
      const user = JSON.parse(mtUser);
      console.log('🏢 MT User:', user.email, '(' + user.role + ')');
    } catch (error) {
      console.log('❌ Error parsing MT user session');
    }
  }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testJonahLogin = runJonahLoginTest;
  (window as any).checkAuthState = checkAuthState;
  (window as any).clearMTSessions = clearMultiTenantSessions;
  (window as any).forceCleanJonah = forceCleanSessionForJonah;
}
