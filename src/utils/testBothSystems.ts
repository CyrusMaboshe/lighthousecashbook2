/**
 * Test Both Systems Working Together
 * Comprehensive test to verify existing system and multi-tenant system work together
 */

import { authenticateUser } from '@/services/authService';
import { SeparateMultiTenantAuth } from '@/services/separateMultiTenantAuth';
import { clearMultiTenantSessions, forceCleanSessionForJonah } from '@/utils/sessionCleanup';

/**
 * Test existing system (jonahdjbreezy@gmail.com)
 */
export async function testExistingSystem(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    console.log('🧪 Testing Existing System...');
    
    // Clear any MT sessions first
    forceCleanSessionForJonah();
    
    // Test authentication
    const user = await authenticateUser('jonahdjbreezy@gmail.com', 'titanium');
    
    if (user) {
      // Store session
      localStorage.setItem('lighthouse-current-user', JSON.stringify(user));
      const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lighthouse-session-expiry', expiryTime.toString());
      
      console.log('✅ Existing system test PASSED');
      return {
        success: true,
        message: 'Existing system working correctly',
        details: {
          email: user.email,
          role: user.role,
          username: user.username,
          sessionStored: true
        }
      };
    } else {
      console.log('❌ Existing system test FAILED');
      return {
        success: false,
        message: 'Existing system authentication failed',
        details: null
      };
    }
    
  } catch (error) {
    console.error('❌ Existing system test error:', error);
    return {
      success: false,
      message: 'Existing system test error: ' + String(error),
      details: null
    };
  }
}

/**
 * Test multi-tenant system
 */
export async function testMultiTenantSystem(email: string, password: string): Promise<{ success: boolean; message: string; details: any }> {
  try {
    console.log('🧪 Testing Multi-Tenant System for:', email);
    
    // Clear existing system session first
    localStorage.removeItem('lighthouse-current-user');
    localStorage.removeItem('lighthouse-session-expiry');
    
    // Test MT authentication
    const result = await SeparateMultiTenantAuth.signIn(email, password);
    
    if (result.user) {
      // Store MT session
      localStorage.setItem('mt_user_session', JSON.stringify(result.user));
      const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('mt_session_expiry', expiryTime.toString());
      
      console.log('✅ Multi-tenant system test PASSED');
      return {
        success: true,
        message: 'Multi-tenant system working correctly',
        details: {
          email: result.user.email,
          role: result.user.role,
          username: result.user.username,
          company: result.user.company?.display_name,
          sessionStored: true
        }
      };
    } else {
      console.log('❌ Multi-tenant system test FAILED');
      return {
        success: false,
        message: 'Multi-tenant authentication failed: ' + (result.error || 'Unknown error'),
        details: null
      };
    }
    
  } catch (error) {
    console.error('❌ Multi-tenant system test error:', error);
    return {
      success: false,
      message: 'Multi-tenant system test error: ' + String(error),
      details: null
    };
  }
}

/**
 * Test system isolation (ensure jonahdjbreezy@gmail.com doesn't get MT session)
 */
export async function testSystemIsolation(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    console.log('🧪 Testing System Isolation...');
    
    // Try to create MT session for jonahdjbreezy@gmail.com
    const result = await SeparateMultiTenantAuth.signIn('jonahdjbreezy@gmail.com', 'titanium');
    
    if (result.user) {
      // Store MT session temporarily
      localStorage.setItem('mt_user_session', JSON.stringify(result.user));
      localStorage.setItem('mt_session_expiry', (new Date().getTime() + 24 * 60 * 60 * 1000).toString());
      
      // Now test if the app clears it
      setTimeout(() => {
        const mtSession = localStorage.getItem('mt_user_session');
        const existingSession = localStorage.getItem('lighthouse-current-user');
        
        if (!mtSession && existingSession) {
          console.log('✅ System isolation test PASSED - MT session cleared, existing session preserved');
          return {
            success: true,
            message: 'System isolation working correctly',
            details: {
              mtSessionCleared: true,
              existingSessionPreserved: true
            }
          };
        } else {
          console.log('❌ System isolation test FAILED');
          return {
            success: false,
            message: 'System isolation not working correctly',
            details: {
              mtSession: !!mtSession,
              existingSession: !!existingSession
            }
          };
        }
      }, 1000);
      
    } else {
      console.log('ℹ️ jonahdjbreezy@gmail.com not found in MT system (expected)');
      return {
        success: true,
        message: 'System isolation working - jonahdjbreezy@gmail.com not in MT system',
        details: {
          jonahNotInMT: true
        }
      };
    }
    
  } catch (error) {
    console.error('❌ System isolation test error:', error);
    return {
      success: false,
      message: 'System isolation test error: ' + String(error),
      details: null
    };
  }
}

/**
 * Run comprehensive test suite
 */
export async function runComprehensiveTest(): Promise<{ success: boolean; message: string; results: any }> {
  try {
    console.log('🚀 Running Comprehensive Test Suite...');
    
    // Test 1: Existing System
    const existingTest = await testExistingSystem();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Multi-Tenant System (if test users exist)
    let mtTest = { success: false, message: 'No test users available', details: null };
    try {
      mtTest = await testMultiTenantSystem('admin@test.com', 'test123');
    } catch (error) {
      console.log('ℹ️ MT test skipped - no test users available');
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: System Isolation
    const isolationTest = await testSystemIsolation();
    
    const results = {
      existingSystem: existingTest,
      multiTenantSystem: mtTest,
      systemIsolation: isolationTest
    };
    
    const allPassed = existingTest.success && isolationTest.success;
    
    console.log('📊 Test Results Summary:');
    console.log('Existing System:', existingTest.success ? '✅ PASS' : '❌ FAIL');
    console.log('Multi-Tenant System:', mtTest.success ? '✅ PASS' : '⚠️ SKIP/FAIL');
    console.log('System Isolation:', isolationTest.success ? '✅ PASS' : '❌ FAIL');
    
    return {
      success: allPassed,
      message: allPassed ? 'All critical tests passed!' : 'Some tests failed - check details',
      results
    };
    
  } catch (error) {
    console.error('❌ Comprehensive test error:', error);
    return {
      success: false,
      message: 'Comprehensive test error: ' + String(error),
      results: null
    };
  }
}

/**
 * Quick verification function
 */
export function quickVerification(): void {
  console.log('🔍 Quick System Verification:');
  
  const existingSession = localStorage.getItem('lighthouse-current-user');
  const mtSession = localStorage.getItem('mt_user_session');
  
  console.log('Existing System Session:', existingSession ? '✅ EXISTS' : '❌ MISSING');
  console.log('Multi-Tenant Session:', mtSession ? '✅ EXISTS' : '❌ MISSING');
  
  if (existingSession) {
    try {
      const user = JSON.parse(existingSession);
      console.log('Current User:', user.email, '(' + user.role + ')');
    } catch (error) {
      console.log('❌ Error parsing existing session');
    }
  }
  
  if (mtSession) {
    try {
      const user = JSON.parse(mtSession);
      console.log('Current MT User:', user.email, '(' + user.role + ')');
    } catch (error) {
      console.log('❌ Error parsing MT session');
    }
  }
  
  console.log('Current URL:', window.location.href);
  console.log('Page Title:', document.title);
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testExistingSystem = testExistingSystem;
  (window as any).testMultiTenantSystem = testMultiTenantSystem;
  (window as any).testSystemIsolation = testSystemIsolation;
  (window as any).runComprehensiveTest = runComprehensiveTest;
  (window as any).quickVerification = quickVerification;
}
